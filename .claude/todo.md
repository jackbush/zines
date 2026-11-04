# Zines: plan

Static Astro site at `https://jackbush.github.io/zines/`, deployed to GitHub Pages the way Glimmers is.

## Decisions

- **Sheet**: one A3 landscape PNG per zine, an 8-panel fold (4×2 grid of A6 portrait panels, top row upside down). Panel order defaults to the standard fold and lives in one place, `src/lib/sheet.ts`, used by both the build and `/preview`:
  ```
  top row (rotated 180°):  4  3  2  1
  bottom row:              5  6  back  cover
  ```
  The placeholder sheet prints each panel's number upright as it should read, so it doubles as a check on this map against a real sheet.
- **Reading order**: cover, 1–2, 3–4, 5–6, back.
- **Slicing**: done at build time with sharp (Astro already depends on it). Each sheet becomes 8 panel WebPs plus a cover thumbnail, so phones never download the full A3 PNG. `/preview` slices in the browser with a canvas, using the same map.
- **Data**: zines live in `src/zines/<slug>.png`, listed in `src/zines/manifest.js` as `{ name, file, slug?, buy? }`. The manifest is checked against a zod schema, and the slug is derived from the name unless one is given. `buy` is a plain URL (a Ko-fi shop item). If it's there, the zine page shows a "Buy a copy" link. No Ko-fi widget script.
- **Preview**: keeps no state. Nothing is stored and every load starts empty. It's unlisted (no auth) and not in the sitemap. The bottom shelf holds a fake zine that links to it.
- **Back button**, as in Glimmers:
  - The library shows a back button to `jackbush.github.io` only with `?from=home`, and it carries `from=home` into its zine links.
  - A zine page's back button always goes to the library, keeping `from`.
  - `/preview` goes back to the library.
- **Also carried over from Glimmers**: the Pages workflow, the `PUBLIC_BUILD` stamp, `version.json` and the auto-reload, `base: '/zines'` with `format: 'directory'`, the BaseLayout share and icon tags, the viewport and pinch handling, and a CLAUDE.md. Glimmers' params, panel and WebGL kit don't apply.
- **Style**: a wireframe. System fonts, greys and outlines, nothing decorative.

## Views

- **Flick**:
  - Shows one spread centred on the screen, with the cover and back shown alone.
  - Click or tap the right half to go forward and the left half to go back. Arrow keys work, and swipe on touch.
  - On narrow screens (portrait phones) it shows one page at a time.
- **Page turn**:
  - A vertical scan line sweeps across the turning page. Behind the line the old page is clipped away and the next face shows through.
  - The turning face is offset slightly and rotated a few degrees about the spine, like a flattened 3D page turn.
  - It's done with CSS `clip-path` and transforms, with the timings and angles as named constants.
  - Under `prefers-reduced-motion` the page changes straight away.
  - If you click again mid-turn, the current turn snaps to its end and the next one starts. A turn never overwrites a later click.
- **Scroll** (`/preview` only): cover, then each spread stacked vertically, then the back.
- **Preview top bar**:
  - Shows a thumbnail of the whole sheet, the file name and a "Upload new version" button.
  - Before any upload, the page is an empty drop zone. A file can be dropped or picked.
  - If the aspect ratio isn't √2:1 landscape, it warns but still renders.
  - It has a toggle between Scroll and Flick.
- **Library**:
  - Shelves of up to 3 covers, centred, dropping to 2 and then 1 as the screen narrows.
  - Each shelf has a thick underline the width of the page. Each item draws a full-width rule clipped by the container, so a shelf that isn't full still gets a full line.
  - The preview "zine" sits alone on the last shelf.

## Steps

Who does each step: I keep anything where the details need judgement (geometry, animation, layout) and hand out the well-specified mechanical work. I review every handed-out diff, and only hand work out if you say so. Otherwise I'll just do it all myself.

