import { test, expect } from '@playwright/test';

test('TV mode respects prefers-reduced-motion with a long default interval', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?mode=tv');
  await page.waitForSelector('#tv h1');
  // With reduce, default every is 60000 — card should stay put for a short wait
  const a = await page.locator('#tv h1').textContent();
  await page.waitForTimeout(1500);
  const b = await page.locator('#tv h1').textContent();
  expect(b).toBe(a);
});

test('TV mode still advances with ArrowRight under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?mode=tv');
  await page.waitForSelector('#tv h1');
  const a = await page.locator('#tv h1').textContent();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tv h1')).not.toHaveText(a);
});
