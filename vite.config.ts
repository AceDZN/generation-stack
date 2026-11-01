import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 5246, strictPort: true },
  preview: { host: '0.0.0.0', port: 4246, strictPort: true },
});
