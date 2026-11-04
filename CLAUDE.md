# Zines

A small library of zines: each is one A3 sheet folded into 8 panels, read in a flick viewer. Astro (static), served at `https://jackbush.github.io/zines/`. See `README.md` to run it. The style is a wireframe: system fonts, greys, outlines, nothing decorative.

- `src/zines/`: one PNG sheet per zine, and `manifest.js` listing them as `{ name, file?, slug?, buy? }`. The slug (the URL) comes from the name unless given, and the file from the slug. `buy` (a Ko-fi item URL) adds a "Buy a copy" link.
- `src/lib/sheet.ts`: the fold (which cell of the sheet is which page, and which are upside down) and the reading order. It's the only place that knows the layout: the build, `/preview` and `scripts/placeholder.mjs` all read it.
- `integrations/panels.ts` cuts each sheet into page WebPs and a cover thumbnail before Astro starts, into `src/generated/panels/` (gitignored). `src/lib/zines.ts` hands pages the validated manifest (`src/lib/manifest.ts`) with those images' hashed URLs.
- `src/lib/flick.ts` (+ `flick.css`): the flick viewer and its scan-line page turn, used by `src/components/Flick.astro` on zine pages and directly by `/preview`.
- `src/pages/`: the library (`index.astro`), one page per zine (`[slug].astro`), and the unlisted `/preview`, which slices an uploaded sheet in the browser and stores nothing.
- Back button (`src/components/Back.astro`): on the library it only shows with `?from=home`, and goes to jackbush.github.io. Elsewhere it goes to the library. The library adds `?from=home` to its zine links and the zine pages' back links keep it, so the flag survives a round trip.
- Site: `src/lib/version.ts` and `integrations/version-file.mjs` do new-build detection. `.github/workflows/deploy.yml` builds on push to `main` with `PUBLIC_BUILD` set to the short commit hash, which is stamped into each page and `version.json`; open tabs jump to a newer build.

## Rules

- Run `npm run check` and `npm run build` after every change.
