import { chromium } from '@playwright/test'; import { execSync } from 'node:child_process'; import fs from 'node:fs';
const U = 'http://127.0.0.1:4477/', gif = process.argv.includes('--gif');
const b = await chromium.launch({ executablePath: process.env.PW_CHROME });
for (const [w, h] of [[1440, 900], [1920, 1080], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(U); await p.waitForSelector('body[data-ready="1"]'); await p.screenshot({ path: `screenshots/wall-${w}x${h}.png` });
  await p.locator('#trend').scrollIntoViewIfNeeded(); await p.screenshot({ path: `screenshots/trend-${w}x${h}.png` });
  await p.goto(U + '?d#B1067'); await p.waitForSelector('#drawer[open]'); await p.waitForTimeout(150); await p.screenshot({ path: `screenshots/drawer-${w}x${h}.png` });
  await p.close();
}
if (gif) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); await p.goto(U); await p.waitForSelector('body[data-ready="1"]');
  fs.mkdirSync('/tmp/blf', { recursive: true }); execSync('rm -f /tmp/blf/*'); let i = 0; const snap = async (n = 1) => { for (let k = 0; k < n; k++) { await p.screenshot({ path: `/tmp/blf/f${String(i++).padStart(3, '0')}.png` }); await p.waitForTimeout(200); } };
  await snap(3); await p.click('#play'); await snap(24);
  await p.evaluate(() => location.hash = '#B1067'); await p.waitForTimeout(300); await snap(6);
  await p.keyboard.press('Escape'); await p.locator('#trend').scrollIntoViewIfNeeded(); await snap(5);
  await p.locator('#cmp').scrollIntoViewIfNeeded(); await p.selectOption('#cb', 'B1058'); await snap(5);
  execSync('ffmpeg -y -loglevel error -framerate 4 -i /tmp/blf/f%03d.png -vf "scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse" screenshots/demo.gif');
}
await b.close();
