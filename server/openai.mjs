const TEXT_MODELS = ['gpt-6-astra', 'gpt-4.1'];
const IMAGE_MODELS = ['gpt-image-2.5-sunburst', 'gpt-image-2.5-flare'];
const MAX_BYTES = 4 * 1024 * 1024;
const RATE_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT = 10;
const DEFAULT_IMAGE_RATE_LIMIT = 3;
const rateBuckets = new Map();
const failure = (message, status = 400, code = 'invalid_request') =>
  Object.assign(new Error(message), { status, code });

function positiveLimit(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 1000) : fallback;
}

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded ?? '').split(',')[0].trim();
  return firstForwarded || req.socket?.remoteAddress || 'unknown';
}

function enforceRateLimit(req, env, action) {
  const now = Date.now();
  const key = clientKey(req);
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    bucket = { startedAt: now, count: 0, imageCount: 0 };
  }
  bucket.count += 1;
  if (action === 'image') bucket.imageCount += 1;
  rateBuckets.set(key, bucket);

  if (rateBuckets.size > 5000) {
    for (const [bucketKey, value] of rateBuckets) {
      if (now - value.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(bucketKey);
    }
  }

  const maxRequests = positiveLimit(env.AI_RATE_LIMIT_PER_MINUTE, DEFAULT_RATE_LIMIT);
  const maxImages = positiveLimit(env.AI_IMAGE_RATE_LIMIT_PER_MINUTE, DEFAULT_IMAGE_RATE_LIMIT);
  if (bucket.count > maxRequests || (action === 'image' && bucket.imageCount > maxImages)) {
    const retryAfter = Math.max(1, Math.ceil((bucket.startedAt + RATE_WINDOW_MS - now) / 1000));
    throw Object.assign(
      failure('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.', 429, 'rate_limited'),
      { retryAfter },
    );
  }
}

export function strictSchema(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw failure('JSON 스키마가 필요합니다.');
  }
  const out = { ...schema, type: String(schema.type).toLowerCase() };
  if (out.type === 'object') {
    out.properties = Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([key, value]) => [key, strictSchema(value)]),
    );
    out.required = Object.keys(out.properties);
    out.additionalProperties = false;
  }
  if (out.type === 'array') out.items = strictSchema(schema.items);
  return out;
}

export function imageSize(aspect, requested) {
  if (!['1:1', '9:16'].includes(aspect)) throw failure('지원하지 않는 이미지 비율입니다.');
  if (aspect === '1:1') {
    return requested === '4K' || requested === '2K' ? '2048x2048' : '1024x1024';
  }
  return requested === '4K' ? '2160x3840' : requested === '2K' ? '1152x2048' : '864x1536';
}

function validateReferences(refs, max = 5) {
  if (!Array.isArray(refs) || refs.length > max) {
    throw failure(`참고사진은 최대 ${max}장까지 지원합니다.`);
  }
  return refs.map((ref) => {
    const match =
      typeof ref === 'string' &&
      ref.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/);
    if (!match) throw failure('참고사진은 PNG, JPEG 또는 WebP 형식이어야 합니다.');
    return { dataUrl: ref, mime: match[1], bytes: Buffer.from(match[2], 'base64') };
  });
}

function sourceKind(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'video';
    if (host.includes('coupang.') || host.includes('naver.com') || host.includes('11st.')) return 'market';
    if (host.includes('go.kr') || host.includes('or.kr')) return 'official';
  } catch {}
  return 'article';
}

function extractSources(data) {
  const found = new Map();
  const add = (source) => {
    const url = source?.url;
    if (typeof url !== 'string' || !/^https?:\/\//.test(url) || found.has(url)) return;
    found.set(url, {
      id: `source-${found.size + 1}`,
      title: String(source?.title || new URL(url).hostname),
      url,
      kind: sourceKind(url),
    });
  };
  for (const item of data?.output ?? []) {
    for (const source of item?.action?.sources ?? []) add(source);
    for (const content of item?.content ?? []) {
      for (const annotation of content?.annotations ?? []) {
        if (annotation?.type === 'url_citation') add(annotation);
      }
    }
  }
  return [...found.values()];
}

function responseText(data) {
  const content = (data?.output ?? []).flatMap((item) => item.content ?? []);
  if (content.some((item) => item.type === 'refusal')) {
    throw failure('OpenAI가 이 요청의 생성을 거절했습니다.', 422, 'refusal');
  }
  return content
    .filter((item) => item.type === 'output_text')
    .map((item) => item.text)
    .join('');
}

function parseStructuredResult(data) {
  if (data?.status !== 'completed') {
    throw failure('OpenAI 텍스트 생성이 완료되지 않았습니다.', 502, 'incomplete_response');
  }
  try {
    const parsed = JSON.parse(responseText(data));
    if (!Object.hasOwn(parsed, 'result')) throw Error('missing result');
    return parsed.result;
  } catch (error) {
    if (error?.code) throw error;
    throw failure('OpenAI JSON 응답을 읽을 수 없습니다.', 502, 'invalid_response');
  }
}

const asCount = (value) => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
};

