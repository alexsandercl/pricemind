import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // ⚠️ ADICIONE ISTO:
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignora avisos de imports não usados
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      }
    },
    // Ignora erros de TypeScript no build
    commonjsOptions: {
      ignoreTryCatch: true
    }
  }
})