- [x] 1. `git init`; scaffold Astro and TypeScript; set the config, layouts, version file and deploy workflow, copied and trimmed from Glimmers. **Sonnet 5.5**: a mechanical port with a clear source.
- [x] 2. Placeholder sheet: a Node script that writes an SVG and turns it into a PNG with sharp. It makes an A3 landscape sheet at 150 dpi with big numbered panels, the top row upside down, and fold and cut lines. Plus 3–4 copies with different names, so there are enough to test the shelves. **Haiku 4.5**: a small self-contained script.
- [x] 3. `sheet.ts` (panel map and slicing maths), the build-time slicer, the manifest schema and slug derivation. **Opus 5.5** (me): the shared geometry everything else depends on.
- [x] 4. Flick viewer component: spreads and single pages, input handling, the scan-line turn and how it handles interruptions. **Opus 5.5** (me): animation and the interruption cases.
- [x] 5. Library index (shelves, the preview zine, back button) and the `[slug]` zine page with the buy link. **Sonnet 5.5**: wireframe layout to a clear spec.
- [x] 6. `/preview`: upload, browser-side slicing with `sheet.ts`, the top bar, the Scroll/Flick toggle. **Sonnet 5.5**, reusing the step 4 viewer.
- [x] 7. Check it in the browser at desktop and phone widths:
  - The panel order matches the placeholder.
  - Clicking mid-turn behaves.
  - `?from=home` works on all three back buttons.
  - Replacing the file in `/preview` swaps it with nothing left over.
  - The build passes `astro check`.
  
  **Opus 5.5** (me).
- [x] 8. You create the `jackbush/zines` repo and enable Pages; I push when you say so.

## Open

- The panel map assumes the standard fold. Check it against one of your real sheets.
- The library holds only the navy `Sample` sheet (made by `scripts/placeholder.mjs`). Replace it with real zines and their Ko-fi links.
- No share image or PNG home-screen icons yet (BaseLayout omits og:image without one).

## Later

- [ ] **PDF sheets.** Accept an A3 landscape PDF wherever a PNG works. Render its first page to an image, then slice it as now.
  - **`/preview`:** load pdf.js (`pdfjs-dist`) only on this page.
    - Accept `application/pdf` as well as `image/png` in the picker and on drop.
    - Render page 1 to a canvas at roughly 150–300 dpi for A3, then pass it to `slice()`. It already takes anything `createImageBitmap` accepts, so pass a canvas or Blob.
    - Flat shows the rendered image.
    - Keep the stale-upload guard and object-URL cleanup.
  - **Build:** let the manifest's `file` be `.png` or `.pdf`. In `integrations/panels.ts`, rasterise a PDF to raw pixels before cutting. sharp's prebuilt binaries can't read PDF, so pick one:
    - pdf.js in Node with `@napi-rs/canvas`: no system packages, works on Actions as-is.
    - `pdftoppm` (poppler) installed in the deploy workflow.
    
    Prefer the first unless it's slow.
  - **Shared:** keep the render resolution in one place, so `/preview` and the build match.
  - **Done when:** a vector PDF and its PNG export produce the same pages in both places, `npm run check` passes, and the docs (README "Add a zine", CLAUDE.md) say PDFs work.

## Review

- Live at https://jackbush.github.io/zines/; deploys from `main` via the Pages workflow.
- Checked in headless Chrome at 1280×800 and 375×800:
  - library shelves, including `?from=home` on the links and the back button;
  - zine pages in spreads and single pages;
  - turning back, and three quick presses landing on the right page;
  - `/preview` upload, flick and scroll, replacing a file, and the bar on phones.
- Not checked: real touch swipes on a device, drag-and-drop by hand, Safari.
- Changes from the plan:
  - The top row is 4 3 2 1, not 5 4 3 2: the standard fold has pages 1–6.
  - I wrote the zine page and `Flick.astro` with the viewer so I could test it.
  - I rewrote the placeholder script after Haiku's version overflowed its panels.
