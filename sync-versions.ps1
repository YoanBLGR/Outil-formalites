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

# Encodeur UTF8 sans BOM pour compatibilité PowerShell 5.1 et 7+
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

# 1. Mettre à jour package.json
Write-Host "[1/3] Mise a jour de package.json..." -ForegroundColor Cyan
try {
    $content = Get-Content 'package.json' -Raw -Encoding UTF8
    # Remplacer uniquement la ligne de version avec une regex
    $content = $content -replace '("version"\s*:\s*)"[^"]*"', "`$1`"$Version`""
    [System.IO.File]::WriteAllText((Resolve-Path 'package.json'), $content, $utf8NoBom)
    Write-Host "[OK] package.json -> $Version" -ForegroundColor Green
} catch {
    Write-Host "[X] Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Mettre à jour src-tauri/tauri.conf.json
Write-Host "[2/3] Mise a jour de src-tauri/tauri.conf.json..." -ForegroundColor Cyan
try {
    $content = Get-Content 'src-tauri/tauri.conf.json' -Raw -Encoding UTF8
    # Remplacer uniquement la ligne de version avec une regex
    $content = $content -replace '("version"\s*:\s*)"[^"]*"', "`$1`"$Version`""
    [System.IO.File]::WriteAllText((Resolve-Path 'src-tauri/tauri.conf.json'), $content, $utf8NoBom)
    Write-Host "[OK] tauri.conf.json -> $Version" -ForegroundColor Green
} catch {
    Write-Host "[X] Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Mettre à jour src/hooks/useTauriUpdater.ts
Write-Host "[3/3] Mise a jour de src/hooks/useTauriUpdater.ts..." -ForegroundColor Cyan
try {
    $content = Get-Content 'src/hooks/useTauriUpdater.ts' -Raw -Encoding UTF8
    $pattern = "const CURRENT_VERSION = '[^']+'"
    $replacement = "const CURRENT_VERSION = '$Version'"
    $newContent = $content -replace $pattern, $replacement
    
    if ($content -eq $newContent) {
        Write-Host "[!] Aucune modification (version deja a jour ou pattern non trouve)" -ForegroundColor Yellow
    } else {
        [System.IO.File]::WriteAllText((Resolve-Path 'src/hooks/useTauriUpdater.ts'), $newContent, $utf8NoBom)
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

