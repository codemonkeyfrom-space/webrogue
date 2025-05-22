import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // where Vite puts the built files
    emptyOutDir: true, // optional, cleans dist before build
  },
});
