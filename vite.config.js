import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true
  }
}); 