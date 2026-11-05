import { test, expect } from '@playwright/test';

test('compare table includes landing rate row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?a=B1067&b=B1058');
  await page.waitForSelector('body[data-ready="1"]');
  await page.locator('#cmp').scrollIntoViewIfNeeded();
  await expect(page.locator('#ctable')).toContainText('Landing rate');
  await expect(page.locator('#ctable')).toContainText('%');
});
