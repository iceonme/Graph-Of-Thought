
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      '3f057c93-6ce1-47ff-95e2-2853107887c3-00-2mtw2mmbu6zq9.kirk.replit.dev',
      'c3bea334-dcbf-4a73-950a-f859dbb4950f-00-1xs6rfdtum41i.janeway.replit.dev',
      'all'
    ]
  }
})
