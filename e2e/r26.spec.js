import { test, expect } from '@playwright/test';
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };
const yearNum = async page => {
  const t = await page.locator('#year').textContent();
  const m = /^(\d{4})/.exec(t);
  return m ? Number(m[1]) : null;
};

test('[ and ] nudge the as-of year', async ({ page }) => {
  await go(page);
  await page.keyboard.press('[');
  await expect(page.locator('#year')).toHaveText(/^\d{4} · \d+ flying$/);
  const y1 = await yearNum(page);
  await page.keyboard.press('[');
  const y2 = await yearNum(page);
  expect(y2).toBe(y1 - 1);
  await page.keyboard.press(']');
  expect(await yearNum(page)).toBe(y1);
  await expect(page.locator('#year')).toHaveText(new RegExp(`^${y1} · \\d+ flying$`));
});
