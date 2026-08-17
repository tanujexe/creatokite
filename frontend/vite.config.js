import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Suppress noise from backend restarts or abrupt aborts
          });
        },
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Suppress noise from backend restarts or abrupt aborts
          });
        },
      },
    },
  },
  preview: { host: true, port: 4173 },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react', 'react-dom', 'react-router-dom'],
          charts:  ['recharts'],
          icons:   ['lucide-react'],
          socket:  ['socket.io-client'],
          axios:   ['axios'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  },
}));
