import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true
  },
  kit: {
    // SSR adapter: content is read server-side from Contabo Object Storage
    // via the Content Gateway (ADR-0002). No build-time prerender.
    adapter: adapter(),
    alias: {
      $design: 'src/lib/design',
      $components: 'src/lib/design/components',
      $api: 'src/lib/api',
      $i18n: 'src/lib/i18n',
      $types: 'src/lib/types'
    },
    paths: {
      relative: false
    }
  }
};

export default config;
