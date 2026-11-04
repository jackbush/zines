// Cuts every sheet in src/zines/ into its eight pages before Astro starts, so visitors download
// small WebPs instead of an A3 PNG. They land in src/generated/panels/<slug>/ (gitignored), where
// pages import them through Vite and get content-hashed URLs: a new version of a sheet gets new
// URLs, so nobody sees a cached old one. Restart `astro dev` after changing a sheet.

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AstroIntegration } from 'astro';
import sharp from 'sharp';
import { parseManifest } from '../src/lib/manifest';
import { PAGES, isSheetShaped, panelRect } from '../src/lib/sheet';

/** Pages are scaled down to at most this tall: a spread at full height on a 2× screen. */
const PAGE_MAX_HEIGHT = 1600;
/** The shelf's cover thumbnail width: three across a desktop at 2×. */
const THUMB_WIDTH = 480;
const QUALITY = 85;

export default function panels(): AstroIntegration {
  return {
    name: 'panels',
    hooks: {
      'astro:config:setup': async ({ config, logger }) => {
        const zinesDir = new URL('src/zines/', config.root);
        const outDir = new URL('src/generated/panels/', config.root);
        const manifestUrl = new URL('manifest.js', zinesDir);
        // A query defeats Node's module cache, so a dev restart sees manifest edits.
        const { default: raw } = await import(`${pathToFileURL(fileURLToPath(manifestUrl)).href}?t=${Date.now()}`);
        const zines = parseManifest(raw);

        rmSync(outDir, { recursive: true, force: true });
        for (const zine of zines) {
          const source = fileURLToPath(new URL(zine.file, zinesDir));
          if (!existsSync(source)) throw new Error(`src/zines/manifest.js: "${zine.name}" needs src/zines/${zine.file}.`);
          // Decode once; every page is cut from the same raw pixels.
          const { data, info } = await sharp(source).raw().toBuffer({ resolveWithObject: true });
          if (!isSheetShaped(info.width, info.height)) {
            logger.warn(`${zine.file} is ${info.width}×${info.height}, not A-series landscape: pages will be stretched.`);
          }
          const raw = { raw: { width: info.width, height: info.height, channels: info.channels } };
          const dir = fileURLToPath(new URL(`${zine.slug}/`, outDir));
          mkdirSync(dir, { recursive: true });
          for (const page of PAGES) {
            const { flipped, ...rect } = panelRect(page, info.width, info.height);
            const cut = await sharp(data, raw).extract(rect).raw().toBuffer({ resolveWithObject: true });
            const panel = sharp(cut.data, { raw: cut.info }).rotate(flipped ? 180 : 0);
            await panel.clone().resize({ height: PAGE_MAX_HEIGHT, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(`${dir}${page}.webp`);
            if (page === 'cover') await panel.clone().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(`${dir}thumb.webp`);
          }
        }
        logger.info(`cut ${zines.length} sheet${zines.length === 1 ? '' : 's'} into pages`);
      },
    },
  };
}
