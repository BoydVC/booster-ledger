import { test, expect } from '@playwright/test'; import fs from 'node:fs';
const F = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
test('replay stats are as-of each year', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]'); await page.click('#play');
  await expect(page.locator('#year')).toContainText('flying');
  const [yt, v] = await page.evaluate(() => [document.getElementById('year').textContent, document.querySelector('.stat[data-k="Flights"] b').textContent]); const y = +yt.slice(0, 4);
  const lo = F.filter(f => Date.parse(f.net) < Date.UTC(y + 1, 0)).length; expect(+v).toBeLessThanOrEqual(lo); expect(+v).toBeLessThan(F.length);
});
test('leaderboard entries are keyboard buttons', async ({ page }) => { await page.goto('/'); await page.locator('#top button').first().focus(); await page.keyboard.press('Enter'); await expect(page.locator('#drawer')).toBeVisible(); });
