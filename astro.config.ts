import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import { normalizeBasePath } from './src/lib/config/base-path';

const pagesBase = process.env.GITHUB_PAGES_BASE_PATH ?? '/';
const base = normalizeBasePath(pagesBase);

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://vitoleone.github.io',
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  image: {
    responsiveStyles: true,
  },
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
});
