# Script pour signer un build Tauri et generer latest.json avec signature
# Usage: .\sign-and-generate-json.ps1 -Version "2.0.2"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SIGNATURE DU BUILD ET LATEST.JSON" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$REPO_OWNER = "YoanBLGR"
$REPO_NAME = "Outil-formalites"

# Chemin vers le fichier a signer
$exePath = "src-tauri\target\release\bundle\nsis\Formalyse_${Version}_x64-setup.exe"

# Verifier que le fichier existe
if (-not (Test-Path $exePath)) {
    Write-Host "[X] Fichier introuvable: $exePath" -ForegroundColor Red
    Write-Host "Lancez d'abord: npm run tauri:build" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Installateur trouve: $exePath" -ForegroundColor Green
Write-Host ""

# Signer le fichier avec Tauri Signer
Write-Host "[1/3] Signature du fichier..." -ForegroundColor Cyan

try {
    # Chemin vers la cle privee (generee par npm run tauri signer generate)
    $privateKeyPath = "$env:USERPROFILE\.tauri\formalyse.key"
    
    if (-not (Test-Path $privateKeyPath)) {
        Write-Host "[X] Cle privee introuvable: $privateKeyPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Generez d'abord la cle avec:" -ForegroundColor Yellow
        Write-Host "  npm run tauri signer generate" -ForegroundColor White
        Write-Host ""
        Write-Host "Ou specifiez le chemin de la cle privee manuellement." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "[OK] Cle privee trouvee: $privateKeyPath" -ForegroundColor Green
    
    # Signer le fichier
    $signatureOutput = npx @tauri-apps/cli signer sign -f $privateKeyPath $exePath 2>&1 | Out-String
    
    # Extraire la signature (la derniere ligne du output qui contient la signature)
    $signature = ($signatureOutput -split "`n" | Where-Object { $_ -match "^dW50cnVzdGVkIGNvbW1lbnQ6" } | Select-Object -Last 1).Trim()
    
    if (-not $signature) {
        Write-Host "[X] Impossible d'extraire la signature" -ForegroundColor Red
        Write-Host "Output:" -ForegroundColor Yellow
        Write-Host $signatureOutput
        exit 1
    }
    
    Write-Host "[OK] Signature generee" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[X] Erreur lors de la signature: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Generer latest.json
Write-Host "[2/3] Generation de latest.json..." -ForegroundColor Cyan

$downloadUrl = "https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/v${Version}/Formalyse_${Version}_x64-setup.exe"
$pubDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$latestJson = @{
    version = $Version
    notes = "Mise a jour vers la version $Version"
    pub_date = $pubDate
    platforms = @{
        "windows-x86_64" = @{
            signature = $signature
            url = $downloadUrl
        }
    }
} | ConvertTo-Json -Depth 10

# Sauvegarder latest.json sans BOM
if ($PSVersionTable.PSVersion.Major -ge 6) {
    $latestJson | Out-File -FilePath "latest.json" -Encoding utf8NoBOM
} else {
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Join-Path $PWD "latest.json"), $latestJson, $utf8NoBom)
}

Write-Host "[OK] latest.json cree" -ForegroundColor Green
Write-Host ""

# Afficher le resultat
Write-Host "[3/3] Resume" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichier signe:" -ForegroundColor Yellow
Write-Host "  $exePath" -ForegroundColor White
Write-Host ""
Write-Host "Signature:" -ForegroundColor Yellow
Write-Host "  $($signature.Substring(0, 50))..." -ForegroundColor White
Write-Host ""
Write-Host "latest.json:" -ForegroundColor Yellow
$latestJson | Write-Host
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "   SUCCES !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. Publiez la release v$Version sur GitHub" -ForegroundColor White
Write-Host "  2. Uploadez ces 2 fichiers:" -ForegroundColor White
Write-Host "     - Formalyse_${Version}_x64-setup.exe" -ForegroundColor Gray
Write-Host "     - latest.json" -ForegroundColor Gray
Write-Host ""
