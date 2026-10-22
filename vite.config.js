import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Base relativa: o build em dist/ funciona tambem hospedado em subpasta.
  base: './',
  server: {
    open: true,
    host: '127.0.0.1',
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
