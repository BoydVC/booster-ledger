import { test, expect } from '@playwright/test';
test('malformed percent-encoding returns 400 and server survives', async ({ request }) => {
  expect((await request.get('/%E0%A4%A')).status()).toBe(400);
  expect((await request.get('/')).status()).toBe(200);
});
test('null byte rejected', async ({ request }) => expect([400, 403, 404]).toContain((await request.get('/index.html%00.js')).status()));
test('POST rejected', async ({ request }) => expect((await request.post('/')).status()).toBe(405));
test('security headers', async ({ request }) => { const r = await request.get('/'); expect(r.headers()['x-content-type-options']).toBe('nosniff'); expect(r.headers()['content-security-policy']).toContain("default-src 'self'"); });
test('encoded traversal blocked', async ({ request }) => expect([403, 404]).toContain((await request.get('/..%2fpackage.json')).status()));
test('no external requests at runtime', async ({ page }) => {
  const ext = []; page.on('request', q => { if (!q.url().startsWith('http://127.0.0.1')) ext.push(q.url()); });
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]'); expect(ext).toEqual([]);
});
