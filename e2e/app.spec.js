import { test, expect } from '@playwright/test';
test('stats and lanes render', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('.stat').first()).toBeVisible();
  expect(await page.locator('.lane').count()).toBeGreaterThan(40);
  await expect(page.locator('#top button').first()).toContainText('flights');
});
test('search filters', async ({ page }) => {
  await page.goto('/'); await page.fill('#q', 'B1067'); await expect(page.locator('.lane')).toHaveCount(1);
});
test('status filter', async ({ page }) => {
  await page.goto('/'); await page.selectOption('#status', 'active');
  const n = await page.locator('.lane').count(); expect(n).toBeGreaterThan(0); expect(n).toBeLessThan(40);
});
test('drawer opens with source link', async ({ page }) => {
  await page.goto('/'); await page.locator('#top button').first().click();
  await expect(page.locator('#drawer')).toBeVisible(); await expect(page.locator('#detail a').last()).toHaveAttribute('href', /thespacedevs/);
  await page.click('#close'); await expect(page.locator('#drawer')).toBeHidden();
});
test('replay shows years', async ({ page }) => {
  await page.goto('/'); await page.click('#play'); await expect(page.locator('#year')).toContainText('flying');
});
test('phone layout has no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= 392)).toBe(true);
});
test('footer cites source', async ({ page }) => { await page.goto('/'); await expect(page.locator('footer a')).toHaveAttribute('href', /thespacedevs/); });
test('server blocks traversal', async ({ request }) => { const r = await request.get('/..%2fserver.js'); expect([403,404]).toContain(r.status()); });
