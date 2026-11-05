import { test, expect } from '@playwright/test';

test('?status=active restores filter and pressed chip', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?status=active');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#status')).toHaveValue('active');
  await expect(page.locator('#quick button[data-st="active"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#matchn')).toHaveClass(/hot/);
});

test('help dialog lists random booster key', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await page.keyboard.press('?');
  await expect(page.locator('#help')).toBeVisible();
  await expect(page.locator('#help')).toContainText('random active booster');
});
