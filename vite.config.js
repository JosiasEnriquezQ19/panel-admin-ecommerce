import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server runs on port 3001 based on your error message
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5184',
        changeOrigin: true,
        secure: false,
  // Keep the /api prefix so the backend route /api/Productos is preserved.
  // If your backend expects the path without /api, re-enable rewrite accordingly.
  // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
