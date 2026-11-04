// @ts-check
import { defineConfig } from 'astro/config';

import panels from './integrations/panels.ts';
import versionFile from './integrations/version-file.mjs';

// Published at https://jackbush.github.io/zines/
// `base` must match the repo name exactly, or every asset 404s.
export default defineConfig({
  integrations: [panels(), versionFile()],

  site: 'https://jackbush.github.io',
  base: '/zines',

  build: {
    // Emit `preview/index.html` rather than `preview.html` so paths work under `base`.
    format: 'directory',
  },
  vite: {
    build: {
      // Keeps media queries in the `max-width` form older Safari reads.
      cssTarget: ['chrome100', 'safari15', 'firefox100'],
    },
  },
});
