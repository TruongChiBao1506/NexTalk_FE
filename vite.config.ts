import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/agora-rtc-sdk-ng')) {
              return 'agora-rtc';
            }
            if (id.includes('node_modules/sockjs-client')) {
              return 'sockjs-fallback';
            }
            if (id.includes('node_modules/firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('node_modules/@zxing/browser')) {
              return 'zxing-scanner';
            }
            if (id.includes('node_modules/@tiptap')) {
              return 'tiptap-editor';
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/ws-raw': {
          target: backendUrl,
          ws: true,
          changeOrigin: true,
        },
        '/ws': {
          target: backendUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});

