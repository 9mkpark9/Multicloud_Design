// Renders a contact sheet (every step of a lesson, side by side) to .sheets/<lesson id>.png.
//   npm run sheet -- vpc-subnet firewall        one PNG per lesson
//   npm run sheet -- --dark vpc-subnet          in the dark theme
// Needs Playwright with Chromium (preinstalled in the cloud environment).
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright is not installed here. Run `npm run dev` and open http://localhost:5173/sheet.html?id=<lesson id> instead.');
  process.exit(1);
}

const args = process.argv.slice(2);
const dark = args.includes('--dark');
const ids = args.filter((a) => !a.startsWith('--'));
if (!ids.length) {
  console.error('usage: npm run sheet -- <lesson id> [more ids…]');
  process.exit(1);
}

const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1860, height: 900 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('  page error:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('  console error:', m.text()); });
if (dark) await page.addInitScript(() => localStorage.setItem('mcd:theme', '"dark"'));
mkdirSync('.sheets', { recursive: true });
let failed = false;
for (const id of ids) {
  await page.goto(`${base}sheet.html?id=${id}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('body[data-sheet]', { timeout: 15000 });
  if ((await page.getAttribute('body', 'data-sheet')) !== 'ready') {
    console.log(`✗ ${id}: no such lesson (is the file's id right?)`);
    failed = true;
    continue;
  }
  await page.waitForTimeout(500);
  const out = `.sheets/${id}${dark ? '-dark' : ''}.png`;
  await page.screenshot({ path: out, fullPage: true });
  console.log(`✓ ${out}`);
}
await browser.close();
await server.close();
process.exit(failed ? 1 : 0);
