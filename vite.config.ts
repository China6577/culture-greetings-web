import { defineConfig, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
function locationMock(): Plugin {
  const handler = (_req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ country: 'CN', language: 'zh-CN', source: 'mock' }))
  }
  return {
    name: 'culture-location-mock',
    configureServer(server) {
      server.middlewares.use('/api/location', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/location', handler)
    },
  }
}
export default defineConfig({
  plugins: [react(), tailwindcss(), locationMock()],
  resolve: {
    alias: [
      { find: /^lottie-react$/, replacement: 'lottie-react/build/index.es.js' },
      { find: /^lottie-web$/, replacement: 'lottie-web/build/player/lottie_light.js' },
    ],
  },
  server: { host: '127.0.0.1' },
})
