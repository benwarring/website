import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Served from https://benwarring.github.io/website/. For a custom domain or a
// benwarring.github.io repo, set `site` to that origin and delete `base`.
// Keep the trailing slash on `base`: links are built as BASE_URL + path.
export default defineConfig({
  site: 'https://benwarring.github.io',
  base: '/website/',
  integrations: [react()],
});
