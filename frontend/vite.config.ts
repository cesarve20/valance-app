import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Aumentamos el límite de aviso a 1000kb (1MB) para que no moleste por tonterías
    chunkSizeWarningLimit: 1000, 
    
    // 2. Opcional: Dividimos las librerías grandes en archivos separados
    rollupOptions: {
        output: {
            manualChunks: {
                'vendor': ['react', 'react-dom', 'react-router-dom', 'axios'],
                'charts': ['recharts'], // Recharts suele ser pesado, lo separamos
                'ui': ['lucide-react']  // Los íconos también aparte
            }
        }
    }
  }
})