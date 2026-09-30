// Run against a local preview only. Test responses are removed in finally.
import assert from 'node:assert/strict';
const base = process.env.VOTE_TEST_URL || 'http://localhost:3001';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Use a local test database.');
const endpoint = `${base}/api/survey`;
async function call(method = 'GET', cookie, answers, origin = base) {
  const response = await fetch(endpoint, { method, headers: {
    ...(cookie ? { Cookie: cookie } : {}), ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
  }, ...(method === 'POST' ? { body: JSON.stringify({ answers }) } : {}) });
  const text = await response.text();
  return { response, data: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : { error: text } };
}
const first = await call();
assert.equal(first.response.status, 200);
assert.match(first.response.headers.get('set-cookie'), /HttpOnly/);
assert.equal(first.data.mine, null);
const cookieA = first.response.headers.get('set-cookie').split(';')[0];
const cookieB = (await call()).response.headers.get('set-cookie').split(';')[0];
const initial = first.data.total;
const a = [1, 1, 0, -1, -1], b = [1, -1, null, -1, 0];
try {
  assert.equal((await call('POST', undefined, a)).response.status, 400);
  assert.equal((await call('POST', cookieA, a, 'https://example.com')).response.status, 403);
  assert.equal((await call('POST', cookieA, [1, 2, 0, 0, 0])).response.status, 400);
  assert.equal((await call('POST', cookieA, [1, 0])).response.status, 400);
  assert.equal((await call('POST', cookieA, [null, null, null, null, null])).response.status, 400);
  const saved = await call('POST', cookieA, a);
  assert.equal(saved.data.total, initial + 1);
  assert.deepEqual(saved.data.mine.answers, a);
  assert.equal(saved.data.mine.topMatch, 'reversion');
  const retries = await Promise.all(Array.from({ length: 8 }, () => call('POST', cookieA, a)));
  assert.ok(retries.every(r => r.response.status === 200 && r.data.total === initial + 1));
  const other = await call('POST', cookieB, b);
  assert.equal(other.data.total, initial + 2);
  const q1 = other.data.questions[0];
  assert.ok(q1['1'] >= 2);
  const changed = await call('POST', cookieA, b);
  assert.equal(changed.data.total, initial + 2);
  assert.deepEqual((await call('GET', cookieA)).data.mine.answers, b);
  assert.equal((await call('DELETE', cookieA)).data.mine, null);
  assert.equal((await call('GET')).data.total, initial + 1);
  console.log('PASS: cookie identity, validation, cross-origin protection, deduplication, updates, aggregates, and removal.');
} finally {
  await call('DELETE', cookieA); await call('DELETE', cookieB);
}
