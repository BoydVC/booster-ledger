import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
test('cumulative chart ends at flight count', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#cumfleetsvg')).toContainText(String(FL.length) + ' flights cumulative');
});
