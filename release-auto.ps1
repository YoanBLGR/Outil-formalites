# ============================================================
# 🚀 FORMALYSE - Release Complètement Automatique
# ============================================================
# Ce script :
# 1. Build l'application
# 2. Crée la release GitHub
# 3. Upload les fichiers automatiquement
# 4. Publie la release
# ============================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('patch', 'minor', 'major')]
    [string]$VersionType,
    
    [Parameter(Mandatory=$false)]
    [string]$GitHubToken
)

# Arrêter en cas d'erreur
$ErrorActionPreference = "Stop"

# ============================================================
# Configuration
# ============================================================

$REPO_OWNER = "YoanBLGR"
$REPO_NAME = "Outil-formalites"

# ============================================================
# Fonctions utilitaires
# ============================================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Message" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# ============================================================
# Étape 1 : Vérifier le token GitHub
# ============================================================

Write-Step "🔐 Vérification du token GitHub"

if (-not $GitHubToken) {
    $GitHubToken = $env:GITHUB_TOKEN
}

if (-not $GitHubToken) {
    Write-Warning "Aucun token GitHub fourni."
    Write-Info "Vous pouvez :"
    Write-Info "  1. Créer un token sur : https://github.com/settings/tokens"
    Write-Info "  2. Le passer en paramètre : -GitHubToken 'ghp_xxxxx'"
    Write-Info "  3. Ou définir la variable : `$env:GITHUB_TOKEN = 'ghp_xxxxx'"
    Write-Host ""
    
    $useManual = Read-Host "Continuer en mode manuel (upload navigateur) ? (y/n)"
    if ($useManual -ne 'y') {
        exit 1
    }
    $ManualMode = $true
} else {
    Write-Success "Token GitHub détecté"
    $ManualMode = $false
}

# ============================================================
# Étape 2 : Choix de la version
# ============================================================

Write-Step "📌 Choix de la version"

if (-not $VersionType) {
    Write-Host "Quelle version voulez-vous publier ?`n"
    Write-Host "  1. Patch (1.0.3 → 1.0.4)  - Correctifs mineurs"
    Write-Host "  2. Minor (1.0.3 → 1.1.0)  - Nouvelles fonctionnalités"
    Write-Host "  3. Major (1.0.3 → 2.0.0)  - Changements majeurs"
    Write-Host ""
    
    $choice = Read-Host "Votre choix (1/2/3)"
    
    switch ($choice) {
        "1" { $VersionType = "patch" }
        "2" { $VersionType = "minor" }
        "3" { $VersionType = "major" }
        default {
            Write-Error-Custom "Choix invalide !"
            exit 1
        }
    }
}

Write-Success "Type de version : $VersionType"

# ============================================================
# Étape 3 : Incrémenter la version
# ============================================================

Write-Step "🔄 Incrémentation de la version"

npm version $VersionType --no-git-tag-version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Erreur lors de l'incrémentation de version"
    exit 1
}

# Lire la nouvelle version
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$version = $packageJson.version

Write-Success "Nouvelle version : $version"

# ============================================================
# Étape 4 : Build de l'application
# ============================================================

Write-Step "🔨 Build de l'application Tauri"
Write-Info "⏱️  Cela peut prendre 2-3 minutes..."

npm run tauri:build
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Build échoué !"
    exit 1
}

Write-Success "Build terminé avec succès !"

# ============================================================
# Étape 5 : Vérifier les fichiers
# ============================================================

Write-Step "📦 Vérification des fichiers"

$exePath = "src-tauri\target\release\bundle\nsis\Formalyse_${version}_x64-setup.exe"
$msiPath = "src-tauri\target\release\bundle\msi\Formalyse_${version}_x64_en-US.msi"

if (-not (Test-Path $exePath)) {
    Write-Error-Custom "Fichier introuvable : $exePath"
    exit 1
}

Write-Success "Installateur trouvé : $exePath"
if (Test-Path $msiPath) {
    Write-Success "MSI trouvé : $msiPath"
}

# ============================================================
# Étape 6 : Générer latest.json
# ============================================================

Write-Step "📝 Génération de latest.json"

$downloadUrl = "https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/v${version}/Formalyse_${version}_x64-setup.exe"
$pubDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$latestJson = @{
    version = $version
    notes = "Release version $version"
    pub_date = $pubDate
    platforms = @{
        "windows-x86_64" = @{
            url = $downloadUrl
        }
    }
} | ConvertTo-Json -Depth 10

$latestJson | Out-File -FilePath "latest.json" -Encoding utf8NoBOM

Write-Success "latest.json créé !"

# ============================================================
# Étape 7 : Commit et tag Git
# ============================================================

Write-Step "📦 Commit et tag Git"

git add package.json src-tauri/tauri.conf.json
git commit -m "$version"
git tag "v$version"

