import { defineConfig } from 'vite';
import path from 'node:path';
const __dirname = import.meta.dirname;

export default defineConfig({
  build: {
    publicDir: 'client',
    minify: false,
    emptyOutDir: false,
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.js'),
        style: path.resolve(__dirname, 'client/index.css')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      }
    },
  },
});