function normalizeUsage(data, model, isImage) {
  const usage = data?.usage ?? {};
  const inputDetails = usage.input_tokens_details ?? {};
  const outputDetails = usage.output_tokens_details ?? {};
  const inputTokens = asCount(usage.input_tokens);
  const outputTokens = asCount(usage.output_tokens);
  const webSearchCalls = (data?.output ?? []).filter(
    (item) => item?.type === 'web_search_call',
  ).length;

  return {
    model,
    kind: isImage ? 'image' : 'text',
    requestCount: 1,
    inputTokens,
    outputTokens,
    totalTokens: asCount(usage.total_tokens) || inputTokens + outputTokens,
    cachedInputTokens: asCount(inputDetails.cached_tokens),
    cacheWriteInputTokens: asCount(inputDetails.cache_write_tokens),
    textInputTokens: isImage ? asCount(inputDetails.text_tokens) : inputTokens,
    imageInputTokens: isImage ? asCount(inputDetails.image_tokens) : 0,
    reasoningTokens: asCount(outputDetails.reasoning_tokens),
    webSearchCalls,
  };
}

function withOptionalUsage(value, data, body, model, isImage) {
  if (body.includeUsage !== true) return value;
  return { value, usage: normalizeUsage(data, model, isImage) };
}

export async function generate(body, env, fetcher = fetch, signal) {
  if (!body || !['json', 'research', 'image'].includes(body.action)) {
    throw failure('지원하지 않는 AI 작업입니다.');
  }
  if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 40000) {
    throw failure('프롬프트를 확인해 주세요.');
  }

  const isImage = body.action === 'image';
  const choices = isImage ? IMAGE_MODELS : TEXT_MODELS;
  const index = choices.indexOf(body.model);
  if (index < 0) throw failure('지원하지 않는 AI 모델입니다.');
  const envNames = isImage
    ? ['OPENAI_IMAGE_MODEL', 'OPENAI_IMAGE_BASIC_MODEL']
    : ['OPENAI_TEXT_MODEL', 'OPENAI_TEXT_FALLBACK_MODEL'];
  const model = env[envNames[index]]?.trim() || choices[index];
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw failure('서버에 OPENAI_API_KEY를 설정한 후 다시 실행해 주세요.', 503, 'missing_api_key');
  }

  const headers = { Authorization: 'Bearer ' + key };
  let endpoint;
  let payload;

  if (!isImage) {
    const schema = strictSchema(body.schema);
    const refs = validateReferences(body.referenceImages ?? [], 5);
    const input = refs.length
      ? [{
          role: 'user',
          content: [
            { type: 'input_text', text: body.prompt + '\nReturn the requested result inside the JSON property "result".' },
            ...refs.map((ref) => ({ type: 'input_image', image_url: ref.dataUrl, detail: 'low' })),
          ],
        }]
      : body.prompt + '\nReturn the requested result inside the JSON property "result".';

    endpoint = 'responses';
    headers['Content-Type'] = 'application/json';
    const request = {
      model,
      store: false,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'result',
          strict: true,
          schema: {
            type: 'object',
            properties: { result: schema },
            required: ['result'],
            additionalProperties: false,
          },
        },
      },
    };
    if (body.action === 'research') {
      request.tools = [{ type: 'web_search' }];
      request.tool_choice = 'auto';
      request.include = ['web_search_call.action.sources'];
      request.max_tool_calls = 4;
    }
    payload = JSON.stringify(request);
  } else {
    const refs = validateReferences(body.referenceImages ?? [], 5);
    const quality = body.quality ?? 'medium';
    if (!['low', 'medium', 'high'].includes(quality)) {
      throw failure('지원하지 않는 이미지 품질입니다.');
    }
    const background = body.background ?? 'opaque';
    if (!['opaque', 'transparent'].includes(background)) {
      throw failure('지원하지 않는 배경 형식입니다.');
    }
    const prompt =
      body.prompt +
      '\nProfessional ecommerce product photography. Preserve the exact reference product identity.' +
      (body.allowText === false
        ? '\nDo not add or invent text, letters, numbers, captions, logos or watermarks. Preserve only genuine package text and genuine logos already visible in a reference product.'
        : '');
    const options = {
      model,
      prompt,
      n: 1,
      size: imageSize(body.aspectRatio, body.imageSize),
      quality,
      background,
      output_format: 'png',
    };
    if (refs.length) {
      endpoint = 'images/edits';
      payload = new FormData();
      for (const [name, value] of Object.entries(options)) payload.append(name, String(value));
      refs.forEach((ref, i) => {
        if (!ref.bytes.length) throw failure('참고사진이 비어 있습니다.');
        payload.append(
          'image[]',
          new Blob([ref.bytes], { type: ref.mime }),
          `reference-${i}.${ref.mime.split('/')[1]}`,
        );
      });
    } else {
      endpoint = 'images/generations';
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(options);
    }
  }

  const response = await fetcher('https://api.openai.com/v1/' + endpoint, {
    method: 'POST',
    headers,
    body: payload,
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      response.status === 401
        ? 'OpenAI API 키가 올바르지 않습니다.'
        : response.status === 429
          ? 'OpenAI 사용 한도 또는 요청 한도에 도달했습니다. 결제와 사용량을 확인해 주세요.'
          : response.status === 403 || response.status === 404
            ? 'OpenAI 모델 접근 권한 또는 모델 설정을 확인해 주세요.'
            : response.status >= 500
              ? 'OpenAI 서버 오류입니다. 잠시 후 다시 시도해 주세요.'
              : 'OpenAI가 생성 요청을 처리하지 못했습니다. 입력 내용과 참고사진을 확인해 주세요.';
    throw failure(message, response.status, data?.error?.code || 'upstream_error');
  }

  if (isImage) {
    const base64 = data?.data?.[0]?.b64_json;
    if (!base64) throw failure('OpenAI 응답에 이미지가 없습니다.', 502, 'empty_image');
    return withOptionalUsage(
      'data:image/png;base64,' + base64,
      data,
      body,
      model,
      true,
    );
  }

  const result = parseStructuredResult(data);
  const value =
    body.action === 'research' ? { research: result, sources: extractSources(data) } : result;
  return withOptionalUsage(value, data, body, model, false);
}

