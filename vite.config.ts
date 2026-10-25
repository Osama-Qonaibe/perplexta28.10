import { createRequire } from 'module';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Polyfill brace-expansion for modern minimatch/glob compatibility in build environments
const __nodeRequire = createRequire(import.meta.url);
try {
  const be = __nodeRequire('brace-expansion');
  if (be && typeof be === 'function' && !be.expand) {
    be.expand = be;
    be.default = be;
  }
} catch (_) {}

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function collectUsedLucideIcons(dir: string, out = new Set<string>()): Set<string> {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectUsedLucideIcons(fullPath, out);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (!content.includes('lucide-react')) continue;
        const importRegex = /import\s+(?:type\s+)?\{([^{}]*)\}\s+from\s+['"]lucide-react['"]/g;
        let match: RegExpExecArray | null;
        while ((match = importRegex.exec(content)) !== null) {
          const block = match[1]
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');
          const specifiers = block.split(',');
          for (const raw of specifiers) {
            const cleaned = raw.replace(/\btype\b/g, '').trim();
            if (!cleaned) continue;
            const importedName = cleaned.split(/\s+as\s+/)[0].trim();
            if (importedName) out.add(importedName);
          }
        }
      }
    }
  } catch (_) {}
  return out;
}

const lucideBarrelOptimizerPlugin = () => {
  let usedIcons: Set<string> | null = null;
  return {
    name: 'lucide-barrel-optimizer',
    enforce: 'pre' as const,
    load(id: string) {
      const cleanId = id.split('?')[0];
      if (!cleanId.endsWith('lucide-react/dist/esm/lucide-react.js')) return null;
      if (!usedIcons) {
        usedIcons = collectUsedLucideIcons(path.resolve(rootDir, 'src'));
      }
      if (usedIcons.size === 0 || usedIcons.has('icons')) return null;
      const source = fs.readFileSync(cleanId, 'utf8');
      const lines = source.split('\n');
      const filtered = lines.filter((line) => {
        if (line.includes('./icons/index.js') || line.includes('export { index as icons }')) {
          return false;
        }
        if (line.includes("from './icons/")) {
          const aliasMatches = line.matchAll(/\bas\s+([A-Za-z0-9_]+)/g);
          for (const m of aliasMatches) {
            if (usedIcons!.has(m[1])) return true;
          }
          return false;
        }
        return true;
      });
      return filtered.join('\n');
    },
  };
};

const pwaConfig: any = {
  registerType: 'autoUpdate',
  injectRegister: 'script-defer',
  manifest: false, // Let public/manifest.json and server dynamic manifest be authoritative
  workbox: {
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/\.well-known\//],
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    globPatterns: ['**/*.js', '**/*.css', '**/*.html', '**/*.png', '**/*.svg'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gstatic-fonts-cache',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\/api\/.*/i,
        handler: 'NetworkOnly',
      },
    ],
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, 'VITE_');
  return {
    root: rootDir,
    base: '/',
    publicDir: path.resolve(rootDir, 'public'),
    plugins: [
      lucideBarrelOptimizerPlugin(),
      react(),
      tailwindcss(),
    ],
    define: {},
    build: {
      outDir: path.resolve(rootDir, 'dist'),
      emptyOutDir: true,
      copyPublicDir: false,
      sourcemap: false,
      minify: 'esbuild',
      cssMinify: 'esbuild',
      cssCodeSplit: true,
      target: 'esnext',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        input: 'index.html',
        maxParallelFileOps: 4,
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
                return 'vendor-react';
              }
              if (id.includes('/react-router/') || id.includes('/react-router-dom/')) {
                return 'vendor-router';
              }
              if (id.includes('framer-motion') || id.includes('/motion/')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
            }
          },
        },
      }
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router-dom'],
      alias: {
        '@': path.resolve(rootDir, 'src'),
        '/src': path.resolve(rootDir, 'src'),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'motion',
        '@tanstack/react-query',
        'recharts',
        'd3',
      ],
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      headers: {
        'Content-Security-Policy': "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src * 'self' 'unsafe-inline'; img-src * 'self' data: blob:; connect-src * 'self' 'unsafe-inline' 'unsafe-eval' blob:; frame-ancestors * 'self';"
      },
      hmr: false,
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/android/**',
          '**/ios/**',
          '**/uploads/**',
          '**/.git/**',
          '**/.github/**',
        ],
      },
    },
    preview: {
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});