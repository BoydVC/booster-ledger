import { test, expect } from '@playwright/test';
test('default sort puts record holder first', async ({ page }) => {
  await page.goto('/'); const first = await page.locator('.lane').first().getAttribute('data-s');
  await expect(page.locator('#top button').first()).toContainText(first);
});
test('sort select changes order', async ({ page }) => {
  await page.goto('/'); const a = await page.locator('.lane').first().getAttribute('data-s');
  await page.selectOption('#sort', 'first'); const b = await page.locator('.lane').first().getAttribute('data-s'); expect(a).not.toBe(b);
});
test('fate bar and legend', async ({ page }) => { await page.goto('/'); expect(await page.locator('#fate span').count()).toBeGreaterThan(1); await expect(page.locator('#legend')).toContainText('active'); });
test('deep link opens drawer', async ({ page }) => { await page.goto('/#B1067'); await expect(page.locator('#drawer')).toBeVisible(); await expect(page.locator('#detail')).toContainText('#1 of'); });
test('slash focuses search, Esc closes drawer', async ({ page }) => {
  await page.goto('/'); await page.locator('body').press('/'); await expect(page.locator('#q')).toBeFocused();
  await page.goto('/#B1063'); await page.keyboard.press('Escape'); await expect(page.locator('#drawer')).toBeHidden();
});
test('space starts replay', async ({ page }) => { await page.goto('/'); await page.locator('body').press(' '); await expect(page.locator('#year')).toContainText('flying'); });
test('bad hash is ignored', async ({ page }) => { await page.goto('/#B9999'); await expect(page.locator('#drawer')).toBeHidden(); });
