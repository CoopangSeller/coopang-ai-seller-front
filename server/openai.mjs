const TEXT_MODELS = ['gpt-6-astra', 'gpt-4.1'];
const IMAGE_MODELS = ['gpt-image-2.5-sunburst', 'gpt-image-2.5-flare'];
const MAX_BYTES = 4 * 1024 * 1024;
const failure = (message, status = 400, code = 'invalid_request') => Object.assign(new Error(message), { status, code });

export function strictSchema(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw failure('JSON 스키마가 필요합니다.');
  const out = { ...schema, type: String(schema.type).toLowerCase() };
  if (out.type === 'object') {
    out.properties = Object.fromEntries(Object.entries(schema.properties ?? {}).map(([key, value]) => [key, strictSchema(value)]));
    out.required = Object.keys(out.properties);
    out.additionalProperties = false;
  }
  if (out.type === 'array') out.items = strictSchema(schema.items);
  return out;
}

export function imageSize(aspect, requested) {
  if (!['1:1', '9:16'].includes(aspect)) throw failure('지원하지 않는 이미지 비율입니다.');
  if (aspect === '1:1') return requested === '4K' ? '2048x2048' : requested === '2K' ? '2048x2048' : '1024x1024';
  return requested === '4K' ? '2160x3840' : requested === '2K' ? '1152x2048' : '864x1536';
}

export async function generate(body, env, fetcher = fetch, signal) {
  if (!body || !['json', 'image'].includes(body.action)) throw failure('지원하지 않는 AI 작업입니다.');
  if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 40000) throw failure('프롬프트를 확인해 주세요.');
  const isImage = body.action === 'image';
  const choices = isImage ? IMAGE_MODELS : TEXT_MODELS;
  const index = choices.indexOf(body.model);
  if (index < 0) throw failure('지원하지 않는 AI 모델입니다.');
  const envNames = isImage ? ['OPENAI_IMAGE_MODEL', 'OPENAI_IMAGE_BASIC_MODEL'] : ['OPENAI_TEXT_MODEL', 'OPENAI_TEXT_FALLBACK_MODEL'];
  const model = env[envNames[index]]?.trim() || choices[index];
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) throw failure('서버의 OPENAI_API_KEY를 설정한 후 다시 실행해 주세요.', 503, 'missing_api_key');
  const headers = { Authorization: 'Bearer ' + key };
  let endpoint;
  let payload;
  if (!isImage) {
    const schema = strictSchema(body.schema);
    endpoint = 'responses';
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify({ model, store: false,
      input: body.prompt + '\nReturn the requested result inside the JSON property "result".',
      text: { format: { type: 'json_schema', name: 'result', strict: true,
        schema: { type: 'object', properties: { result: schema }, required: ['result'], additionalProperties: false },
      } },
    });
  } else {
    const refs = body.referenceImages ?? [];
    if (!Array.isArray(refs) || refs.length > 16) throw failure('참고사진은 최대 16장까지 지원합니다.');
    const quality = body.quality ?? 'medium';
    if (!['low', 'medium', 'high'].includes(quality)) throw failure('지원하지 않는 이미지 품질입니다.');
    const prompt = body.prompt + '\nProfessional ecommerce product photography. Preserve the exact reference product identity.' +
      (body.allowText === false ? '\nDO NOT render any text, letters, numbers, captions or watermarks.' : '');
    const options = { model, prompt, n: 1, size: imageSize(body.aspectRatio, body.imageSize), quality, output_format: 'png' };
    if (refs.length) {
      endpoint = 'images/edits';
      payload = new FormData();
      for (const [name, value] of Object.entries(options)) payload.append(name, String(value));
      refs.forEach((ref, i) => {
        const match = typeof ref === 'string' && ref.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/);
        if (!match) throw failure('참고사진은 PNG, JPEG 또는 WebP 형식이어야 합니다.');
        const bytes = Buffer.from(match[2], 'base64');
        if (!bytes.length) throw failure('참고사진이 비어 있습니다.');
        payload.append('image[]', new Blob([bytes], { type: match[1] }), 'reference-' + i + '.' + match[1].split('/')[1]);
      });
    } else {
      endpoint = 'images/generations';
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(options);
    }
  }
  const response = await fetcher('https://api.openai.com/v1/' + endpoint, { method: 'POST', headers, body: payload, signal });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 401 ? 'OpenAI API 키가 올바르지 않습니다.' :
      response.status === 429 ? 'OpenAI 사용 한도 또는 요청 제한에 도달했습니다. 결제·사용량을 확인해 주세요.' :
      response.status === 403 || response.status === 404 ? 'OpenAI 모델 접근 권한 또는 모델 설정을 확인해 주세요.' :
      response.status >= 500 ? 'OpenAI 서버 오류입니다. 잠시 후 다시 시도해 주세요.' : 'OpenAI가 생성 요청을 처리하지 못했습니다. 입력 내용과 참고사진을 확인해 주세요.';
    throw failure(message, response.status, data?.error?.code || 'upstream_error');
  }
  if (isImage) {
    const base64 = data?.data?.[0]?.b64_json;
    if (!base64) throw failure('OpenAI 응답에 이미지가 없습니다.', 502, 'empty_image');
    return 'data:image/png;base64,' + base64;
  }
  if (data?.status !== 'completed') throw failure('OpenAI 텍스트 생성이 완료되지 않았습니다.', 502, 'incomplete_response');
  const content = (data.output ?? []).flatMap(item => item.content ?? []);
  if (content.some(item => item.type === 'refusal')) throw failure('OpenAI가 이 요청의 생성을 거절했습니다.', 422, 'refusal');
  const text = content.filter(item => item.type === 'output_text').map(item => item.text).join('');
  try {
    const parsed = JSON.parse(text);
    if (!Object.hasOwn(parsed, 'result')) throw Error('missing result');
    return parsed.result;
  } catch { throw failure('OpenAI JSON 응답을 읽을 수 없습니다.', 502, 'invalid_response'); }
}

async function readBody(req) {
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BYTES) throw failure('참고사진을 줄여 주세요. 요청은 4MB까지 가능합니다.', 413);
    try { return JSON.parse(raw); } catch { throw failure('잘못된 JSON 요청입니다.'); }
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) throw failure('참고사진을 줄여 주세요. 요청은 4MB까지 가능합니다.', 413);
    chunks.push(Buffer.from(chunk));
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw failure('잘못된 JSON 요청입니다.'); }
}

export function createAiHandler(env = process.env, fetcher = fetch) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 200000);
    const abort = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', abort);
    try {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw failure('POST 요청만 지원합니다.', 405); }
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw failure('허용되지 않은 요청입니다.', 403);
      if (!req.headers['content-type']?.includes('application/json')) throw failure('JSON 요청이 필요합니다.', 415);
      const body = await readBody(req);
      const result = await generate(body, env, fetcher, controller.signal);
      res.statusCode = 200;
      res.end(JSON.stringify({ result }));
    } catch (error) {
      res.statusCode = controller.signal.aborted ? 504 : error.status || 500;
      res.end(JSON.stringify({ error: {
        code: controller.signal.aborted ? 'timeout' : error.code || 'internal_error',
        message: controller.signal.aborted ? 'AI 생성 시간이 초과됐습니다. 다시 시도해 주세요.' : error.status ? error.message : 'AI 서버 연결 중 오류가 발생했습니다.',
      } }));
    } finally { clearTimeout(timeout); res.off('close', abort); }
  };
}
