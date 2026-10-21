import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // evz_clerk: /clerk/ la sirve Django. En desarrollo se pasa por este
      // servidor para que quede en el mismo origen que el panel y lea el
      // mismo token de localStorage. La pantalla llama a /fvj/api/clerk/ y
      // carga sus estáticos de /fvj/static/. Backend: VITE_BACKEND_ORIGIN
      // (por defecto http://localhost:8002, como .env.local).
      proxy: {
        '/clerk': {
          target: process.env.VITE_BACKEND_ORIGIN || 'http://localhost:8002',
          rewrite: (p: string) => `/fvj${p}`,
        },
        '/fvj/api': process.env.VITE_BACKEND_ORIGIN || 'http://localhost:8002',
        '/fvj/static': process.env.VITE_BACKEND_ORIGIN || 'http://localhost:8002',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
