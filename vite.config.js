// vite.config.js (dentro de leadsflow-dev)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({

  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ADICIONE ESTA SEÇÃO
  server: {
    port: 5174, // Define a porta para o servidor de desenvolvimento do frontend
  }
})
