/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Production builds ship a Content-Security-Policy that forbids ANY network
 * request from the page (connect-src 'none'). Even if a bug or a malicious
 * dependency tried to upload your data, the browser would block it.
 * (Not applied in dev, because Vite's hot reload needs a websocket.)
 */
const strictCsp = (): Plugin => ({
  name: 'strict-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const policy = [
      "default-src 'self'",
      "script-src 'self'",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'none'",
      "form-action 'none'",
      "base-uri 'self'",
    ].join('; ')
    return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`)
  },
})

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), strictCsp()],
  test: { environment: 'node' },
})
