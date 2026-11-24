import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { buildRelease } from './scripts/build-release.mjs';

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __RBX_BUILD_RELEASE__: JSON.stringify(
      buildRelease({
        revision: process.env.RBX_BUILD_REVISION,
        builtAt: process.env.RBX_BUILD_BUILT_AT
      })
    )
  },
  server: {
    port: 5173,
    host: true,
    // Locale is decided by the request host (rbx.ia.br = pt-BR, rbxsystems.ch
    // = en), so local checks of the en site need the dev server to accept
    // that host header: `curl -H 'Host: rbxsystems.ch' http://localhost:5173/`
    // or an /etc/hosts entry. Production never runs the Vite server.
    allowedHosts: ['rbx.ia.br', 'rbxsystems.ch']
  }
});
