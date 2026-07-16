import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served as a GitHub Pages project site at /ppt-cover-swapper/, so asset URLs
// must be rooted there instead of "/".
export default defineConfig({
  base: '/ppt-cover-swapper/',
  plugins: [react()],
})
