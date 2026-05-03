import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// iOS (Capacitor) では '/' 必須、GitHub Pages では '/skill-tree-app/'
// VITE_BASE で上書き可能
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/skill-tree-app/',
})
