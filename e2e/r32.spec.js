import { test, expect } from '@playwright/test';
test('match count updates with filters', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#matchn')).toContainText('94 shown');
  await page.locator('#quick button[data-st="active"]').click();
  const n = await page.locator('#lanes .lane').count();
  await expect(page.locator('#matchn')).toHaveText(`${n} shown`);
});
