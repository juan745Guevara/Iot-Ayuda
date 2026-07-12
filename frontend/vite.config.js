// Configuración Vite: dev server, proxy API y build de producción

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Desarrollo con hot reload
    proxy: {
      '/api': 'http://localhost:3000', // API REST al backend
      '/socket.io': { target: 'http://localhost:3000', ws: true }, // WebSocket Socket.IO
    },
  },
  build: {
    outDir: 'dist', // Carpeta que sirve el backend en producción
    emptyOutDir: true,
  },
});
