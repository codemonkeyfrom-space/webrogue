import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        mapgen: 'mapgenDemo.html',  // the name "mapgen" here is arbitrary
      },
    },
    outDir: 'dist', // where Vite puts the built files
    emptyOutDir: true, // optional, cleans dist before build
  },
});