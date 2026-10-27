import { createRequire } from 'module';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __nodeRequire = createRequire(import.meta.url);
const rootDir = path.dirname(fileURLToPath(import.meta.url));

function collectUsedLucideIcons(dir: string, out = new Set<string>()): Set<string> {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectUsedLucideIcons(fullPath, out);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        if (entry.name === 'importedTemplates.ts') continue;
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
    build: {
      outDir: path.resolve(rootDir, 'dist-app'),
      emptyOutDir: true,
      copyPublicDir: false,
      sourcemap: false,
      minify: 'esbuild',
      cssMinify: 'esbuild',
      cssCodeSplit: true,
      target: 'esnext',
      reportCompressedSize: false,
      rollupOptions: {
        input: 'app.html',
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // React Core & Essentials
              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('@base-ui')) {
                return 'vendor-react-core';
              }
              // Router (Standalone for mobile)
              if (id.includes('/react-router/') || id.includes('/react-router-dom/')) {
                return 'vendor-router';
              }
              // Icons
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              // Motion
              if (id.includes('framer-motion') || id.includes('/motion/')) {
                return 'vendor-motion';
              }
              // Utilities & Networking
              if (id.includes('axios') || id.includes('socket.io-client') || id.includes('dompurify')) {
                return 'vendor-network';
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
  };
});
