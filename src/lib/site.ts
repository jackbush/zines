// Site-wide metadata; BaseLayout builds every page's title, share tags and icons from it.
export const site = { name: 'Zines', description: 'Zines by Jack Bush.' };

/** Turns a site path into a URL under `base`: url('preview/') → '/zines/preview/'. */
export function url(path = ''): string {
  return import.meta.env.BASE_URL.replace(/\/?$/, '/') + path.replace(/^\//, '');
}