Write-Success "Commit et tag créés !"

# ============================================================
# Étape 8 : Push sur GitHub
# ============================================================

Write-Step "🌐 Push sur GitHub"

git push origin main
git push origin "v$version"

Write-Success "Poussé sur GitHub !"

# ============================================================
# Étape 9 : Créer la release GitHub
# ============================================================

if ($ManualMode) {
    # Mode manuel
    Write-Step "🎁 Création de la release (manuel)"
    
    Write-Host "`n⚠️  Pour créer la release, vous devez :`n"
    Write-Host "   1. Aller sur : https://github.com/$REPO_OWNER/$REPO_NAME/releases/new"
    Write-Host "   2. Tag : v$version"
    Write-Host "   3. Title : Formalyse v$version"
    Write-Host "   4. Uploader ces fichiers :"
    Write-Host "      - $exePath"
    Write-Host "      - latest.json"
    Write-Host ""
    
    # Ouvrir le navigateur
    Start-Process "https://github.com/$REPO_OWNER/$REPO_NAME/releases/new?tag=v$version&title=Formalyse%20v$version"
    
    # Ouvrir l'explorateur
    Start-Process "explorer.exe" -ArgumentList "/select,`"$exePath`""
    
} else {
    # Mode automatique avec API GitHub
    Write-Step "🎁 Création de la release GitHub (automatique)"
    
    $headers = @{
        "Authorization" = "Bearer $GitHubToken"
        "Accept" = "application/vnd.github+json"
        "X-GitHub-Api-Version" = "2022-11-28"
    }
    
    # Créer la release
    Write-Info "Création de la release..."
    
    $releaseBody = @{
        tag_name = "v$version"
        name = "Formalyse v$version"
        body = "## 🚀 Release v$version`n`nMise à jour vers la version $version.`n`n### 📥 Installation`n`nTéléchargez l'installateur Windows ci-dessous.`n`n### 🔄 Mise à jour automatique`n`nSi vous avez déjà Formalyse installé, l'application détectera automatiquement cette mise à jour."
        draft = $false
        prerelease = $false
    } | ConvertTo-Json
    
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases" `
            -Method POST `
            -Headers $headers `
            -Body $releaseBody `
            -ContentType "application/json"
        
        Write-Success "Release créée : $($release.html_url)"
        
        # Upload des fichiers
        Write-Info "Upload de l'installateur..."
        
        $uploadUrl = $release.upload_url -replace '\{\?name,label\}', ''
        
        # Upload .exe
        $exeBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $exePath))
        $exeName = Split-Path $exePath -Leaf
        
        Invoke-RestMethod -Uri "$uploadUrl?name=$exeName" `
            -Method POST `
            -Headers $headers `
            -Body $exeBytes `
            -ContentType "application/octet-stream" | Out-Null
        
        Write-Success "Installateur uploadé : $exeName"
        
        # Upload latest.json
        Write-Info "Upload de latest.json..."
        
        $jsonBytes = [System.IO.File]::ReadAllBytes((Resolve-Path "latest.json"))
        
        Invoke-RestMethod -Uri "$uploadUrl?name=latest.json" `
            -Method POST `
            -Headers $headers `
            -Body $jsonBytes `
            -ContentType "application/json" | Out-Null
        
        Write-Success "latest.json uploadé"
        
        # Upload .msi si présent
        if (Test-Path $msiPath) {
            Write-Info "Upload du MSI..."
            
            $msiBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $msiPath))
            $msiName = Split-Path $msiPath -Leaf
            
            Invoke-RestMethod -Uri "$uploadUrl?name=$msiName" `
                -Method POST `
                -Headers $headers `
                -Body $msiBytes `
                -ContentType "application/octet-stream" | Out-Null
            
            Write-Success "MSI uploadé : $msiName"
        }
        
    } catch {
        Write-Error-Custom "Erreur lors de la création de la release : $($_.Exception.Message)"
        Write-Warning "Vous pouvez créer la release manuellement sur GitHub"
        exit 1
    }
}

# ============================================================
# Résumé final
# ============================================================

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ Release publiée !                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 Récapitulatif :" -ForegroundColor Cyan
Write-Host "   • Version : $version" -ForegroundColor White
Write-Host "   • Build : ✓" -ForegroundColor Green
Write-Host "   • Git : ✓" -ForegroundColor Green
Write-Host "   • Release GitHub : ✓" -ForegroundColor Green
if (-not $ManualMode) {
    Write-Host "   • Upload automatique : ✓" -ForegroundColor Green
}
Write-Host ""
Write-Host "🌐 Voir la release : https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/v$version" -ForegroundColor Blue
Write-Host ""
Write-Host "🎯 Les utilisateurs vont recevoir la notification de mise à jour automatiquement !" -ForegroundColor Yellow
Write-Host ""

