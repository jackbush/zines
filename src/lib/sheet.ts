// The 8-panel fold: one A3 landscape sheet, a 4×2 grid of A6 portrait panels, folded and slit
// into a booklet. This is the only place that knows where each page sits on the sheet; the
// build-time slicer (integrations/panels.ts) and /preview's canvas slicer both read it.
//
//   top row (printed upside down):  4  3  2  1
//   bottom row:                     5  6  back  cover
//
// Reading the sheet round from the cover gives the booklet's order, which is why the top row
// runs backwards: turn the sheet over and it reads 1 2 3 4.

export const PAGES = ['cover', '1', '2', '3', '4', '5', '6', 'back'] as const;
export type Page = (typeof PAGES)[number];

const COLS = 4;
const ROWS = 2;

/** Where each page is on the sheet: column and row from the top left, and whether it's printed upside down. */
const LAYOUT: Record<Page, { col: number; row: number; flipped: boolean }> = {
  '4': { col: 0, row: 0, flipped: true },
  '3': { col: 1, row: 0, flipped: true },
  '2': { col: 2, row: 0, flipped: true },
  '1': { col: 3, row: 0, flipped: true },
  '5': { col: 0, row: 1, flipped: false },
  '6': { col: 1, row: 1, flipped: false },
  back: { col: 2, row: 1, flipped: false },
  cover: { col: 3, row: 1, flipped: false },
};

/** What the reader sees in turn: the cover alone, the spreads, then the back alone. */
export const VIEWS: readonly (readonly Page[])[] = [['cover'], ['1', '2'], ['3', '4'], ['5', '6'], ['back']];

/** A sheet's width over its height: A-series paper is 1:√2, laid landscape. */
export const SHEET_ASPECT = Math.SQRT2;

/** A panel's width over its height. */
export const PAGE_ASPECT = SHEET_ASPECT / COLS * ROWS;

export interface PanelRect {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Printed upside down: rotate it 180° after cutting it out. */
  flipped: boolean;
}

/** The pixel rectangle of one page on a width×height sheet. Edges are rounded so neighbouring panels tile exactly. */
export function panelRect(page: Page, width: number, height: number): PanelRect {
  const { col, row, flipped } = LAYOUT[page];
  const x = (c: number) => Math.round((c * width) / COLS);
  const y = (r: number) => Math.round((r * height) / ROWS);
  return { left: x(col), top: y(row), width: x(col + 1) - x(col), height: y(row + 1) - y(row), flipped };
}

/** Whether a width×height image is A-series landscape, give or take `tolerance` (a fraction). */
export function isSheetShaped(width: number, height: number, tolerance = 0.02): boolean {
  return Math.abs(width / height / SHEET_ASPECT - 1) <= tolerance;
}
