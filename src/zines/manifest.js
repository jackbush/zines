// Every zine on the shelves, in order. Each needs a `name`; its sheet is src/zines/<slug>.png
// unless `file` says otherwise, and its URL is the name slugified unless `slug` says otherwise.
// `buy` (a Ko-fi shop item URL) adds a "Buy a copy" link to its page. See src/lib/manifest.ts.
export default [
  { name: 'Placeholder One', buy: 'https://ko-fi.com/' },
  { name: 'Placeholder Two' },
  { name: 'Placeholder Three' },
  { name: 'Placeholder Four' },
];
