import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, renameSync, existsSync, rmSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/main.ts'),
        background: resolve(__dirname, 'src/background/main.ts'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Generate correct filenames for scripts
          if (chunkInfo.name === 'content' || chunkInfo.name === 'background') {
            return `${chunkInfo.name}.js`;
          }
          return '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // Place HTML files at root
          if (assetInfo.name?.endsWith('.html')) {
            return '[name][extname]';
          }
          return '[name][extname]';
        },
      },
    },
  },
  plugins: [
    {
      name: 'copy-manifest-and-fix-paths',
      closeBundle() {
        // Copy manifest.json to dist after build
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        );

        // Move options HTML to root of dist if it's nested
        const nestedHtml = resolve(__dirname, 'dist/src/options/index.html');
        const rootHtml = resolve(__dirname, 'dist/options.html');

        if (existsSync(nestedHtml)) {
          renameSync(nestedHtml, rootHtml);

          // Clean up empty directories
          try {
            rmSync(resolve(__dirname, 'dist/src'), { recursive: true, force: true });
          } catch (e) {
            // Ignore errors
          }
        }
      },
    },
  ],
});
