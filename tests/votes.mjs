// Run against a local preview only. Test votes are removed in finally.
import assert from 'node:assert/strict';
const base = process.env.VOTE_TEST_URL || 'http://localhost:3001';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Use a local test database.');
const endpoint = `${base}/api/votes`;
async function call(method = 'GET', cookie, choice, origin = base) {
  const response = await fetch(endpoint, { method, headers: {
    ...(cookie ? { Cookie: cookie } : {}), ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
  }, ...(method === 'POST' ? { body: JSON.stringify({ choice }) } : {}) });
  const text = await response.text();
  return { response, data: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : { error: text } };
}
const first = await call();
assert.equal(first.response.status, 200);
assert.match(first.response.headers.get('cache-control'), /no-store/);
assert.match(first.response.headers.get('set-cookie'), /HttpOnly/);
assert.match(first.response.headers.get('set-cookie'), /SameSite=Strict/);
const cookieA = first.response.headers.get('set-cookie').split(';')[0];
const second = await call();
const cookieB = second.response.headers.get('set-cookie').split(';')[0];
assert.notEqual(cookieA, cookieB);
const initial = first.data.total;
try {
  assert.equal((await call('POST', undefined, 'egalitarian')).response.status, 400);
  assert.equal((await call('POST', cookieA, 'egalitarian', 'https://example.com')).response.status, 403);
  assert.equal((await call('POST', cookieA, 'not-a-future')).response.status, 400);
  assert.equal((await call('POST', cookieA, 'egalitarian')).data.total, initial + 1);
  const retries = await Promise.all(Array.from({ length: 8 }, () => call('POST', cookieA, 'egalitarian')));
  assert.ok(retries.every(r => r.response.status === 200 && r.data.total === initial + 1));
  const changed = await call('POST', cookieA, 'libertarian');
  assert.equal(changed.data.total, initial + 1);
  assert.equal(changed.data.choice, 'libertarian');
  const other = await call('POST', cookieB, 'protector');
  assert.equal(other.data.total, initial + 2);
  assert.equal(other.data.choice, 'protector');
  const returning = await call('GET', cookieA);
  assert.equal(returning.data.choice, 'libertarian');
  assert.equal(returning.data.counts.reduce((sum, s) => sum + s.votes, 0), returning.data.total);
  assert.equal(returning.response.headers.get('set-cookie'), null);
  assert.deepEqual(Object.keys(returning.data).sort(), ['choice', 'counts', 'total']);
  assert.equal((await call('DELETE', cookieA)).data.total, initial + 1);
  assert.equal((await call('DELETE', cookieA)).data.total, initial + 1);
  console.log('PASS: cookie identity, validation, cross-origin protection, concurrent deduplication, vote changes, separate visitors, returning visitors, and removal.');
} finally {
  await call('DELETE', cookieA);
  await call('DELETE', cookieB);
  assert.equal((await call()).data.total, initial);
}
