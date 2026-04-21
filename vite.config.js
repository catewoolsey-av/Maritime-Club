import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  optimizeDeps: {
    esbuildOptions: {
      // Needed for pdfjs worker
      target: 'es2020'
    }
  }
})