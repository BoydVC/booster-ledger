import { test, expect } from '@playwright/test';

test('empty filters show Clear filters and recover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await page.fill('#q', 'ZZZ-NO-SUCH-MISSION');
  await expect(page.locator('#empty')).toBeVisible();
  await expect(page.locator('#matchn')).toHaveText('0 shown');
  await page.click('#clearf');
  await expect(page.locator('#empty')).toBeHidden();
  await expect(page.locator('#matchn')).not.toHaveText('0 shown');
});

test('skip link focuses lifelines target', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('a.skip')).toHaveAttribute('href', '#lanes');
  await page.locator('a.skip').focus();
  await expect(page.locator('a.skip')).toBeFocused();
});

test('snapshot badge shows LL2 date', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#snapbadge')).toContainText('Snapshot');
  await expect(page.locator('#snapbadge')).toContainText('Launch Library 2');
});
