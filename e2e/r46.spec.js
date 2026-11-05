import { test, expect } from '@playwright/test';

test('r opens a deterministic active booster with ?seed=', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?seed=7');
  await page.waitForSelector('body[data-ready="1"]');
  await page.keyboard.press('r');
  await expect(page.locator('#drawer')).toBeVisible();
  const a = await page.locator('#dserial').textContent();
  await page.keyboard.press('Escape');
  await page.goto('/?seed=7');
  await page.waitForSelector('body[data-ready="1"]');
  await page.keyboard.press('r');
  await expect(page.locator('#dserial')).toHaveText(a);
  // different seed -> often different (not guaranteed if pool tiny, but 21 active)
  await page.goto('/?seed=8');
  await page.waitForSelector('body[data-ready="1"]');
  await page.keyboard.press('r');
  await expect(page.locator('#dserial')).not.toHaveText(a);
});
