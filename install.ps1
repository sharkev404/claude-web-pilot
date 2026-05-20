# web-pilot installer (Windows / PowerShell)
# Uso:
#   irm https://raw.githubusercontent.com/sharkev404/claude-web-pilot/main/install.ps1 | iex
# O despues de clonar:
#   .\install.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==> Instalando web-pilot..." -ForegroundColor Cyan
Write-Host ""

# 1. Check Node
try {
    $nodeVer = node --version
    Write-Host "[OK] Node detectado: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERR] Node.js no esta instalado. Instala Node 20+ desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. npm install
Write-Host ""
Write-Host "==> Instalando dependencias (Playwright)..." -ForegroundColor Cyan
npm install

# 3. Playwright browser
Write-Host ""
Write-Host "==> Descargando Chromium (~300MB, primera vez)..." -ForegroundColor Cyan
npx playwright install chromium

# 4. Done
Write-Host ""
Write-Host "==> Listo. Prueba:" -ForegroundColor Green
Write-Host "    node scripts/navigate.js `"https://example.com`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "Lee SKILL.md y README.md para uso completo." -ForegroundColor Gray
