// The flick viewer: a book of two page slots either side of a spine. Clicking or tapping the right
// half (or →, or a swipe left) turns forward, the left half turns back.
//
// A turn is a flattened 3D page turn. A scan line sweeps the turning leaf from its free edge to the
// spine, cutting away the page it showed to reveal the one beneath; past the spine it sweeps on
// across the far half, drawing the leaf's other side. The leaf lifts and tilts a little about the
// spine, most at the middle of the turn.
//
// Narrow screens show one page at a time: the same book, with every page in the right slot and
// the left slot left empty, so each turn is just the near half.

import './flick.css';
import { MARGIN, fitPage } from './fit';
import { PAGES, PAGE_ASPECT, VIEWS, pageAlt, pageName, type Page } from './sheet';

const TURN_MS = 700;
/** The leaf's tilt and lift at the middle of a turn, in degrees and page heights. */
const TILT_DEG = 2.5;
const LIFT = 0.012;
/** A drag this far (px) is a swipe; anything shorter is a tap. */
const SWIPE_PX = 40;

type Side = 'left' | 'right';
type View = Partial<Record<Side, Page>>;

const SPREAD_VIEWS: View[] = VIEWS.map((v) => (v.length === 2 ? { left: v[0], right: v[1] } : v[0] === 'back' ? { left: v[0] } : { right: v[0] }));
const SINGLE_VIEWS: View[] = PAGES.map((p) => ({ right: p }));

const other = (s: Side): Side => (s === 'left' ? 'right' : 'left');
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** How far (in page widths) to shift the book so a lone page sits in the middle. */
function shiftOf(view: View, single: boolean): number {
  if (single || !view.left) return -0.5;
  return view.right ? 0 : 0.5;
}

function label(view: View): string {
  return [view.left, view.right].filter((p): p is Page => !!p).map(pageName).join('–');
}

export interface Flick {
  /** Removes the viewer's listeners and markup. */
  destroy(): void;
}

