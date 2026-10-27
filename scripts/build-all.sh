#!/bin/bash
set -e

echo "==================================="
echo "   Perplexta Unified Build 🚀      "
echo "==================================="

echo "[1/5] Building Standalone Desktop Web & Server..."
npm run build

echo "[2/5] Building Standalone Lightweight Mobile App..."
npm run build:app

echo "[3/5] Syncing Native Mobile Assets (Capacitor)..."
npx cap sync

echo "[4/5] Running PWA & Manifest Security Audit..."
npm run validate:pwa

echo "[5/5] Done! The sovereign multi-platform stack is ready."
echo "-> Desktop Bundle: /dist (Standard PWA)"
echo "-> Mobile Bundle: /dist-app (Lightweight Native Shell)"
echo "-> Android Project: /android"
echo "-> iOS Project: /ios"
echo "-> Server Runtime: dist/server.cjs"
