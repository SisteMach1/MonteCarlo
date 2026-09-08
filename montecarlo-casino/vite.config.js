import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANTE: Cambiá 'montecarlo-casino' por el nombre de TU repo en GitHub
// Ejemplo: si tu repo es https://github.com/tuusuario/mi-casino -> poné base: '/mi-casino/'
export default defineConfig({
  plugins: [react()],
  base: './', // Esto hace que funcione en cualquier repo y en GitHub Pages
})
