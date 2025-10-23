# Script pour créer une release GitHub et uploader les fichiers
param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$Token
)

$ErrorActionPreference = "Stop"

# Configuration
$REPO_OWNER = "YoanBLGR"
$REPO_NAME = "Outil-formalites"

# Utiliser le token passé en paramètre ou la variable d'environnement
if (-not $Token) {
    $Token = $env:GITHUB_TOKEN
}

if (-not $Token) {
    Write-Host "❌ Aucun token GitHub trouvé" -ForegroundColor Red
    Write-Host "Usage: .\create-github-release.ps1 -Version '1.0.5' -Token 'ghp_...'" -ForegroundColor Yellow
    exit 1
}

# Chemins des fichiers
$exePath = "src-tauri\target\release\bundle\nsis\Formalyse_${Version}_x64-setup.exe"
$msiPath = "src-tauri\target\release\bundle\msi\Formalyse_${Version}_x64_en-US.msi"
$jsonPath = "latest.json"

# Vérifier que les fichiers existent
if (-not (Test-Path $exePath)) {
    Write-Host "❌ Fichier introuvable: $exePath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $jsonPath)) {
    Write-Host "❌ Fichier introuvable: $jsonPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎁 Création de la release GitHub v$Version" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Headers pour l'API GitHub
$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

try {
    # 1. Créer la release
    Write-Host "📝 Création de la release..." -ForegroundColor Cyan
    
    $bodyText = "## 🚀 Release v$Version`n`nMise à jour vers la version $Version.`n`n### 📥 Installation`n`nTéléchargez l'installateur Windows ci-dessous.`n`n### 🔄 Mise à jour automatique`n`nSi vous avez déjà Formalyse installé, l'application détectera automatiquement cette mise à jour."
    
    $releaseData = @{
        tag_name = "v$Version"
        name = "Formalyse v$Version"
        body = $bodyText
        draft = $false
        prerelease = $false
    }
    
    $releaseJson = $releaseData | ConvertTo-Json
    $apiUrl = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases"
    
    $releaseParams = @{
        Uri = $apiUrl
        Method = 'POST'
        Headers = $headers
        Body = $releaseJson
        ContentType = 'application/json'
    }
    
    $release = Invoke-RestMethod @releaseParams
    
    Write-Host "✅ Release créée: $($release.html_url)" -ForegroundColor Green
    Write-Host ""
    
    $uploadUrl = $release.upload_url -replace '\{\?name,label\}', ''
    
    # 2. Upload de l'installateur .exe
    Write-Host "📤 Upload de l'installateur..." -ForegroundColor Cyan
    $exeBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $exePath))
    $exeName = Split-Path $exePath -Leaf
    
    $uploadParams = @{
        Uri = "$uploadUrl?name=$exeName"
        Method = 'POST'
        Headers = $headers
        Body = $exeBytes
        ContentType = 'application/octet-stream'
    }
    
    Invoke-RestMethod @uploadParams | Out-Null
    
    Write-Host "✅ $exeName uploadé" -ForegroundColor Green
    
    # 3. Upload de latest.json
    Write-Host "📤 Upload de latest.json..." -ForegroundColor Cyan
    $jsonBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $jsonPath))
    
    $jsonUploadParams = @{
        Uri = "$uploadUrl?name=latest.json"
        Method = 'POST'
        Headers = $headers
        Body = $jsonBytes
        ContentType = 'application/json'
    }
    
    Invoke-RestMethod @jsonUploadParams | Out-Null
    
    Write-Host "✅ latest.json uploadé" -ForegroundColor Green
    
    # 4. Upload du MSI si présent
    if (Test-Path $msiPath) {
        Write-Host "📤 Upload du MSI..." -ForegroundColor Cyan
        $msiBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $msiPath))
        $msiName = Split-Path $msiPath -Leaf
        
        $msiUploadParams = @{
            Uri = "$uploadUrl?name=$msiName"
            Method = 'POST'
            Headers = $headers
            Body = $msiBytes
            ContentType = 'application/octet-stream'
        }
        
        Invoke-RestMethod @msiUploadParams | Out-Null
        
        Write-Host "✅ $msiName uploadé" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "                    ✅ Release publiée !                        " -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Voir la release : $($release.html_url)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "🎯 Les utilisateurs vont recevoir la notification de mise à jour !" -ForegroundColor Yellow
    Write-Host ""
    
}
catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de la création de la release" -ForegroundColor Red
    Write-Host "Détails : $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Réponse API : $responseBody" -ForegroundColor Yellow
        }
        catch {
            Write-Host "Impossible de lire la réponse de l'API" -ForegroundColor Yellow
        }
    }
    
    exit 1
}
