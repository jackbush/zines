// How big the scroll and flick views draw a page and where they start, shared so that toggling
// between them leaves the cover where it was.

import { PAGE_ASPECT } from './sheet';

/** Below this width (px) the views show one page at a time. */
const NARROW_PX = 600;
/** Space around the pages (px), and below them for their label. */
export const MARGIN = 16;
const LABEL = 24;

/** The page width (px) that fits `across` pages in the width and one view in the height. */
export function fitPage(width: number, height: number, labels: boolean): { across: 1 | 2; pageW: number } {
  const across = width < NARROW_PX ? 1 : 2;
  const pageW = Math.max(0, Math.min((width - 2 * MARGIN) / across, (height - 2 * MARGIN - (labels ? LABEL : 0)) * PAGE_ASPECT));
  return { across, pageW };
}
