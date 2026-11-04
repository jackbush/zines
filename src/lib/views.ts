// The three ways to read a zine, switched by the top bar's toggle: flick (one spread at a time),
// scroll (every view stacked) and flat (the sheet itself, as printed). Zine pages and /preview
// both build their reader from here.

import './views.css';
import { createFlick } from './flick';
import { createScroll } from './scroll';
import type { Page } from './sheet';

export const MODES = ['flick', 'scroll', 'flat'] as const;
export type Mode = (typeof MODES)[number];

export interface Sources {
  pages: Record<Page, string>;
  /** The whole sheet. */
  sheet: string;
}

/** Fills `root` with the sheet as one image, fitted to the space. */
function createFlat(root: HTMLElement, sheet: string) {
  root.classList.add('flat');
  const img = new Image();
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

/** Wires up a ModeToggle: marks the pressed button and calls `change` when another is picked. */
export function bindToggle(toggle: HTMLElement, mode: Mode, change: (mode: Mode) => void) {
  const press = (m: Mode) => {
    for (const b of toggle.querySelectorAll<HTMLElement>('button[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === m));
  };
  press(mode);
  toggle.addEventListener('click', (e) => {
    const next = (e.target as Element).closest<HTMLElement>('button[data-mode]')?.dataset.mode as Mode | undefined;
    if (!next || next === mode) return;
    mode = next;
    press(mode);
    change(mode);
  });
}
