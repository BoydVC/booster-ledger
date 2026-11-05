import { test, expect } from '@playwright/test'; import fs from 'node:fs';
const B = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')).boosters.filter(b => b.flights > 0).sort((a, b) => b.flights - a.flights || a.serial.localeCompare(b.serial));
test('TV mode shows the record holder first, then cycles', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 }); await page.goto('/?mode=tv&every=2000');
  await expect(page.locator('#tv h1')).toHaveText(B[0].serial); await expect(page.locator('#tv .big').first()).toContainText(`${B[0].flights} flights`);
  await expect(page.locator('#tv h1')).toHaveText(B[1].serial, { timeout: 4000 });
  await expect(page.locator('#lanes')).toBeHidden();
});
test('TV mode arrow keys', async ({ page }) => { await page.goto('/?mode=tv&every=60000'); await page.waitForSelector('body[data-ready="1"]'); await page.keyboard.press('ArrowRight'); await expect(page.locator('#tv h1')).toHaveText(B[1].serial); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await expect(page.locator('#tv h1')).toHaveText(B[9].serial); });
test('TV mode fits 1920x1080 without scroll', async ({ page }) => { await page.setViewportSize({ width: 1920, height: 1080 }); await page.goto('/?mode=tv&every=60000'); expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true); });
test('TV mode fits a phone without scroll', async ({ page }) => { await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/?mode=tv&every=60000'); await page.waitForSelector('#tv h1'); expect(await page.evaluate(() => document.getElementById('tv').scrollHeight <= innerHeight + 1)).toBe(true); });
test('TV container takes no space in normal mode', async ({ page }) => { await page.goto('/'); await page.waitForSelector('body[data-ready="1"]'); await expect(page.locator('#tv')).toBeHidden(); const b = await page.locator('footer').boundingBox(); const h = await page.evaluate(() => document.documentElement.scrollHeight); expect(h - (b.y + b.height + await page.evaluate(() => scrollY))).toBeLessThan(60); });
