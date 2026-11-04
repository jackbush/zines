// Site-wide metadata; BaseLayout builds every page's title, share tags and icons from it.
export const site = { name: 'Zines', description: 'Zines by Jack Bush.' };

/** The palette. BaseLayout makes each a CSS variable (`paper` → `--paper`, `inkDim` → `--ink-dim`). */
export const colours = {
  /** The page: a creamy white. */
  paper: '#f7f3ea',
  /** Text, lines and filled buttons: a soft, slightly warm black. */
  ink: '#2b2824',
  inkDim: '#6e685f',
  /** A filled button under the pointer. */
  inkHover: '#4a453e',
  /** An outlined button under the pointer. */
  hover: '#e8e2d5',
  /** Behind the reader on /preview: a mid grey, a little creamy. */
  viewer: '#8c887f',
};

/** Turns a site path into a URL under `base`: url('preview/') → '/zines/preview/'. */
export function url(path = ''): string {
  return import.meta.env.BASE_URL.replace(/\/?$/, '/') + path.replace(/^\//, '');
}
