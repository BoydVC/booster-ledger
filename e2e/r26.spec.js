import { test, expect } from '@playwright/test';
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };

test('[ and ] nudge the as-of year', async ({ page }) => {
  await go(page);
  await page.keyboard.press('[');
  await expect(page.locator('#year')).not.toHaveText('');
  const y1 = await page.locator('#year').textContent();
  await page.keyboard.press('[');
  const y2 = await page.locator('#year').textContent();
  expect(Number(y2)).toBe(Number(y1) - 1);
  await page.keyboard.press(']');
  await expect(page.locator('#year')).toHaveText(y1);
});
