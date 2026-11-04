# Zines

A small library of zines: each is one A3 sheet folded into 8 panels, read in a flick viewer. Astro (static), served at `https://jackbush.github.io/zines/`. See `README.md` to run it. The style is a wireframe: system fonts, greys, outlines, nothing decorative.

- `src/zines/`: one PNG sheet per zine, and `manifest.js` listing them as `{ name, file, slug?, buy? }`. The slug is derived from the name unless given, and is the URL. `buy` is a plain URL and adds a "Buy a copy" link.
- `src/lib/sheet.ts`: the panel map (which sheet cell is which panel) and the slicing maths, shared by the build and `/preview`. Change the fold in this one place.
- Sheets are sliced at build time with sharp into panel WebPs and a cover thumbnail, so phones never download the A3 PNG. `/preview` slices an uploaded sheet in the browser and stores nothing.
- `src/pages/`: the library, one page per zine, and the unlisted `/preview`. `src/components/`: the flick viewer and `Back.astro`. `src/layouts/BaseLayout.astro` builds every page's title, share tags and icons from `src/lib/site.ts`.
- Back button: on the library it only shows with `?from=home` (to jackbush.github.io); zine links and the library's other pages carry `?from=home` along so it survives navigation.
- Site: `src/lib/version.ts` and `integrations/version-file.mjs` do new-build detection. `.github/workflows/deploy.yml` builds on push to `main` with `PUBLIC_BUILD` set to the short commit hash, which is stamped into each page and `version.json`; open tabs jump to a newer build.

## Rules

- Run `npm run check` and `npm run build` after every change.
