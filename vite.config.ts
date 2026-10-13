import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Libraries change less often than app code: a separate chunk stays cached across deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\/](react|react-dom|scheduler|react-router|react-router-dom|cookie|set-cookie-parser)[\/]/.test(id)) return 'react';
          if (/[\/](@tanstack|axios)[\/]/.test(id)) return 'query';
          return undefined;
        },
      },
    },
  },
});
