// Cuts every sheet in src/zines/ into its eight pages before Astro starts, plus a web-sized copy
// of the whole sheet for the flat view, so visitors download small WebPs instead of an A3 PNG. They land in src/generated/panels/<slug>/ (gitignored), where
// pages import them through Vite and get content-hashed URLs: a new version of a sheet gets new
// URLs, so nobody sees a cached old one. `astro dev` restarts itself when a sheet or the manifest changes.

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import sharp from 'sharp';
import { parseManifest } from '../src/lib/manifest';
import { PAGES, isSheetShaped, panelRect } from '../src/lib/sheet';
import manifest from '../src/zines/manifest.js';

/** Pages are scaled down to at most this tall: a spread at full height on a 2× screen. */
const PAGE_MAX_HEIGHT = 1600;
/** The shelf's cover thumbnail width: a cover two-thirds the height of a large window, at 2×. */
const THUMB_WIDTH = 960;
/** The whole sheet's width, for the flat view: a full-width desktop window at 2×. */
const SHEET_WIDTH = 2800;
const QUALITY = 85;

export default function panels(): AstroIntegration {
  return {
    name: 'panels',
    hooks: {
      'astro:config:setup': async ({ config, logger, addWatchFile }) => {
        const zinesDir = new URL('src/zines/', config.root);
        const outDir = new URL('src/generated/panels/', config.root);
        addWatchFile(new URL('manifest.js', zinesDir));
        const zines = parseManifest(manifest);

        rmSync(outDir, { recursive: true, force: true });
        for (const zine of zines) {
          const source = fileURLToPath(new URL(zine.file, zinesDir));
          if (!existsSync(source)) throw new Error(`src/zines/manifest.js: "${zine.name}" needs src/zines/${zine.file}.`);
          addWatchFile(source);
          // Decode once; every page is cut from the same raw pixels.
          const { data, info } = await sharp(source).raw().toBuffer({ resolveWithObject: true });
          if (!isSheetShaped(info.width, info.height)) {
            logger.warn(`${zine.file} is ${info.width}×${info.height}, not A-series landscape: pages will be stretched.`);
          }
          const raw = { raw: { width: info.width, height: info.height, channels: info.channels } };
          const dir = fileURLToPath(new URL(`${zine.slug}/`, outDir));
          mkdirSync(dir, { recursive: true });
          await sharp(data, raw).resize({ width: SHEET_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(`${dir}sheet.webp`);
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
