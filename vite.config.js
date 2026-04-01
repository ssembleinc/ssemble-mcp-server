import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

const app = process.env.APP;

const inputs = {
  'templates-app': resolve(import.meta.dirname, 'src/apps/templates-app.html'),
  'music-app': resolve(import.meta.dirname, 'src/apps/music-app.html'),
  'game-videos-app': resolve(import.meta.dirname, 'src/apps/game-videos-app.html'),
  'meme-hooks-app': resolve(import.meta.dirname, 'src/apps/meme-hooks-app.html'),
  'shorts-app': resolve(import.meta.dirname, 'src/apps/shorts-app.html'),
};

export default defineConfig({
  root: resolve(import.meta.dirname, 'src/apps'),
  plugins: [viteSingleFile()],
  build: {
    outDir: resolve(import.meta.dirname, 'src/apps/dist'),
    emptyOutDir: false,
    rollupOptions: {
      input: inputs[app],
    },
  },
});
