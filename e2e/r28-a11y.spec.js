import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('axe clean on charts region', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]');
  await page.locator('#panels').scrollIntoViewIfNeeded();
  const results = await new AxeBuilder({ page }).include('#panels').withTags(['wcag2a', 'wcag2aa']).analyze();
  const bad = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(bad, JSON.stringify(bad.map(v => v.id), null, 2)).toEqual([]);
});

test('axe clean on drawer with timeline', async ({ page }) => {
  await page.goto('/#B1067'); await page.waitForSelector('#drawer[open]');
  const results = await new AxeBuilder({ page }).include('#drawer').withTags(['wcag2a', 'wcag2aa']).analyze();
  const bad = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(bad, JSON.stringify(bad.map(v => ({ id: v.id, nodes: v.nodes.length })), null, 2)).toEqual([]);
});
