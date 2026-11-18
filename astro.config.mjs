import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Served from the custom domain https://benwarring.com (set in the repo's
// GitHub Pages settings), so the site lives at the root and needs no `base`.
// Internal links are still built as import.meta.env.BASE_URL + path, so
// serving from a sub-path again only needs a `base: '/<path>/'` line here.
export default defineConfig({
  site: 'https://benwarring.com',
  integrations: [react()],
});
