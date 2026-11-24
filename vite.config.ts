import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    host: true,
    // The site answers on merovelis.com and redirects its two earlier hosts
    // page by page, so local checks of those redirects need the dev server to
    // accept their host headers: `curl -I -H 'Host: rbxsystems.ch'
    // http://localhost:5173/sobre` or an /etc/hosts entry. Production never
    // runs the Vite server.
    allowedHosts: ['merovelis.com', 'www.merovelis.com', 'rbx.ia.br', 'rbxsystems.ch']
  }
});
