import { test, expect } from '@playwright/test';

test('year scrubber always shows flying count', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#year')).toContainText('flying');
  await page.locator('#scrub').fill('5');
  await expect(page.locator('#year')).toHaveText(/^\d{4} · \d+ flying$/);
});
