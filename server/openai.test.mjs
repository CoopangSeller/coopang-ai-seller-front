import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { generate, createAiHandler, imageSize } from './openai.mjs';
const env = { OPENAI_API_KEY: 'test-only-not-a-real-key' };
const json = { action: 'json', model: 'gpt-6-astra', prompt: 'Plan a product page', schema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: { type: 'STRING' } } } } };
const picture = { action: 'image', model: 'gpt-image-2.5-sunburst', prompt: 'A product', aspectRatio: '9:16', imageSize: '2K' };
test('structured output wraps root arrays and closes nested objects', async () => {
  const result = await generate(json, env, async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.equal(body.text.format.schema.properties.result.type, 'array');
    assert.equal(body.text.format.schema.properties.result.items.additionalProperties, false);
    assert.deepEqual(body.text.format.schema.properties.result.items.required, ['title']);
    return Response.json({ status: 'completed', output: [{ type: 'reasoning' }, { content: [{ type: 'output_text', text: '{"result":[{"title":"테스트"}]}' }] }] });
  });
  assert.deepEqual(result, [{ title: '테스트' }]);
});
test('image generation preserves 9:16 dimensions and returns PNG', async () => {
  const result = await generate(picture, env, async (url, options) => {
    assert.ok(url.endsWith('/images/generations'));
    assert.equal(JSON.parse(options.body).size, '1152x2048');
    return Response.json({ data: [{ b64_json: 'YWJj' }] });
  });
  assert.equal(result, 'data:image/png;base64,YWJj');
  assert.equal(imageSize('1:1','1024'), '1024x1024');
});
test('tracked responses expose token, image and search usage without changing default responses', async () => {
  const text = await generate({ ...json, includeUsage: true }, env, async () =>
    Response.json({
      status: 'completed',
      usage: {
        input_tokens: 120,
        output_tokens: 30,
        total_tokens: 150,
        input_tokens_details: { cached_tokens: 20, cache_write_tokens: 10 },
        output_tokens_details: { reasoning_tokens: 5 },
      },
      output: [{ content: [{ type: 'output_text', text: '{"result":[{"title":"테스트"}]}' }] }],
    }),
  );
  assert.deepEqual(text.value, [{ title: '테스트' }]);
  assert.equal(text.usage.totalTokens, 150);
  assert.equal(text.usage.cachedInputTokens, 20);
  assert.equal(text.usage.reasoningTokens, 5);

  const image = await generate({ ...picture, includeUsage: true }, env, async () =>
    Response.json({
      data: [{ b64_json: 'YWJj' }],
      usage: {
        input_tokens: 25,
        output_tokens: 100,
        input_tokens_details: { text_tokens: 5, image_tokens: 20 },
      },
    }),
  );
  assert.equal(image.value, 'data:image/png;base64,YWJj');
  assert.equal(image.usage.kind, 'image');
  assert.equal(image.usage.textInputTokens, 5);
  assert.equal(image.usage.imageInputTokens, 20);
});
test('reference product photos use multipart edits and preserve bytes', async () => {
  await generate({ ...picture, allowText: false, referenceImages: ['data:image/png;base64,YWJj'] }, env, async (url, options) => {
    assert.ok(url.endsWith('/images/edits'));
    assert.ok(options.body instanceof FormData);
    assert.equal(await options.body.get('image[]').text(), 'abc');
    assert.match(options.body.get('prompt'), /Do not add or invent text/);
    assert.equal(options.headers['Content-Type'], undefined);
    return Response.json({ data: [{ b64_json: 'YWJj' }] });
  });
});
test('transparent cleanup requests a PNG with transparent background', async () => {
  await generate({
    ...picture,
    background: 'transparent',
    referenceImages: ['data:image/png;base64,YWJj'],
  }, env, async (_url, options) => {
    assert.equal(options.body.get('background'), 'transparent');
    assert.equal(options.body.get('output_format'), 'png');
    return Response.json({ data: [{ b64_json: 'YWJj' }] });
  });
});
test('research enables web search and returns cited sources', async () => {
  const result = await generate({
    ...json,
    action: 'research',
    referenceImages: ['data:image/jpeg;base64,YWJj'],
  }, env, async (url, options) => {
    assert.ok(url.endsWith('/responses'));
    const body = JSON.parse(options.body);
    assert.deepEqual(body.tools, [{ type: 'web_search' }]);
    assert.deepEqual(body.include, ['web_search_call.action.sources']);
    assert.equal(body.input[0].content[1].type, 'input_image');
    return Response.json({
      status: 'completed',
      output: [
        {
          type: 'web_search_call',
          action: {
            sources: [
              { title: '공식 자료', url: 'https://example.go.kr/product' },
              { title: '공식 자료 중복', url: 'https://example.go.kr/product' },
            ],
          },
        },
        { content: [{ type: 'output_text', text: '{"result":[{"title":"소구점"}]}' }] },
      ],
    });
  });
  assert.deepEqual(result.research, [{ title: '소구점' }]);
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].kind, 'official');
});
test('missing key never sends a request', async () => {
  await assert.rejects(generate(json, {}, () => assert.fail('Unexpected network call')), { code: 'missing_api_key' });
});
test('invalid refs and model overrides never send a request', async () => {
  const noFetch = () => assert.fail('Unexpected network call');
  await assert.rejects(generate({ ...picture, referenceImages: ['https://example.com/a.png'] }, env, noFetch), { status: 400 });
  await assert.rejects(generate({ ...json, model: 'unknown' }, env, noFetch), { status: 400 });
});
test('upstream errors hide credentials and preserve status', async () => {
  await assert.rejects(generate(json, env, async () => Response.json({ error: { message: env.OPENAI_API_KEY } }, { status: 401 })), error => error.status === 401 && !error.message.includes(env.OPENAI_API_KEY));
  await assert.rejects(generate(json, env, async () => Response.json({ status: 'incomplete' })), { code: 'incomplete_response' });
});
test('HTTP middleware handles method, malformed input and absent credentials', async () => {
  const server = createServer(createAiHandler({}, () => assert.fail('Unexpected network call')));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = 'http://127.0.0.1:' + server.address().port;
    assert.equal((await fetch(url)).status, 405);
    assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, 'missing_api_key');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('HTTP middleware rate-limits requests and image bursts', async () => {
  const server = createServer(createAiHandler(
    { ...env, AI_RATE_LIMIT_PER_MINUTE: '2', AI_IMAGE_RATE_LIMIT_PER_MINUTE: '1' },
    async () => Response.json({
      status: 'completed',
      output: [{ content: [{ type: 'output_text', text: '{"result":[]}' }] }],
    }),
  ));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = 'http://127.0.0.1:' + server.address().port;
    const headers = { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.0.2.77' };
    const first = await fetch(url, { method: 'POST', headers, body: JSON.stringify(json) });
    const second = await fetch(url, { method: 'POST', headers, body: JSON.stringify(json) });
    const third = await fetch(url, { method: 'POST', headers, body: JSON.stringify(json) });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 429);
    assert.equal(third.headers.get('retry-after'), '60');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
