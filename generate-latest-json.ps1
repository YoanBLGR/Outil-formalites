# Script PowerShell pour générer latest.json après un build (version simplifiée sans signature)
param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Génération de latest.json" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Chemins
$exePath = "src-tauri\target\release\bundle\nsis\Formalyse_${Version}_x64-setup.exe"
$outputPath = "latest.json"

# Vérifier que l'exe existe
if (-not (Test-Path $exePath)) {
    Write-Host "[ERREUR] Fichier non trouvé: $exePath" -ForegroundColor Red
    Write-Host "Lancez d'abord: npm run tauri:build" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Installateur trouvé: $exePath" -ForegroundColor Green
Write-Host ""

# URL de téléchargement GitHub
$downloadUrl = "https://github.com/yoyoboul/formalyse/releases/download/v${Version}/Formalyse_${Version}_x64-setup.exe"

# Date actuelle en format ISO 8601
$pubDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Créer le fichier latest.json SANS signature (sécurisé par HTTPS)
$latestJson = @{
    version = $Version
    notes = "Mise à jour vers la version $Version"
    pub_date = $pubDate
    platforms = @{
        "windows-x86_64" = @{
            url = $downloadUrl
        }
    }
} | ConvertTo-Json -Depth 10

# Sauvegarder sans BOM (compatible PowerShell 5.1 et 7+)
if ($PSVersionTable.PSVersion.Major -ge 6) {
    $latestJson | Out-File -FilePath $outputPath -Encoding utf8NoBOM
} else {
    # PowerShell 5.1 : Utiliser UTF8 sans BOM manuellement
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Join-Path $PWD $outputPath), $latestJson, $utf8NoBom)
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "   latest.json généré avec succès!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Fichier créé: $outputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Contenu:" -ForegroundColor Yellow
Get-Content $outputPath | Write-Host
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Créez une release sur GitHub: https://github.com/yoyoboul/formalyse/releases" -ForegroundColor White
Write-Host "2. Uploadez:" -ForegroundColor White
Write-Host "   - Formalyse_${Version}_x64-setup.exe" -ForegroundColor Gray
Write-Host "   - latest.json" -ForegroundColor Gray
Write-Host ""
Write-Host "URL de téléchargement: $downloadUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Le système est sécurisé par HTTPS (pas de signature cryptographique requise)" -ForegroundColor Gray

