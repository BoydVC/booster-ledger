import { test, expect } from '@playwright/test';

test('Most landings sort puts top lander first and is shareable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await page.selectOption('#sort', 'landings');
  const first = await page.locator('#lanes .lane').first().getAttribute('data-s');
  expect(first).toMatch(/^B10\d\d$/);
  expect(page.url()).toContain('sort=landings');
  await page.reload();
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#sort')).toHaveValue('landings');
  await expect(page.locator('#lanes .lane').first()).toHaveAttribute('data-s', first);
});
