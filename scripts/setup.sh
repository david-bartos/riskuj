#!/usr/bin/env bash
set -euo pipefail

echo "Preparing Riskuj local workspace..."

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not available. Install Node.js 22 LTS or newer, then run this script again." >&2
  exit 1
fi

npm ci

mkdir -p data/games data/uploads

if [ ! -f data/audio-assets.json ]; then
  printf '[]\n' > data/audio-assets.json
fi

echo
echo "Done. Start the app with:"
echo "  npm run dev"
echo
echo "Then open:"
echo "  http://localhost:5173/"
