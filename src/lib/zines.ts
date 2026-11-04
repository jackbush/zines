// Build-time view of the library: the manifest's zines, in order, with the URLs of their cut
// pages (made by integrations/panels.ts before Vite starts).

import manifest from '../zines/manifest.js';
import { parseManifest, type Zine } from './manifest';
import { PAGES, type Page } from './sheet';

const PANELS = import.meta.glob<string>('/src/generated/panels/*/*.{webp,png}', { eager: true, query: '?url', import: 'default' });

export interface ZineEntry extends Zine {
  pages: Record<Page, string>;
  /** The cover, small, for the shelf. */
  thumb: string;
  /** The whole sheet, for the flat view. */
  sheet: string;
  /** The original sheet, when the manifest allows downloading it. */
  downloadUrl?: string;
}

function panel(slug: string, file: string): string {
  const src = PANELS[`/src/generated/panels/${slug}/${file}`];
  if (!src) throw new Error(`No ${file} for "${slug}": the panels integration should have made it.`);
  return src;
}

export function getZines(): ZineEntry[] {
  return parseManifest(manifest).map((z) => ({
    ...z,
    pages: Object.fromEntries(PAGES.map((p) => [p, panel(z.slug, `${p}.webp`)])) as Record<Page, string>,
    thumb: panel(z.slug, 'thumb.webp'),
    sheet: panel(z.slug, 'sheet.webp'),
    downloadUrl: z.download ? panel(z.slug, 'download.png') : undefined,
  }));
}
