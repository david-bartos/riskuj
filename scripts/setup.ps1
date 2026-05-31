$ErrorActionPreference = "Stop"

Write-Host "Preparing Riskuj local workspace..."

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not available. Install Node.js 22 LTS or newer, then run this script again."
}

npm ci

New-Item -ItemType Directory -Force -Path "data" | Out-Null
New-Item -ItemType Directory -Force -Path "data/games" | Out-Null
New-Item -ItemType Directory -Force -Path "data/uploads" | Out-Null

if (-not (Test-Path "data/audio-assets.json")) {
  "[]" | Set-Content -Path "data/audio-assets.json" -Encoding UTF8
}

Write-Host ""
Write-Host "Done. Start the app with:"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open:"
Write-Host "  http://localhost:5173/"