/** Fills `root` with a viewer for these page images. `labels` shows the page numbers under the book. */
export function createFlick(root: HTMLElement, pages: Record<Page, string>, { labels = true } = {}): Flick {
  root.classList.add('flick');
  root.innerHTML = `
    <div class="flick-book">
      <div class="flick-slot" data-layer="under-left"></div>
      <div class="flick-slot" data-layer="under-right"></div>
      <div class="flick-slot flick-leaf" data-layer="leaf-left"><i class="flick-scan"></i></div>
      <div class="flick-slot flick-leaf" data-layer="leaf-right"><i class="flick-scan"></i></div>
    </div>
    <p class="view-label flick-label" aria-live="polite"${labels ? '' : ' hidden'}></p>`;
  const book = root.querySelector<HTMLElement>('.flick-book')!;
  const status = root.querySelector<HTMLElement>('.flick-label')!;
  const layer = (name: string) => root.querySelector<HTMLElement>(`[data-layer="${name}"]`)!;
  const under = { left: layer('under-left'), right: layer('under-right') };
  const leaf = { left: layer('leaf-left'), right: layer('leaf-right') };

  // One <img> per page, made once and moved between slots, so a turn never waits on a decode.
  const imgs = Object.fromEntries(
    PAGES.map((p) => {
      const img = new Image();
      img.src = pages[p];
      img.alt = pageAlt(p);
      img.draggable = false;
      return [p, img];
    }),
  ) as Record<Page, HTMLImageElement>;

  /** Puts `page` (or nothing) in `slot`, leaving its scan line alone. */
  function fill(slot: HTMLElement, page: Page | undefined) {
    const want = page ? imgs[page] : null;
    const have = slot.querySelector('img');
    if (have === want) return;
    have?.remove();
    if (want) slot.prepend(want);
  }

  let single = false;
  let views = SPREAD_VIEWS;
  let index = 0;
  let turn: { from: number; to: number; start: number } | null = null;
  let frame = 0;

  /** Draws the book `t` (0–1, eased) of the way through turning from view `a` to view `b`. */
  function draw(a: View, b: View, t: number, forward: boolean) {
    const near: Side = forward ? 'right' : 'left';
    const far = other(near);
    // Where the turn crosses the spine. One page at a time, only the slot on screen turns.
    const split = single ? (forward ? 1 : 0) : 0.5;
    fill(under[near], b[near]);
    fill(under[far], a[far]);
    fill(leaf[near], a[near]);
    fill(leaf[far], b[far]);

    // How much of each half the leaf covers, measured from the spine.
    const nearShown = split ? Math.max(0, 1 - t / split) : 0;
    const farShown = split < 1 ? Math.max(0, (t - split) / (1 - split)) : 0;
    const lift = Math.sin(Math.PI * t);
    for (const [side, shown] of [[near, nearShown], [far, farShown]] as const) {
      const el = leaf[side];
      const hidden = `${(1 - shown) * 100}%`;
      el.hidden = shown === 0;
      // inset() trims from the outer edge; the spine edge stays put.
      el.style.clipPath = side === 'right' ? `inset(-1px ${hidden} -1px 0)` : `inset(-1px 0 -1px ${hidden})`;
      el.style.setProperty('--scan', `${shown * 100}%`);
      // The free edge rises: a right-hand leaf turns anticlockwise about the spine, a left-hand one clockwise.
      const tilt = (side === 'right' ? -1 : 1) * TILT_DEG * lift;
      el.style.transform = `translateY(${-LIFT * lift * 100}%) rotate(${tilt}deg)`;
    }
    const shift = shiftOf(a, single) + (shiftOf(b, single) - shiftOf(a, single)) * t;
    book.style.setProperty('--shift', String(shift));
  }

  /** Draws the current view at rest: its pages laid flat, no leaf. */
  function settle() {
    const view = views[index];
    for (const side of ['left', 'right'] as const) {
      fill(leaf[side], undefined);
      leaf[side].hidden = true;
      fill(under[side], view[side]);
    }
    book.style.setProperty('--shift', String(shiftOf(view, single)));
    status.textContent = label(view);
  }

  function tick(now: number) {
    if (!turn) return;
    const t = Math.min(1, (now - turn.start) / TURN_MS);
    if (t >= 1) {
      turn = null;
      settle();
      return;
    }
    draw(views[turn.from], views[turn.to], ease(t), turn.to > turn.from);
    frame = requestAnimationFrame(tick);
  }

  function go(step: 1 | -1) {
    // A new turn lands the one in flight first, so it can't overwrite the newer one.
    if (turn) {
      cancelAnimationFrame(frame);
      turn = null;
      settle();
    }
    const to = index + step;
    if (to < 0 || to >= views.length) return;
    const from = index;
    index = to;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return settle();
    turn = { from, to, start: performance.now() };
    status.textContent = label(views[to]);
    frame = requestAnimationFrame(tick);
  }

  /** Sizes the book as the scroll view sizes its pages, switching between spreads and single pages. */
  function layout() {
    const { across, pageW } = fitPage(root.clientWidth, root.clientHeight, labels);
    const nowSingle = across === 1;
    if (nowSingle !== single) {
      // Keep the reader's place: the first page of the old view, in the new set of views.
      const page = views[index].left ?? views[index].right;
      single = nowSingle;
      views = single ? SINGLE_VIEWS : SPREAD_VIEWS;
      index = Math.max(0, views.findIndex((v) => v.left === page || v.right === page));
      if (turn) {
        cancelAnimationFrame(frame);
        turn = null;
      }
    }
    root.style.setProperty('--margin', `${MARGIN}px`);
    root.style.setProperty('--page-w', `${pageW}px`);
    root.style.setProperty('--page-h', `${pageW / PAGE_ASPECT}px`);
    root.dataset.mode = single ? 'single' : 'spread';
    if (!turn) settle();
  }

  // Taps and clicks go by which half they land on; a sideways drag is a swipe.
  let down: { x: number; y: number; id: number } | null = null;
  const onDown = (e: PointerEvent) => {
    if (e.button === 0) down = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onUp = (e: PointerEvent) => {
    if (!down || down.id !== e.pointerId) return;
    const dx = e.clientX - down.x;
    const swipe = Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - down.y);
    down = null;
    if (swipe) return go(dx < 0 ? 1 : -1);
    const { left, width } = root.getBoundingClientRect();
    go(e.clientX - left < width / 2 ? -1 : 1);
  };
  const onCancel = () => (down = null);
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || (e.target instanceof Element && e.target.closest('input, textarea, select'))) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
  };

  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onCancel);
  document.addEventListener('keydown', onKey);
  const resize = new ResizeObserver(layout);
  resize.observe(root);
  layout();

  return {
    destroy() {
      cancelAnimationFrame(frame);
      resize.disconnect();
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onCancel);
      document.removeEventListener('keydown', onKey);
      root.replaceChildren();
      root.classList.remove('flick');
      delete root.dataset.mode;
      root.style.removeProperty('--margin');
      root.style.removeProperty('--page-w');
      root.style.removeProperty('--page-h');
    },
  };
}
