param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

$REPO_OWNER = "YoanBLGR"
$REPO_NAME = "Outil-formalites"
$Token = $env:GITHUB_TOKEN

if (-not $Token) {
    Write-Host "ERROR: No GitHub token found" -ForegroundColor Red
    exit 1
}

$exePath = "src-tauri\target\release\bundle\nsis\Formalyse_${Version}_x64-setup.exe"
$msiPath = "src-tauri\target\release\bundle\msi\Formalyse_${Version}_x64_en-US.msi"
$jsonPath = "latest.json"

if (-not (Test-Path $exePath)) {
    Write-Host "ERROR: File not found: $exePath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Creating GitHub release v$Version..." -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

try {
    Write-Host "Step 1: Creating release..." -ForegroundColor Cyan
    
    $releaseBody = "Release version $Version"
    
    $releaseData = @{
        tag_name = "v$Version"
        name = "Formalyse v$Version"
        body = $releaseBody
        draft = $false
        prerelease = $false
    } | ConvertTo-Json
    
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases" -Method POST -Headers $headers -Body $releaseData -ContentType "application/json"
    
    Write-Host "SUCCESS: Release created" -ForegroundColor Green
    Write-Host "URL: $($release.html_url)" -ForegroundColor Blue
    Write-Host ""
    
    $uploadUrl = $release.upload_url -replace '\{\?name,label\}', ''
    
    Write-Host "Step 2: Uploading installer..." -ForegroundColor Cyan
    $exeBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $exePath))
    $exeName = Split-Path $exePath -Leaf
    Invoke-RestMethod -Uri "$uploadUrl?name=$exeName" -Method POST -Headers $headers -Body $exeBytes -ContentType "application/octet-stream" | Out-Null
    Write-Host "SUCCESS: $exeName uploaded" -ForegroundColor Green
    
    Write-Host "Step 3: Uploading latest.json..." -ForegroundColor Cyan
    $jsonBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $jsonPath))
    Invoke-RestMethod -Uri "$uploadUrl?name=latest.json" -Method POST -Headers $headers -Body $jsonBytes -ContentType "application/json" | Out-Null
    Write-Host "SUCCESS: latest.json uploaded" -ForegroundColor Green
    
    if (Test-Path $msiPath) {
        Write-Host "Step 4: Uploading MSI..." -ForegroundColor Cyan
        $msiBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $msiPath))
        $msiName = Split-Path $msiPath -Leaf
        Invoke-RestMethod -Uri "$uploadUrl?name=$msiName" -Method POST -Headers $headers -Body $msiBytes -ContentType "application/octet-stream" | Out-Null
        Write-Host "SUCCESS: $msiName uploaded" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "   RELEASE PUBLISHED SUCCESSFULLY" -ForegroundColor Green  
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "View release: $($release.html_url)" -ForegroundColor Blue
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

