import { defineConfig } from 'vite';

export default defineConfig({
  base: '/webrogue/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        mapgen: 'mapgenDemo.html'
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});