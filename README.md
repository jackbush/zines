# Zines

- **Library** (`/zines/`): shelves of covers. The last one holds a link to `/zines/preview/`.
- **Zine pages**: click or tap the right half (or →, or swipe left) for the next page, the left half to go back. Phones show one page at a time. **Buy a copy** sits at the top right when the zine has a `buy` link.
- **Preview** (`/zines/preview/`): opens on a sample sheet, flat. Drop in or choose a sheet to read it as Flat (the whole sheet), Scroll or Flick before publishing, with page numbers shown. Your own files open in Flick. **(update)** after the file name swaps in a new version. Nothing is saved or uploaded.

In the manifest, `buy` (a Ko-fi link) adds **Buy a copy** and `download: true` adds **Download** (the original sheet, to print) at the top right of the zine's page. A zine's `background` (hex, e.g. `'#f4efe6'`) colours its page below the top bar (otherwise it's the same creamy grey as `/preview`).

## Run locally

```sh
npm install
npm run dev      # http://localhost:4321/zines/
npm run build    # writes dist/
npm run check    # type check
```

## Add a zine

Drop the sheet (an A3 landscape PNG) in `src/zines/`, then add an entry to `src/zines/manifest.js`.

The sheet is the 8-panel fold: a 4×2 grid, top row printed upside down.

```
top row (upside down):  4  3  2  1
bottom row:             5  6  back  cover
```

`node scripts/placeholder.mjs ["Name" …]` writes numbered test sheets.
