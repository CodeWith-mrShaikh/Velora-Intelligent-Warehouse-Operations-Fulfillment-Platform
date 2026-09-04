# Velora — Intelligent Warehouse Operations & Fulfillment Platform — Quick Start Launcher
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Velora — Intelligent Warehouse Operations & Fulfillment Platform  " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify Node.js
try {
    $nodeVer = node -v
    Write-Host "[OK] Node.js is installed: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found in PATH. Please install Node.js >= 18." -ForegroundColor Red
    exit 1
}

$root = $PSScriptRoot

# Check backend database
if (-not (Test-Path "$root\backend\dev.db")) {
    Write-Host "[INFO] Initializing SQLite database and running seeder..." -ForegroundColor Yellow
    Push-Location "$root\backend"
    npx prisma db push --accept-data-loss
    npm run seed
    Pop-Location
}

Write-Host "`n[DEMO CREDENTIALS]" -ForegroundColor Cyan
Write-Host "  Admin:             admin@example.com   / admin123"
Write-Host "  Warehouse Manager: manager@example.com / manager123"
Write-Host "  Staff:             staff@example.com   / staff123"
Write-Host "  Picker:            picker@example.com  / picker123"
Write-Host "`n[TARGET SCENARIO]" -ForegroundColor Magenta
Write-Host "  Demo Order:   ORD-2026-000001 (Wireless Mouse x 5)"
Write-Host "  Pick Location: WH01-A02-B03 (WM-001)"
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Starting Backend API on http://localhost:5000..." -ForegroundColor Green
Write-Host "Starting Frontend App on http://localhost:5173..." -ForegroundColor Green
Write-Host "Interactive Swagger API Docs on http://localhost:5000/api/docs" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan

# Launch backend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm run dev"

# Launch frontend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
