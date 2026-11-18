import react from '@vitejs/plugin-react';
import type { Plugin, ProxyOptions } from 'vite';
import { defineConfig } from 'vitest/config';
import { echoServerPort } from './scripts/echo-server';
import { devEndpoints } from './src/app/routes';

/**
 * Content security policy for built pages (docs/mimari.md, "Capacitor'a hazır kalmak için";
 * docs/planlar/faz-0.md, decision 6). Not applied to the dev server, whose inline React
 * refresh script it would block. `data:` images are Vite's inlined small SVGs and the favicon.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function contentSecurityPolicyMeta(): Plugin {
  return {
    name: 'tikir-content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: contentSecurityPolicy },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

/**
 * The audio lab's echo test connects to its own origin; the dev and preview servers forward the
 * WebSocket to scripts/echo-server.ts, so the CSP needs no connect-src (docs/kararlar.md T20).
 */
const echoProxy: Record<string, ProxyOptions> = {
  [devEndpoints.echo]: { target: `ws://127.0.0.1:${String(echoServerPort)}`, ws: true },
};

export default defineConfig({
  plugins: [react(), contentSecurityPolicyMeta()],
  // audioWorklet.addModule loads an ES module; `?worker&url` imports (the capture worklet) are
  // built as modules in development and in builds alike.
  worker: { format: 'es' },
  server: { proxy: echoProxy },
  preview: { proxy: echoProxy },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          include: ['src/**/*.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
});
