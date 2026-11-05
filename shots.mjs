// Regenerate screenshots/ (3 viewports) and screenshots/demo.gif. Needs the server on :4477.
import { chromium } from '@playwright/test'; import { execSync } from 'node:child_process'; import fs from 'node:fs';
const U = 'http://127.0.0.1:4477/';
const chrome = process.env.PW_CHROME || '/home/box/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: chrome });
for (const [w, h] of [[1440, 900], [1920, 1080], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(U); await p.waitForSelector('body[data-ready="1"]'); await p.screenshot({ path: `screenshots/wall-${w}x${h}.png` });
  await p.locator('#fleet').scrollIntoViewIfNeeded(); await p.screenshot({ path: `screenshots/charts-${w}x${h}.png` });
  await p.locator('#heat').scrollIntoViewIfNeeded(); await p.screenshot({ path: `screenshots/heat-${w}x${h}.png` });
  await p.goto(U + '?a=B1067&b=B1058'); await p.waitForSelector('body[data-ready="1"]'); await p.locator('#cmp').scrollIntoViewIfNeeded(); await p.screenshot({ path: `screenshots/compare-${w}x${h}.png` });
  await p.goto(U + '#B1067'); await p.waitForSelector('#drawer[open]'); await p.waitForTimeout(200); await p.screenshot({ path: `screenshots/drawer-${w}x${h}.png` });
  await p.goto(U + '?mode=tv&every=60000'); await p.waitForSelector('#tv h1'); await p.screenshot({ path: `screenshots/tv-${w}x${h}.png` });
  await p.close();
}
const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); await p.goto(U); await p.waitForSelector('body[data-ready="1"]');
fs.mkdirSync('/tmp/blf', { recursive: true }); execSync('rm -f /tmp/blf/*'); let i = 0;
const snap = async (n = 1, gap = 200) => { for (let k = 0; k < n; k++) { await p.screenshot({ path: `/tmp/blf/f${String(i++).padStart(3, '0')}.png` }); await p.waitForTimeout(gap); } };
await snap(3);
await p.locator('#scrub').fill('5'); await snap(2);
await p.click('#play'); await snap(24);
await p.evaluate(() => location.hash = '#B1067'); await p.waitForTimeout(300); await snap(6);
await p.keyboard.press('j'); await snap(3); await p.keyboard.press('Escape'); await snap(2);
await p.locator('#fleet').scrollIntoViewIfNeeded(); await snap(4);
await p.locator('#heat').scrollIntoViewIfNeeded(); await snap(4);
await p.locator('#cmp').scrollIntoViewIfNeeded(); await p.selectOption('#cb', 'B1058'); await snap(4);
await p.selectOption('#lt', 'ASDS'); await snap(3);
await p.goto(U + '?mode=tv&every=1500'); await p.waitForSelector('#tv h1'); await snap(12, 300);
execSync('ffmpeg -y -loglevel error -framerate 4 -i /tmp/blf/f%03d.png -vf "scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse" screenshots/demo.gif');
await b.close();
console.log('shots+gif done', i, 'frames');
