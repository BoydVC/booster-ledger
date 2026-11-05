import { test, expect } from '@playwright/test';

test('quick Active chip sets aria-pressed and filters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await page.click('#quick button[data-st="active"]');
  await expect(page.locator('#quick button[data-st="active"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#status')).toHaveValue('active');
  const n = await page.locator('#matchn').textContent();
  expect(n).toMatch(/^\d+ shown$/);
  const shown = Number(n.split(' ')[0]);
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(94);
  await page.click('#quick button[data-st="all"]');
  await expect(page.locator('#quick button[data-st="all"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#matchn')).toHaveText('94 shown');
});
