import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createAiHandler } from './server/openai.mjs';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '.', ''), ...process.env };
  const middleware = (server: any) => server.middlewares.use('/api/ai', createAiHandler(env));
  return {
    server: { port: 3000, host: '127.0.0.1' },
    plugins: [react(), tailwindcss(), {
      name: 'openai-api', configureServer: middleware, configurePreviewServer: middleware,
    }],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  };
});
