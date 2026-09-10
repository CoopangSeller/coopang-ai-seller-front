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
test('reference product photos use multipart edits and preserve bytes', async () => {
  await generate({ ...picture, allowText: false, referenceImages: ['data:image/png;base64,YWJj'] }, env, async (url, options) => {
    assert.ok(url.endsWith('/images/edits'));
    assert.ok(options.body instanceof FormData);
    assert.equal(await options.body.get('image[]').text(), 'abc');
    assert.match(options.body.get('prompt'), /DO NOT render/);
    assert.equal(options.headers['Content-Type'], undefined);
    return Response.json({ data: [{ b64_json: 'YWJj' }] });
  });
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
