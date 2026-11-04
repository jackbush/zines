# Zines: todo

How the site works is in `CLAUDE.md` and `README.md`; this file is only what's left to do.

## Open

- [ ] Check the panel map (`src/lib/sheet.ts`) against one of your real sheets in `/preview`.
- [ ] Replace the navy `Sample` in `src/zines/` with real zines and their Ko-fi `buy` links.
- [ ] Share image and PNG home-screen icons. BaseLayout leaves out `og:image` until there is one.
- [ ] Bar's bottom border reported missing on a zine with its own `background`. It rendered in Chrome at 1×, 1.5× and 2×. Waiting on which browser, and a screenshot.
- [ ] Not tested yet: real touch swipes on a phone, dragging a file in by hand, Safari and Firefox.

## Later

- [ ] **PDF sheets.** Let a zine's sheet be an A3 landscape PDF. Choose one of two scopes:
  - **Option A, build-time conversion only (try this first).** Put the PDF in `src/zines/` and have the build turn its first page into a PNG. Everything after that stays as it is today.
    - The manifest's `file` accepts `.pdf`.
    - `integrations/panels.ts` renders page 1 to an A3 PNG at a fixed dpi (150–300) and caches it in `src/generated/`, keyed on the PDF's content hash, so unchanged PDFs aren't re-rendered.
    - That PNG then goes through the normal cutting.
    - `/preview` stays PNG-only: export a PNG to check a sheet there.
    - Renderer: pdf.js in Node with `@napi-rs/canvas` (no system packages, works on Actions as-is), or `pdftoppm` (poppler) installed in the deploy workflow. Prefer pdf.js unless it's slow.
  - **Option B, native PDF in `/preview` too.** Everything in option A, plus:
    - `/preview` loads pdf.js (`pdfjs-dist`) only on that page.
    - Its picker and drop target take `application/pdf`.
    - It renders page 1 to a canvas and passes it to `slice()`, which already takes anything `createImageBitmap` accepts. Flat shows the rendered image.
    - Keep the stale-upload guard and object-URL cleanup.
    - Keep the render dpi in one place shared with the build, so both produce the same pages.
  - **Done when:** a vector PDF and its PNG export give the same pages wherever PDFs are supported. `npm run check` passes, and README ("Add a zine") and CLAUDE.md say PDFs work.
