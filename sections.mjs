// Dev helper: screenshot each panel and a drawer at a viewport. usage: node sections.mjs W H
import { chromium } from '@playwright/test';
const [w, h] = process.argv.slice(2).map(Number), U = 'http://127.0.0.1:4477/';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME }), p = await b.newPage({ viewport: { width: w, height: h } });
await p.goto(U + '?a=B1067&b=B1058'); await p.waitForSelector('body[data-ready="1"]');
for (const id of ['trend', 'prog', 'spots', 'cmp']) { await p.locator('#' + id).scrollIntoViewIfNeeded(); await p.screenshot({ path: `/tmp/sec-${id}-${w}.png` }); }
await p.goto(U + '?z#B1063'); await p.waitForSelector('#drawer[open]'); await p.waitForTimeout(150); await p.screenshot({ path: `/tmp/sec-drawer-${w}.png` });
await b.close();
