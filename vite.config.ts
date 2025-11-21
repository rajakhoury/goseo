import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 1024,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: (chunk) => `${chunk.name}/index.js`,
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['react-icons'],
          'vendor-jszip': ['jszip'],
          'vendor-zod': ['zod'],
          'vendor-headlessui': ['@headlessui/react'],
        },
      },
    },
  },
});