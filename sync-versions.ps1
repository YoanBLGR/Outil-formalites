# Script pour synchroniser toutes les versions dans le projet
# Usage: .\sync-versions.ps1 -Version "3.0.1"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SYNCHRONISATION DES VERSIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version cible: $Version" -ForegroundColor Yellow
Write-Host ""

# 1. Mettre à jour package.json
Write-Host "[1/3] Mise a jour de package.json..." -ForegroundColor Cyan
try {
    $pkg = Get-Content 'package.json' -Raw | ConvertFrom-Json
    $pkg.version = $Version
    $pkg | ConvertTo-Json -Depth 100 | Set-Content 'package.json'
    Write-Host "[OK] package.json -> $Version" -ForegroundColor Green
} catch {
    Write-Host "[X] Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Mettre à jour src-tauri/tauri.conf.json
Write-Host "[2/3] Mise a jour de src-tauri/tauri.conf.json..." -ForegroundColor Cyan
try {
    $config = Get-Content 'src-tauri/tauri.conf.json' -Raw | ConvertFrom-Json
    $config.version = $Version
    $config | ConvertTo-Json -Depth 100 | Set-Content 'src-tauri/tauri.conf.json'
    Write-Host "[OK] tauri.conf.json -> $Version" -ForegroundColor Green
} catch {
    Write-Host "[X] Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Mettre à jour src/hooks/useTauriUpdater.ts
Write-Host "[3/3] Mise a jour de src/hooks/useTauriUpdater.ts..." -ForegroundColor Cyan
try {
    $content = Get-Content 'src/hooks/useTauriUpdater.ts' -Raw
    $pattern = "const CURRENT_VERSION = '[^']+'"
    $replacement = "const CURRENT_VERSION = '$Version'"
    $newContent = $content -replace $pattern, $replacement
    
    if ($content -eq $newContent) {
        Write-Host "[!] Aucune modification (version deja a jour ou pattern non trouve)" -ForegroundColor Yellow
    } else {
        $newContent | Set-Content 'src/hooks/useTauriUpdater.ts' -NoNewline
        Write-Host "[OK] useTauriUpdater.ts -> $Version" -ForegroundColor Green
    }
} catch {
    Write-Host "[X] Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   SYNCHRONISATION TERMINEE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tous les fichiers sont maintenant a la version $Version" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichiers mis a jour:" -ForegroundColor Yellow
Write-Host "  - package.json" -ForegroundColor Gray
Write-Host "  - src-tauri/tauri.conf.json" -ForegroundColor Gray
Write-Host "  - src/hooks/useTauriUpdater.ts" -ForegroundColor Gray
Write-Host ""

