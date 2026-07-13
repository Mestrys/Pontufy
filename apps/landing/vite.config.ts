import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // 'mpa': sem isso, o fallback de SPA do Vite reescreve QUALQUER rota
    // sem extensão (ex.: /terms) para o index.html raiz, ignorando os
    // index.html estáticos em public/terms e public/privacy. Este projeto
    // não usa router client-side, então nenhuma rota depende do fallback.
    appType: 'mpa' as const,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
