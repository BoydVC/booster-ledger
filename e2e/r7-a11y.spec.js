import { test, expect } from '@playwright/test'; import AxeBuilder from '@axe-core/playwright';
const go = async (p, u = '/') => { await p.goto(u); await p.waitForSelector('body[data-ready="1"]'); };
test('no serious/critical axe violations on the wall', async ({ page }) => {
  await go(page); const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter(v => ['serious', 'critical'].includes(v.impact)); expect(bad.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
test('no serious/critical axe violations in the drawer', async ({ page }) => {
  await go(page, '/?a#B1067'); await page.waitForSelector('#drawer[open]'); const r = await new AxeBuilder({ page }).include('#drawer').analyze();
  expect(r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
