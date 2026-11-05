import { test, expect } from '@playwright/test';

test('match count highlights when filters shrink the fleet', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#matchn')).not.toHaveClass(/hot/);
  await page.click('#quick button[data-st="active"]');
  await expect(page.locator('#matchn')).toHaveClass(/hot/);
  await page.click('#quick button[data-st="all"]');
  await expect(page.locator('#matchn')).not.toHaveClass(/hot/);
});
