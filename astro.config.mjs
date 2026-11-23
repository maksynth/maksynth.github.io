// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Static site for GitHub Pages at the apex domain maksynth.com.
// 'file' build format writes /about.html, which GitHub Pages serves at the
// extension-free URL /about. Trailing slashes are never used (home excepted).
export default defineConfig({
  site: 'https://maksynth.com',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !/\/(404|500)$/.test(page.replace(/\/$/, '')),
      lastmod: new Date(),
    }),
  ],
  devToolbar: { enabled: false },
});
