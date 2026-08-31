import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5029',
      '/health': 'http://localhost:5029',
      '/signin-oidc': 'http://localhost:5029',
      '/signout-callback-oidc': 'http://localhost:5029',
    },
  },
})
