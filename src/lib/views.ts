// The ways to read a zine: flat (the sheet itself, as printed), scroll (every view stacked) and
// flick (one spread at a time). Zine pages use flick; /preview's toggle switches between all three.

import './views.css';
import { createFlick } from './flick';
import { createScroll } from './scroll';
import { SHEET_ASPECT, type Page } from './sheet';

/** In the toggle's order. */
export const MODES = ['flat', 'scroll', 'flick'] as const;
export type Mode = (typeof MODES)[number];

export interface Sources {
  pages: Record<Page, string>;
  /** The whole sheet. */
  sheet: string;
}

/** Fills `root` with the sheet as one image, as large as fits, centred. */
function createFlat(root: HTMLElement, sheet: string) {
  root.classList.add('flat');
  // Sized by the sheet's shape: A-series until it loads, then its own, as an upload may differ.
  root.style.setProperty('--sheet-aspect', String(SHEET_ASPECT));
  const img = new Image();
  img.onload = () => root.style.setProperty('--sheet-aspect', String(img.naturalWidth / img.naturalHeight));
  img.src = sheet;
  img.alt = 'The whole sheet, as printed';
  root.append(img);
  return {
    destroy() {
      root.replaceChildren();
      root.classList.remove('flat');
    },
  };
}

/**
 * Fills `stage` (which must be positioned) with one view of the zine, in a child that covers it,
 * so views never leave anything behind on the stage. `labels` shows page numbers under the pages.
 */
export function createView(stage: HTMLElement, mode: Mode, sources: Sources, options: { labels?: boolean } = {}): { destroy(): void } {
  const root = document.createElement('div');
  root.className = 'view';
  stage.append(root);
  const view =
    mode === 'flick' ? createFlick(root, sources.pages, options)
    : mode === 'scroll' ? createScroll(root, sources.pages, options)
    : createFlat(root, sources.sheet);
  return {
    destroy() {
      view.destroy();
      root.remove();
    },
  };
}

/**
 * Wires up a ModeToggle: marks the pressed button and calls `change` when another is picked.
 * Returns a function that presses a button from code, without calling `change`.
 */
export function bindToggle(toggle: HTMLElement, mode: Mode, change: (mode: Mode) => void): (mode: Mode) => void {
  const press = (m: Mode) => {
    mode = m;
    for (const b of toggle.querySelectorAll<HTMLElement>('button[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === m));
  };
  press(mode);
  toggle.addEventListener('click', (e) => {
    const next = (e.target as Element).closest<HTMLElement>('button[data-mode]')?.dataset.mode as Mode | undefined;
    if (!next || next === mode) return;
    press(next);
    change(next);
  });
  return press;
}
