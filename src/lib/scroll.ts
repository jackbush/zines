// The scroll view: every view of the book stacked down the page, a spread's two pages touching at
// the spine, lone pages centred. Narrow screens get one page per row instead of spreads.

import './scroll.css';
import { MARGIN, fitPage } from './fit';
import { PAGES, PAGE_ASPECT, VIEWS, pageAlt, pageName, type Page } from './sheet';

export interface Scroll {
  /** Removes the view's listeners and markup. */
  destroy(): void;
}

/** Fills `root` with a scrolling stack of these page images. `labels` captions each view with its page numbers. */
export function createScroll(root: HTMLElement, pages: Record<Page, string>, { labels = true } = {}): Scroll {
  root.classList.add('scroll');
  root.tabIndex = 0;
  root.setAttribute('aria-label', 'All pages');

  // One <img> per page, made once and moved between layouts.
  const imgs = Object.fromEntries(
    PAGES.map((p) => {
      const img = new Image();
      img.src = pages[p];
      img.alt = pageAlt(p);
      return [p, img];
    }),
  ) as Record<Page, HTMLImageElement>;

  let narrow: boolean | null = null;

  function build() {
    const groups = narrow ? PAGES.map((p) => [p]) : VIEWS;
    root.replaceChildren(
      ...groups.map((group) => {
        const figure = document.createElement('figure');
        figure.className = 'scroll-view';
        const row = document.createElement('div');
        row.className = 'scroll-pages';
        row.append(...group.map((p) => imgs[p]));
        figure.append(row);
        if (labels) {
          const caption = document.createElement('figcaption');
          caption.className = 'view-label';
          caption.textContent = group.map(pageName).join('–');
          figure.append(caption);
        }
        return figure;
      }),
    );
  }

  /** Sizes the pages to fit the width, and short enough that a view fits the height. */
  function layout() {
    const { across, pageW } = fitPage(root.clientWidth, root.clientHeight, labels);
    if ((across === 1) !== narrow) {
      narrow = across === 1;
      build();
    }
    root.style.setProperty('--margin', `${MARGIN}px`);
    root.style.setProperty('--page-w', `${pageW}px`);
    root.style.setProperty('--page-h', `${pageW / PAGE_ASPECT}px`);
  }

  const resize = new ResizeObserver(layout);
  resize.observe(root);
  layout();

  return {
    destroy() {
      resize.disconnect();
      root.replaceChildren();
      root.classList.remove('scroll');
      root.removeAttribute('tabindex');
      root.removeAttribute('aria-label');
      root.style.removeProperty('--margin');
      root.style.removeProperty('--page-w');
      root.style.removeProperty('--page-h');
    },
  };
}
