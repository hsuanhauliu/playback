import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset URLs so the same build works from a project page
  // (user.github.io/playback/), a user page, or a custom domain without
  // hardcoding the repository name.
  base: './',
  build: {
    // GitHub Pages can serve straight from this folder on the default branch.
    outDir: 'docs',
    emptyOutDir: true,
  },
})
