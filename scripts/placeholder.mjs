// Writes numbered placeholder sheets to src/zines/, for testing the slicer and the viewer. Each
// panel prints its page upright as it should read once cut out, so a sliced sheet checks the
// panel map in src/lib/sheet.ts.
//
//   node scripts/placeholder.mjs ["Zine Name" …]   (default: four placeholders)

import sharp from 'sharp';
import { slugify } from '../src/lib/manifest.ts';
import { PAGES, panelRect } from '../src/lib/sheet.ts';

// A3 landscape at 150 dpi.
const W = 2480;
const H = 1754;
const TINTS = ['#fff3f0', '#f0f3ff', '#f2fff0', '#fffaf0'];
const FONT = 'Helvetica, Arial, sans-serif';

function svgFor(name, tint) {
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="${FONT}" text-anchor="middle">`];
  out.push(`<rect width="${W}" height="${H}" fill="${tint}"/>`);
  for (const page of PAGES) {
    const { left, top, width, height, flipped } = panelRect(page, W, H);
    const cx = left + width / 2;
    const cy = top + height / 2;
    const big = page === 'cover' || page === 'back' ? 150 : 420;
    out.push(`<g transform="rotate(${flipped ? 180 : 0} ${cx} ${cy})">`);
    out.push(`<rect x="${left}" y="${top}" width="${width}" height="${height}" fill="none" stroke="#bbb" stroke-dasharray="12 8"/>`);
    out.push(`<text x="${cx}" y="${top + 50}" font-size="28" fill="#999">↑ top</text>`);
    out.push(`<text x="${cx}" y="${cy + big * 0.35}" font-size="${big}" font-weight="bold">${page.toUpperCase()}</text>`);
    out.push(`<text x="${cx}" y="${top + height - 60}" font-size="36" fill="#555">${name}</text>`);
    out.push('</g>');
  }
  out.push('</svg>');
  return out.join('\n');
}

const names = process.argv.length > 2 ? process.argv.slice(2) : ['Placeholder One', 'Placeholder Two', 'Placeholder Three', 'Placeholder Four'];
for (const [i, name] of names.entries()) {
  const file = new URL(`../src/zines/${slugify(name)}.png`, import.meta.url);
  await sharp(Buffer.from(svgFor(name, TINTS[i % TINTS.length]))).png().toFile(file.pathname);
  console.log(file.pathname);
}
