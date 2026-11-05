import { test, expect } from '@playwright/test';
test('? opens help and Esc closes', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]');
  await page.keyboard.press('?');
  await expect(page.locator('#help')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help')).toBeHidden();
});