async function readBody(req) {
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BYTES) {
      throw failure('참고사진을 줄여 주세요. 요청은 4MB까지 가능합니다.', 413);
    }
    try {
      return JSON.parse(raw);
    } catch {
      throw failure('잘못된 JSON 요청입니다.');
    }
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) throw failure('참고사진을 줄여 주세요. 요청은 4MB까지 가능합니다.', 413);
    chunks.push(Buffer.from(chunk));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw failure('잘못된 JSON 요청입니다.');
  }
}

export function createAiHandler(env = process.env, fetcher = fetch) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 200000);
    const abort = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.on('close', abort);
    try {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        throw failure('POST 요청만 지원합니다.', 405);
      }
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) {
        throw failure('허용되지 않은 요청입니다.', 403);
      }
      if (!req.headers['content-type']?.includes('application/json')) {
        throw failure('JSON 요청이 필요합니다.', 415);
      }
      const body = await readBody(req);
      enforceRateLimit(req, env, body?.action);
      const result = await generate(body, env, fetcher, controller.signal);
      res.statusCode = 200;
      res.end(JSON.stringify({ result }));
    } catch (error) {
      res.statusCode = controller.signal.aborted ? 504 : error.status || 500;
      if (error?.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
      res.end(
        JSON.stringify({
          error: {
            code: controller.signal.aborted ? 'timeout' : error.code || 'internal_error',
            message: controller.signal.aborted
              ? 'AI 생성 시간이 초과됐습니다. 다시 시도해 주세요.'
              : error.status
                ? error.message
                : 'AI 서버 연결 중 오류가 발생했습니다.',
          },
        }),
      );
    } finally {
      clearTimeout(timeout);
      res.off('close', abort);
    }
  };
}
