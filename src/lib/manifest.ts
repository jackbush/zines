// src/zines/manifest.js, validated. Shared by the panel slicer (at config time) and the pages,
// so it touches neither the filesystem nor import.meta.env.

import { z } from 'astro/zod';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Routes that aren't zines. */
const RESERVED = new Set(['preview']);

/** 'The Long Walk!' → 'the-long-walk'. */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const entrySchema = z
  .object({
    name: z.string().trim().min(1),
    /** URL path. Defaults to the name, slugified. */
    slug: z.string().regex(SLUG_PATTERN, 'lowercase letters, numbers and single hyphens only').optional(),
    /** The sheet in src/zines/. Defaults to `<slug>.png`. */
    file: z.string().regex(/\.png$/i, 'must be a .png').optional(),
    /** Where to buy a copy (a Ko-fi shop item). Shows "Buy a copy" on the zine's page. */
    buy: z.url().optional(),
    /** The zine page's colour below the top bar, as hex (#f4efe6). Defaults to the site's `viewer` grey. */
    background: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'a hex colour like #f4efe6').optional(),
  })
  .strict();

export interface Zine {
  name: string;
  slug: string;
  file: string;
  buy?: string;
  background?: string;
}

/** Parses the manifest, filling in slugs and files. Throws with every problem listed. */
export function parseManifest(raw: unknown): Zine[] {
  const parsed = z.array(entrySchema).safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`src/zines/manifest.js is invalid:\n${lines.join('\n')}`);
  }
  const seen = new Set<string>();
  return parsed.data.map((entry) => {
    const slug = entry.slug ?? slugify(entry.name);
    if (!SLUG_PATTERN.test(slug)) throw new Error(`src/zines/manifest.js: "${entry.name}" needs a slug (its name has no letters or numbers).`);
    if (RESERVED.has(slug)) throw new Error(`src/zines/manifest.js: "${slug}" is taken by the site; give "${entry.name}" another slug.`);
    if (seen.has(slug)) throw new Error(`src/zines/manifest.js: two zines have the slug "${slug}".`);
    seen.add(slug);
    return { name: entry.name, slug, file: entry.file ?? `${slug}.png`, buy: entry.buy, background: entry.background };
  });
}
