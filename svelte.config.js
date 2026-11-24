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
    },
    // A form submitted from another origin is refused with 403 before any
    // hook runs, and the origin of a deployment is its ORIGIN. No origin is
    // trusted, the two earlier hosts included: the site has no form action
    // and no endpoint that reads a form body (docs/adr/ADR-0003).
    csrf: {
      trustedOrigins: []
    }
  }
};

export default config;
