import { test, expect } from '@playwright/test';

test('drawer copy-link button writes #serial URL', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#B1058');
  await page.waitForSelector('#drawer[open]');
  await page.click('#dlink');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toMatch(/#B1058$/);
});
