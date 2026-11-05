import { test, expect } from '@playwright/test';

test('phone: TOC starts collapsed, keys hidden, no overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#tocwrap')).not.toHaveAttribute('open', '');
  await expect(page.locator('#tocwrap summary')).toBeVisible();
  await expect(page.locator('.keys')).toBeHidden();
  await expect(page.locator('.lede')).toBeVisible();
  const h = await page.locator('.controls').evaluate(el => el.getBoundingClientRect().height);
  expect(h).toBeLessThan(300);
  const ox = await page.evaluate(() => document.body.scrollWidth > document.documentElement.clientWidth + 1);
  expect(ox).toBe(false);
  // expanding TOC reveals jump links
  await page.locator('#tocwrap summary').click();
  await expect(page.locator('#toc a[href="#lanes"]')).toBeVisible();
});

test('desktop: TOC links and keys stay visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#tocwrap')).toHaveAttribute('open', '');
  await expect(page.locator('#toc a[href="#lanes"]')).toBeVisible();
  await expect(page.locator('#csv')).toBeVisible();
  await expect(page.locator('.keys')).toBeVisible();
});
