import { test, expect } from '@playwright/test';
test('compare table includes block and landing spots', async ({ page }) => {
  await page.goto('/?a=B1067&b=B1058');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#ctable tr[data-k="_block"]')).toContainText('Block 5');
  await expect(page.locator('#ctable tr[data-k^="spot-"]').first()).toBeVisible();
});
