import { test, expect } from '@playwright/test';

test('status dropdown keeps quick chips in sync', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await page.selectOption('#status', 'expended');
  await expect(page.locator('#quick button[data-st="expended"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#quick button[data-st="active"]')).toHaveAttribute('aria-pressed', 'false');
});
