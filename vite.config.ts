/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default ({ mode }: {mode: string}) => {
  const env = loadEnv(mode, process.cwd());
  return defineConfig({
    plugins: [
      vue(),
      viteSingleFile(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      hmr: {
        path: 'hmr',
      },
    },
    publicDir: './public',
    base: './',
    test: {
      environment: 'happy-dom',
    },
  });
}
