// Draws the app icon, splash image and favicon from the colours in brand.config.js.
// Run with:  npm run make-icons
// The artwork is a simple original drawing (gem, aura, zodiac ring) — no copyrighted images.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { brand } = require('../brand.config.js');
const c = brand.colors;
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = (name) => path.join(root, 'app', 'assets', 'images', name);

/**
 * The symbol, drawn on a 1024 x 1024 canvas: a faceted gem ("ratna") glowing with an
 * emerald aura inside a gold zodiac ring. `scale` shrinks it toward the centre.
 * `mono` draws a single-colour version (Android themed icons).
 */
function symbol({ scale = 1, ring = true, mono = false } = {}) {
  const gold = mono ? '#FFFFFF' : c.gold;
  const line = mono ? '#FFFFFF' : c.goldBright;
  const shade = (hex, opacity = 1) => (mono ? `fill="#FFFFFF" fill-opacity="${opacity * 0.35}"` : `fill="${hex}"`);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const x = 512 + Math.cos(a) * 400;
    const y = 512 + Math.sin(a) * 400;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 === 0 ? 14 : 8}" fill="${gold}"/>`;
  }).join('');
  // Gem outline: crown (top) from y=345 to the girdle at y=430, pavilion down to the point at y=690.
  const L = [330, 430], CL = [425, 345], CR = [599, 345], R = [694, 430], ML = [468, 430], MR = [556, 430], B = [512, 690];
  const poly = (...pts) => pts.map((p) => p.join(',')).join(' ');
  return `
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">
    ${mono ? '' : '<circle cx="512" cy="512" r="330" fill="url(#aura)"/>'}
    ${ring ? `<circle cx="512" cy="512" r="400" fill="none" stroke="${gold}" stroke-opacity="0.55" stroke-width="6"/>${ticks}` : ''}
    <g stroke="${line}" stroke-width="5" stroke-linejoin="round">
      <polygon points="${poly(L, CL, ML)}" ${shade(c.emerald, 0.8)}/>
      <polygon points="${poly(CL, CR, MR, ML)}" ${shade(c.emeraldBright, 1)}/>
      <polygon points="${poly(CR, R, MR)}" ${shade(c.emerald, 0.8)}/>
      <polygon points="${poly(L, ML, B)}" ${shade(c.emeraldDeep, 0.5)}/>
      <polygon points="${poly(ML, MR, B)}" ${shade(c.emerald, 0.7)}/>
      <polygon points="${poly(MR, R, B)}" ${shade('#0E5236', 0.4)}/>
    </g>
    <polygon points="${poly(L, CL, CR, R, B)}" fill="none" stroke="${gold}" stroke-width="12" stroke-linejoin="round"/>
    <path d="M700 250 L716 296 L762 312 L716 328 L700 374 L684 328 L638 312 L684 296 Z" fill="${line}"/>
    <circle cx="322" cy="300" r="9" fill="${line}" fill-opacity="0.8"/>
  </g>`;
}

const defs = () => `
  <defs>
    <radialGradient id="sky" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="${c.backgroundGlow}"/>
      <stop offset="60%" stop-color="${c.background}"/>
      <stop offset="100%" stop-color="${c.backgroundDeep}"/>
    </radialGradient>
    <radialGradient id="aura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${c.emeraldBright}" stop-opacity="0.45"/>
      <stop offset="55%" stop-color="${c.emerald}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${c.emerald}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

const svg = (body) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs()}${body}</svg>`);

const fullIcon = svg(`<rect width="1024" height="1024" fill="url(#sky)"/>${symbol({ scale: 0.92 })}`);
// Android adaptive icons crop the edges, so the symbol must sit inside the middle ~66%.
const foreground = svg(symbol({ scale: 0.6 }));
const monochrome = svg(symbol({ scale: 0.6, mono: true }));
const splash = svg(symbol({ scale: 1 }));

await sharp(fullIcon).png().toFile(out('icon.png'));
await sharp(foreground).png().toFile(out('android-icon-foreground.png'));
await sharp(monochrome).png().toFile(out('android-icon-monochrome.png'));
await sharp(splash).resize(512, 512).png().toFile(out('splash-icon.png'));
await sharp(fullIcon).resize(48, 48).png().toFile(out('favicon.png'));
console.log('Icons written to app/assets/images/');
