import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`         → normal deployable site (video + assets as separate files)
// `npm run build:single`  → one self-contained index.html (everything inlined)
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
}));
