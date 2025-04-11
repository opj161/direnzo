/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// import path from 'path'; // Removed unused import

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Vitest configuration moved inside defineConfig
  test: {
    globals: true, // Use global APIs like describe, it, expect
    environment: 'jsdom', // Simulate browser environment
    setupFiles: './src/setupTests.ts', // Setup file for imports like jest-dom
    // Optional: Add coverage configuration if needed later
    // coverage: {
    //   reporter: ['text', 'json', 'html'],
    // },
  },
  // Add resolve alias to match tsconfig.json (if we decide to use it later)
  // resolve: {
  //   alias: {
  //     '@': path.resolve(__dirname, './src'),
  //   },
  // },
})
