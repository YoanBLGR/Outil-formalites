# Script de diagnostic pour tester le système d'auto-update
param([string]$Version = "")

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "   DIAGNOSTIC AUTO-UPDATE SYSTEM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$REPO_OWNER = "yoyoboul"
$REPO_NAME = "formalyse"

if (-not $Version) {
    $Version = (Get-Content "package.json" | ConvertFrom-Json).version
    Write-Host "[INFO] Version actuelle: $Version" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Version à tester: $Version" -ForegroundColor Yellow
}
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# TEST 1: Configuration Tauri
Write-Host "[TEST 1] Configuration tauri.conf.json" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor Gray

try {
    $config = Get-Content "src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
    
    if ($config.plugins.updater) {
        Write-Host "  ✓ Plugin updater configuré" -ForegroundColor Green
        
        if ($config.plugins.updater.endpoints) {
            $endpoint = $config.plugins.updater.endpoints[0]
            Write-Host "  ✓ Endpoint: $endpoint" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "  ✗ Aucun endpoint!" -ForegroundColor Red
            $testsFailed++
        }
        
        if ($config.plugins.updater.pubkey) {
            Write-Host "  ⚠ pubkey trouvé (signature activée)" -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ Pas de pubkey (mode HTTPS)" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✗ Plugin updater non configuré!" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  ✗ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

Write-Host ""

# TEST 2: Accessibilité latest.json
Write-Host "[TEST 2] Accessibilité latest.json GitHub" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor Gray

$latestJsonUrl = "https://github.com/$REPO_OWNER/$REPO_NAME/releases/latest/download/latest.json"
Write-Host "  URL: $latestJsonUrl" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $latestJsonUrl -Method Get -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Fichier accessible" -ForegroundColor Green
        
        try {
            $latestData = $response.Content | ConvertFrom-Json
            Write-Host "  ✓ JSON valide" -ForegroundColor Green
            Write-Host ""
            Write-Host "  Informations:" -ForegroundColor Yellow
            Write-Host "    Version: $($latestData.version)" -ForegroundColor White
            Write-Host "    Date: $($latestData.pub_date)" -ForegroundColor White
            Write-Host "    URL: $($latestData.platforms.'windows-x86_64'.url)" -ForegroundColor White
            Write-Host ""
            $testsPassed++
        } catch {
            Write-Host "  ✗ JSON invalide: $($_.Exception.Message)" -ForegroundColor Red
            $testsFailed++
        }
    } else {
        Write-Host "  ✗ HTTP $($response.StatusCode)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  ✗ Fichier inaccessible" -ForegroundColor Red
    Write-Host "  Causes possibles:" -ForegroundColor Yellow
    Write-Host "    - Aucune release publiée" -ForegroundColor White
    Write-Host "    - latest.json non uploadé" -ForegroundColor White
    Write-Host "    - Problème de connexion" -ForegroundColor White
    Write-Host ""
    $testsFailed++
}

Write-Host ""

# TEST 3: latest.json local
Write-Host "[TEST 3] latest.json local" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor Gray

if (Test-Path "latest.json") {
    try {
        $localJson = Get-Content "latest.json" -Raw | ConvertFrom-Json
        Write-Host "  ✓ Fichier trouvé" -ForegroundColor Green
        
        if ($localJson.version -and $localJson.pub_date -and $localJson.platforms) {
            Write-Host "  ✓ Champs requis présents" -ForegroundColor Green
            
            if ($localJson.platforms.'windows-x86_64'.url) {
                Write-Host "  ✓ URL de téléchargement OK" -ForegroundColor Green
                $testsPassed++
            } else {
                Write-Host "  ✗ URL manquante" -ForegroundColor Red
                $testsFailed++
            }
        } else {
            Write-Host "  ✗ Champs manquants" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "  ✗ Erreur de parsing" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "  ⚠ Fichier non trouvé" -ForegroundColor Yellow
    Write-Host "    Lancez: .\generate-latest-json.ps1 -Version $Version" -ForegroundColor White
}

Write-Host ""

# TEST 4: Dépendances Rust
Write-Host "[TEST 4] Dépendances Cargo.toml" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor Gray

if (Test-Path "src-tauri/Cargo.toml") {
    $cargo = Get-Content "src-tauri/Cargo.toml" -Raw
    
    if ($cargo -match 'tauri-plugin-updater') {
        Write-Host "  ✓ tauri-plugin-updater présent" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  ✗ tauri-plugin-updater manquant!" -ForegroundColor Red
        $testsFailed++
    }
    
    if ($cargo -match 'tauri-plugin-process') {
        Write-Host "  ✓ tauri-plugin-process présent" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ tauri-plugin-process manquant" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ Cargo.toml non trouvé!" -ForegroundColor Red
    $testsFailed++
}

Write-Host ""

# TEST 5: Initialisation plugin
Write-Host "[TEST 5] Initialisation lib.rs" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor Gray

if (Test-Path "src-tauri/src/lib.rs") {
    $lib = Get-Content "src-tauri/src/lib.rs" -Raw
    
    if ($lib -match 'tauri_plugin_updater') {
        Write-Host "  ✓ Plugin updater initialisé" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  ✗ Plugin updater non initialisé!" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "  ✗ lib.rs non trouvé!" -ForegroundColor Red
    $testsFailed++
}

Write-Host ""

# RÉSUMÉ
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tests réussis: $testsPassed" -ForegroundColor Green
Write-Host "Tests échoués: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ Système correctement configuré!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Build: npm run tauri:build" -ForegroundColor White
    Write-Host "  2. Release: .\release.bat" -ForegroundColor White
    Write-Host "  3. Testez avec version antérieure" -ForegroundColor White
} else {
    Write-Host "⚠ Des problèmes détectés!" -ForegroundColor Yellow
    Write-Host "  Voir: GUIDE_TEST_AUTOUPDATE.md" -ForegroundColor White
}

Write-Host ""
