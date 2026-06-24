import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true
  },
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: false
    }),
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
    prerender: {
      handleHttpError: 'warn',
      handleMissingId: 'warn',
      handleUnseenRoutes: 'ignore'
    }
  }
};

export default config;
