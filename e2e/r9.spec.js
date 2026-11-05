import { test, expect } from '@playwright/test'; import fs from 'node:fs';
const F = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
test('progression has a point per record and matches raw', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]'); const max = Math.max(...F.map(f => f.n));
  await expect(page.locator('#progsvg circle.rp')).toHaveCount(max);
  const first = F.filter(f => f.n === max).sort((a, b) => a.net < b.net ? -1 : 1)[0];
  await expect(page.locator(`#progsvg circle[data-n="${max}"]`)).toHaveAttribute('data-s', first.serial);
  await page.locator(`#progsvg circle[data-n="${max}"]`).click(); await expect(page.locator('#dserial')).toHaveText(first.serial);
});
