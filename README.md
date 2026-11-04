# Zines

Zines by Jack Bush, at https://jackbush.github.io/zines/.

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

## Reading

- **Library** (`/zines/`): shelves of covers. The last one holds a link to `/zines/preview/`.
- **Zine pages**: click or tap the right half (or →, or swipe left) for the next page, the left half to go back. Phones show one page at a time.
- **Preview** (`/zines/preview/`): drop in a sheet to read it as scroll or flick before publishing. Nothing is saved or uploaded.
