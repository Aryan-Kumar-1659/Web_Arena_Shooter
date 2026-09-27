import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'assets',
  server: {
    port: 3000,
    open: true
  },
  test: {
    environment: 'node',
    globals: true
  }
});
