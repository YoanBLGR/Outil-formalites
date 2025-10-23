param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$true)]
    [string]$GithubToken,
    
    [string]$Owner = "YoanBLGR",
    [string]$Repo = "Outil-formalites"
)

$ErrorActionPreference = "Stop"

# Configuration
$exePath = "src-tauri\target\release\bundle\nsis\Formalyse_${Version}_x64-setup.exe"
$msiPath = "src-tauri\target\release\bundle\msi\Formalyse_${Version}_x64_en-US.msi"
$latestJsonPath = "latest.json"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Creation de la Release GitHub v$Version" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Verifier que les fichiers existent
Write-Host "Verification des fichiers..." -ForegroundColor Yellow
$filesToUpload = @()

if (Test-Path $exePath) {
    Write-Host "  [OK] Installateur NSIS trouve" -ForegroundColor Green
    $filesToUpload += @{Path=$exePath; Name=(Split-Path $exePath -Leaf); ContentType="application/octet-stream"}
} else {
    Write-Host "  [ERREUR] Installateur NSIS introuvable: $exePath" -ForegroundColor Red
    exit 1
}

if (Test-Path $latestJsonPath) {
    Write-Host "  [OK] latest.json trouve" -ForegroundColor Green
    $filesToUpload += @{Path=$latestJsonPath; Name="latest.json"; ContentType="application/json"}
} else {
    Write-Host "  [ERREUR] latest.json introuvable" -ForegroundColor Red
    exit 1
}

if (Test-Path $msiPath) {
    Write-Host "  [OK] Installateur MSI trouve" -ForegroundColor Green
    $filesToUpload += @{Path=$msiPath; Name=(Split-Path $msiPath -Leaf); ContentType="application/octet-stream"}
} else {
    Write-Host "  [ATTENTION] Installateur MSI introuvable (optionnel)" -ForegroundColor Yellow
}

Write-Host ""

# Headers pour l'API GitHub
$headers = @{
    'Authorization' = "Bearer $GithubToken"
    'Accept' = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}

# Verifier si la release existe deja
Write-Host "Verification de l'existence de la release..." -ForegroundColor Yellow
try {
    $existingRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/releases/tags/v$Version" -Headers $headers -ErrorAction SilentlyContinue
    
    if ($existingRelease) {
        Write-Host "  [ATTENTION] La release v$Version existe deja" -ForegroundColor Yellow
        Write-Host "  Suppression de l'ancienne release..." -ForegroundColor Yellow
        
        Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/releases/$($existingRelease.id)" -Method DELETE -Headers $headers | Out-Null
        Write-Host "  [OK] Ancienne release supprimee" -ForegroundColor Green
    }
} catch {
    # La release n'existe pas, c'est normal
    Write-Host "  [OK] Aucune release existante (OK)" -ForegroundColor Green
}

Write-Host ""

# Creer la release
Write-Host "Creation de la release GitHub..." -ForegroundColor Cyan

# Generer le changelog
$releaseNotes = @"
## Release v$Version

### Installation

Telechargez l'installateur Windows ci-dessous :
- **Recommande** : ``Formalyse_${Version}_x64-setup.exe`` (Installateur NSIS)
- **Alternatif** : ``Formalyse_${Version}_x64_en-US.msi`` (Installateur MSI)

### Mise a jour automatique

Si vous avez deja Formalyse installe, l'application detectera automatiquement cette mise a jour au prochain demarrage.

### Nouveautes

Pour voir les details complets des nouveautes, consultez le [CHANGELOG](https://github.com/$Owner/$Repo/blob/main/CHANGELOG_V3.md).
"@

$releaseBody = @{
    tag_name = "v$Version"
    name = "Formalyse v$Version"
    body = $releaseNotes
    draft = $false
    prerelease = $false
} | ConvertTo-Json -Depth 10

try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/releases" -Method POST -Headers $headers -Body $releaseBody -ContentType 'application/json'
    Write-Host "  [OK] Release creee avec succes !" -ForegroundColor Green
    Write-Host "  URL: $($release.html_url)" -ForegroundColor Blue
    Write-Host ""
} catch {
    Write-Host "  [ERREUR] Erreur lors de la creation de la release" -ForegroundColor Red
    Write-Host "  Details: $($_.Exception.Message)" -ForegroundColor Red
    
    # Afficher plus de details si disponible
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "  Message: $($errorDetails.message)" -ForegroundColor Red
    }
    
    exit 1
}

# Upload des assets
# L'URL d'upload contient {?name,label} qu'il faut enlever
$uploadUrl = $release.upload_url
if ($uploadUrl -match '(.+)\{') {
    $uploadUrl = $matches[1]
}

Write-Host "Upload des fichiers..." -ForegroundColor Cyan
Write-Host "URL de base: $uploadUrl" -ForegroundColor Gray
Write-Host ""

$uploadedCount = 0
foreach ($file in $filesToUpload) {
    $fileName = $file.Name
    $filePath = $file.Path
    $contentType = $file.ContentType
    
    Write-Host "  Upload de $fileName..." -ForegroundColor Yellow
    
    try {
        # Lire le fichier en bytes
        $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $filePath))
        $fileSize = [math]::Round($fileBytes.Length / 1MB, 2)
        
        Write-Host "    Taille: $fileSize MB" -ForegroundColor Gray
        
        # Construire l'URL complète avec le nom du fichier
        $fullUploadUrl = $uploadUrl + "?name=" + $fileName
        
        Write-Host "    URL: $fullUploadUrl" -ForegroundColor Gray
        
        # Upload
        $uploadResponse = Invoke-RestMethod `
            -Uri $fullUploadUrl `
            -Method POST `
            -Headers $headers `
            -Body $fileBytes `
            -ContentType $contentType
        
        Write-Host "    [OK] $fileName uploade avec succes !" -ForegroundColor Green
        $uploadedCount++
    } catch {
        Write-Host "    [ERREUR] Erreur lors de l'upload de $fileName" -ForegroundColor Red
        Write-Host "    Details: $($_.Exception.Message)" -ForegroundColor Red
        
        # Afficher plus de détails pour le débogage
        if ($_.Exception.Response) {
            Write-Host "    Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
        
        # Continuer avec les autres fichiers meme en cas d'erreur
    }
    
    Write-Host ""
}

# Resume
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Release Completee !" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resume:" -ForegroundColor Cyan
Write-Host "  Version : v$Version" -ForegroundColor White
Write-Host "  Fichiers uploades : $uploadedCount/$($filesToUpload.Count)" -ForegroundColor White
Write-Host "  URL : $($release.html_url)" -ForegroundColor White
Write-Host ""
Write-Host "Les utilisateurs peuvent maintenant telecharger la nouvelle version !" -ForegroundColor Green
Write-Host ""

# Ouvrir la release dans le navigateur
$openBrowser = Read-Host "Ouvrir la release dans le navigateur ? (y/n)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process $release.html_url
    Write-Host "[OK] Navigateur ouvert !" -ForegroundColor Green
}

exit 0
