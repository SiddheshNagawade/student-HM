import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  root: path.resolve(__dirname, 'src', 'student'),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [react()],
  build: { outDir: path.resolve(__dirname, 'dist'), emptyOutDir: true },
  css: { postcss: path.resolve(__dirname) },
})
