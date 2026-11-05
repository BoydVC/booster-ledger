import { chromium } from '@playwright/test'; import { execSync } from 'node:child_process'; import fs from 'node:fs';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const U = 'http://127.0.0.1:4477/';
await p.goto(U); await p.waitForSelector('.lane'); await p.screenshot({ path: 'screenshots/hero-1440x900.png' });
await p.goto(U + '?d=1#B1067'); await p.waitForTimeout(200); await p.screenshot({ path: 'screenshots/drawer.png' }); await p.click('#close');
fs.mkdirSync('/tmp/blf', { recursive: true }); execSync('rm -f /tmp/blf/*');
await p.click('#play'); for (let i = 0; i < 26; i++) { await p.screenshot({ path: `/tmp/blf/f${String(i).padStart(3,'0')}.png` }); await p.waitForTimeout(220); }
const m = await b.newPage({ viewport: { width: 390, height: 844 } }); await m.goto(U); await m.waitForSelector('.lane'); await m.screenshot({ path: 'screenshots/phone-390x844.png' });
await b.close();
execSync('ffmpeg -y -loglevel error -framerate 5 -i /tmp/blf/f%03d.png -vf "scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse" screenshots/demo.gif');
