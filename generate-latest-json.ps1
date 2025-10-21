# Script PowerShell pour générer latest.json après un build
param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$true)]
    [string]$KeyPassword
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Génération de latest.json" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Chemins
$exePath = "src-tauri\target\release\bundle\nsis\Formalyse_${Version}_x64-setup.exe"
$keyPath = ".tauri-updater-key"
$outputPath = "latest.json"

# Vérifier que l'exe existe
if (-not (Test-Path $exePath)) {
    Write-Host "[ERREUR] Fichier non trouvé: $exePath" -ForegroundColor Red
    Write-Host "Lancez d'abord: npm run tauri:build" -ForegroundColor Yellow
    exit 1
}

# Vérifier que la clé existe
if (-not (Test-Path $keyPath)) {
    Write-Host "[ERREUR] Clé de signature non trouvée: $keyPath" -ForegroundColor Red
    Write-Host "Lancez d'abord: setup-autoupdate.bat" -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] Signature de l'installateur en cours..." -ForegroundColor Yellow
Write-Host ""

# Signer l'installateur
try {
    $signatureOutput = npx --yes @tauri-apps/cli signer sign `
        "$exePath" `
        --private-key "$keyPath" `
        --password "$KeyPassword" 2>&1 | Out-String

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Échec de la signature! Code de sortie: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Sortie:" -ForegroundColor Yellow
        Write-Host $signatureOutput
        exit 1
    }
    
    Write-Host "Sortie de la signature:" -ForegroundColor Gray
    Write-Host $signatureOutput
}
catch {
    Write-Host "[ERREUR] Exception lors de la signature: $_" -ForegroundColor Red
    exit 1
}

# Extraire la signature (dernière ligne non vide)
$signature = ($signatureOutput -split "`n" | Where-Object { $_.Trim() -ne "" })[-1].Trim()

# Vérifier que la signature n'est pas vide
if ([string]::IsNullOrWhiteSpace($signature)) {
    Write-Host "[ERREUR] Signature vide ou invalide!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Signature générée!" -ForegroundColor Green
Write-Host ""

# URL de téléchargement GitHub
$downloadUrl = "https://github.com/yoyoboul/formalyse/releases/download/v${Version}/Formalyse_${Version}_x64-setup.exe"

# Date actuelle en format ISO 8601
$pubDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Créer le fichier latest.json
$latestJson = @{
    version = $Version
    notes = "Mise à jour vers la version $Version"
    pub_date = $pubDate
    platforms = @{
        "windows-x86_64" = @{
            signature = $signature
            url = $downloadUrl
        }
    }
} | ConvertTo-Json -Depth 10

# Sauvegarder sans BOM
$latestJson | Out-File -FilePath $outputPath -Encoding utf8NoBOM

Write-Host "========================================" -ForegroundColor Green
Write-Host "   latest.json généré avec succès!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Fichier créé: $outputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Créez une release sur GitHub: https://github.com/yoyoboul/formalyse/releases" -ForegroundColor White
Write-Host "2. Uploadez:" -ForegroundColor White
Write-Host "   - Formalyse_${Version}_x64-setup.exe" -ForegroundColor Gray
Write-Host "   - latest.json" -ForegroundColor Gray
Write-Host ""
Write-Host "URL de téléchargement: $downloadUrl" -ForegroundColor Cyan

