// Regenerates the app icons and iPhone splash screens in web/icons/.
// Not needed for normal use (the images are already in the repo).
// Usage: node tools/make-icons.mjs   (needs the "playwright" package + Chromium)
// Tip: the committed splash images were shrunk afterwards with Pillow (PNG palette, 96 colors).
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../web/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// Buddy: a friendly speech-bubble face.
const buddy = (bg = true, pad = 0) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a80ff"/><stop offset="1" stop-color="#5b3df5"/></linearGradient>
  </defs>
  ${bg ? '<rect width="512" height="512" rx="0" fill="url(#g)"/>' : ''}
  <g transform="translate(${256 - 256 * (1 - pad)} ${256 - 256 * (1 - pad)}) scale(${1 - pad})">
    <circle cx="420" cy="92" r="20" fill="#ffd166"/>
    <circle cx="455" cy="150" r="10" fill="#4cc9f0"/>
    <circle cx="70" cy="110" r="14" fill="#06d6a0"/>
    <path d="M256 92c-98 0-170 62-170 146 0 47 23 88 60 115l-18 66c-2 8 6 14 13 10l78-42c12 2 24 3 37 3 98 0 170-62 170-152S354 92 256 92z" fill="#ffffff"/>
    <circle cx="200" cy="230" r="26" fill="#24203a"/>
    <circle cx="312" cy="230" r="26" fill="#24203a"/>
    <circle cx="209" cy="221" r="9" fill="#fff"/>
    <circle cx="321" cy="221" r="9" fill="#fff"/>
    <circle cx="170" cy="282" r="18" fill="#ff8fc4" opacity=".8"/>
    <circle cx="342" cy="282" r="18" fill="#ff8fc4" opacity=".8"/>
    <path d="M214 290c22 30 62 30 84 0" stroke="#24203a" stroke-width="16" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

writeFileSync(new URL('favicon.svg', OUT), buddy(true, 0).replace('rx="0"', 'rx="110"'));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();

async function png(name, w, h, html) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0">${html}</body></html>`);
  await page.screenshot({ path: new URL(name, OUT).pathname, omitBackground: true });
}
const iconHtml = (size, rounded, pad) => `<div style="width:${size}px;height:${size}px;border-radius:${rounded ? size * 0.22 : 0}px;overflow:hidden">${buddy(true, pad).replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>`;

await png('icon-192.png', 192, 192, iconHtml(192, false, 0));
await png('icon-512.png', 512, 512, iconHtml(512, false, 0));
await png('maskable-512.png', 512, 512, iconHtml(512, false, 0.18));
await png('apple-touch-icon.png', 180, 180, iconHtml(180, false, 0.04));
await png('favicon-32.png', 32, 32, iconHtml(32, true, 0));

const splashes = [[1320, 2868], [1206, 2622], [1290, 2796], [1179, 2556], [1284, 2778], [1170, 2532], [1125, 2436], [828, 1792], [750, 1334]];
for (const [w, h] of splashes) {
  const s = Math.round(w * 0.38);
  await png(`splash-${w}x${h}.png`, w, h, `
    <div style="width:${w}px;height:${h}px;background:linear-gradient(160deg,#8f74ff,#5b3df5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${w * 0.05}px;font-family:system-ui,sans-serif;color:#fff">
      <div style="width:${s}px;height:${s}px;border-radius:${s * 0.24}px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)">${buddy(true, 0).replace('<svg ', `<svg width="${s}" height="${s}" `)}</div>
      <div style="font-size:${w * 0.075}px;font-weight:800">Buddy Learning</div>
    </div>`);
}
await browser.close();
console.log('Icons written to web/icons/');
