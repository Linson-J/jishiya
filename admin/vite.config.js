import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The admin app lives under /admin-panel on the same origin as the landing page
// (the landing server proxies /admin-panel -> this dev server, and /api -> backend).
// Opening http://localhost:5173/admin-panel/ directly still works.
export default defineConfig({
  base: '/admin-panel/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // HMR websocket can't go through the landing proxy, so connect to Vite directly.
    hmr: { host: 'localhost', port: 5173, clientPort: 5173 },
  },
  preview: { port: 5173, strictPort: true },
  build: { outDir: '../landing/public/admin-panel', emptyOutDir: true },
});
