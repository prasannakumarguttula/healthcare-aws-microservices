import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/patients': 'http://localhost:8080',
      '/appointments': 'http://localhost:8080',
      '/records': 'http://localhost:8080',
      '/notifications': 'http://localhost:8080',
      '/health': 'http://localhost:8080',
      '/api/health': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/api\/health/, '/health'),
      },
    },
  },
});
