#!/usr/bin/env bash
# web-pilot installer (Mac / Linux)
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/sharkev404/claude-web-pilot/main/install.sh | bash
# O despues de clonar:
#   ./install.sh

set -e

echo ""
echo "==> Instalando web-pilot..."
echo ""

# 1. Check Node
if ! command -v node &> /dev/null; then
    echo "[ERR] Node.js no esta instalado. Instala Node 20+ desde https://nodejs.org"
    exit 1
fi
echo "[OK] Node detectado: $(node --version)"

# 2. npm install
echo ""
echo "==> Instalando dependencias (Playwright)..."
npm install

# 3. Playwright browser
echo ""
echo "==> Descargando Chromium (~300MB, primera vez)..."
npx playwright install chromium

# 4. Done
echo ""
echo "==> Listo. Prueba:"
echo "    node scripts/navigate.js \"https://example.com\""
echo ""
echo "Lee SKILL.md y README.md para uso completo."
