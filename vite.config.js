import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/logfile-parser/dist/',
  build: {
    chunkSizeWarningLimit: 1500,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
