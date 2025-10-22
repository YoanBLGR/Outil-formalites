@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════════
echo          🚀 FORMALYSE - Release Automatique Locale            
echo ════════════════════════════════════════════════════════════════
echo.

REM ============================================================
REM Configuration
REM ============================================================

set REPO_OWNER=yoyoboul
set REPO_NAME=formalyse

REM ============================================================
REM Étape 0 : Vérifier le token GitHub
REM ============================================================

echo 🔐 Vérification du token GitHub...
echo.

REM Vérifier si le token est défini
if defined GITHUB_TOKEN (
    echo ✅ Token GitHub trouvé dans les variables d'environnement
    echo.
    set AUTO_UPLOAD=yes
    goto :token_configured
)

REM Pas de token trouvé
echo ⚠️  Aucun token GitHub trouvé
echo.
echo Pour l'upload automatique, vous avez besoin d'un token GitHub.
echo.
echo 📝 Comment obtenir un token :
echo    1. Allez sur : https://github.com/settings/tokens/new
echo    2. Permissions : repo + write:packages
echo    3. Copiez le token (ghp_...)
echo.
set /p hasToken="Avez-vous un token GitHub ? (y/n) : "

if /i "%hasToken%"=="y" (
    set /p GITHUB_TOKEN="Entrez votre token : "
    if defined GITHUB_TOKEN (
        set AUTO_UPLOAD=yes
        echo.
        echo ✅ Token enregistré pour cette session
    ) else (
        set AUTO_UPLOAD=no
        echo.
        echo ⚠️  Token vide - Mode manuel activé
    )
) else (
    set AUTO_UPLOAD=no
    echo.
    echo ℹ️  Mode manuel activé - vous devrez uploader les fichiers manuellement
)

:token_configured
echo.

REM ============================================================
REM Étape 1 : Choix de la version
REM ============================================================

echo 📌 Quelle version voulez-vous publier ?
echo.
echo    1. Patch (1.0.4 ^=^> 1.0.5)  - Correctifs mineurs
echo    2. Minor (1.0.4 ^=^> 1.1.0)  - Nouvelles fonctionnalités
echo    3. Major (1.0.4 ^=^> 2.0.0)  - Changements majeurs
echo    4. Manuelle                  - Saisir manuellement (ex: 2.1.3)
echo.
set /p choice="Votre choix (1/2/3/4) : "

if "%choice%"=="1" set versionType=patch
if "%choice%"=="2" set versionType=minor
if "%choice%"=="3" set versionType=major
if "%choice%"=="4" set versionType=manual

if not defined versionType (
    echo ❌ Choix invalide !
    pause
    exit /b 1
)

echo.
echo ✅ Type de version : %versionType%
echo.

REM ============================================================
REM Étape 2 : Incrémenter la version
REM ============================================================

if "%versionType%"=="manual" (
    echo.
    echo 📝 Saisie manuelle de la version
    echo.
    REM Afficher la version actuelle
    for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content package.json | ConvertFrom-Json).version"') do set currentVersion=%%i
    echo Version actuelle : %currentVersion%
    echo.
    set /p version="Entrez la nouvelle version (ex: 2.1.3) : "
    
    if not defined version (
        echo ❌ Version vide !
        pause
        exit /b 1
    )
    
    echo.
    echo 🔄 Mise à jour vers la version %version%...
    
    REM Mettre à jour package.json avec la version manuelle
    powershell -NoProfile -Command "$pkg = Get-Content 'package.json' | ConvertFrom-Json; $pkg.version = '%version%'; $pkg | ConvertTo-Json -Depth 100 | Set-Content 'package.json'"
    if errorlevel 1 (
        echo ❌ Erreur lors de la mise à jour de package.json
        pause
        exit /b 1
    )
    
    echo ✅ package.json mis à jour : %version%
    
) else (
    echo 🔄 Incrémentation de la version...
    
    call npm version %versionType% --no-git-tag-version
    if errorlevel 1 (
        echo ❌ Erreur lors de l'incrémentation de version
        pause
        exit /b 1
    )
    
    REM Lire la nouvelle version
    for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content package.json | ConvertFrom-Json).version"') do set version=%%i
    
    if not defined version (
        echo ❌ Impossible de lire la version
        pause
        exit /b 1
    )
    
    echo ✅ package.json mis à jour : %version%
)

REM Mettre à jour tauri.conf.json (commun aux deux modes)
powershell -NoProfile -Command "$config = Get-Content 'src-tauri/tauri.conf.json' -Raw | ConvertFrom-Json; $config.version = '%version%'; $config | ConvertTo-Json -Depth 100 | Set-Content 'src-tauri/tauri.conf.json'"
if errorlevel 1 (
    echo ❌ Erreur lors de la mise à jour de tauri.conf.json
    pause
    exit /b 1
)

echo ✅ tauri.conf.json mis à jour : %version%
echo.

REM ============================================================
REM Étape 3 : Build de l'application
REM ============================================================

echo 🔨 Build de l'application Tauri v%version%...
echo    ⏱️  Cela peut prendre 2-3 minutes...
echo.

call npm run tauri:build
if errorlevel 1 (
    echo.
    echo ❌ Build échoué !
    pause
    exit /b 1
)

echo.
echo ✅ Build terminé avec succès !
echo.

REM ============================================================
REM Étape 4 : Vérifier les fichiers
REM ============================================================

echo 📦 Vérification des fichiers...

set "exePath=src-tauri\target\release\bundle\nsis\Formalyse_%version%_x64-setup.exe"
set "msiPath=src-tauri\target\release\bundle\msi\Formalyse_%version%_x64_en-US.msi"

if not exist "%exePath%" (
    echo ❌ Fichier introuvable : %exePath%
    pause
    exit /b 1
)

echo ✅ Installateur : %exePath%
if exist "%msiPath%" (
    echo ✅ MSI : %msiPath%
)
echo.

REM ============================================================
REM Étape 5 : Générer latest.json
REM ============================================================

echo 📝 Génération de latest.json...

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0generate-latest-json.ps1" -Version "%version%"
if errorlevel 1 (
    echo ❌ Erreur lors de la génération de latest.json
    pause
    exit /b 1
)

echo ✅ latest.json créé !
echo.

REM ============================================================
REM Étape 6 : Commit et tag Git
REM ============================================================

echo 📦 Commit et tag Git...

git add package.json package-lock.json src-tauri\tauri.conf.json src-tauri\Cargo.toml src-tauri\Cargo.lock
git commit -m "%version%"
if errorlevel 1 (
    echo ⚠️  Aucun changement à committer
)

git tag v%version% 2>nul
if errorlevel 1 (
    echo ⚠️  Tag existe déjà, écrasement...
    git tag -d v%version%
    git tag v%version%
)

echo ✅ Commit et tag créés !
echo.

REM ============================================================
REM Étape 7 : Push sur GitHub
REM ============================================================

echo 🌐 Push sur GitHub...

git push origin main
git push origin v%version% 2>nul
if errorlevel 1 (
    git push --force origin v%version%
)

echo ✅ Poussé sur GitHub !
echo.

REM ============================================================
REM Étape 8 : Créer la release GitHub (Auto ou Manuel)
REM ============================================================

if "%AUTO_UPLOAD%"=="yes" (
    echo 🎁 Création de la release GitHub automatique...
    echo.
    
    REM Appeler le script PowerShell pour créer la release
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$token = '%GITHUB_TOKEN%'; ^
    $version = '%version%'; ^
    $exePath = '%exePath%'; ^
    $msiPath = '%msiPath%'; ^
    $owner = '%REPO_OWNER%'; ^
    $repo = '%REPO_NAME%'; ^
    ^
    $headers = @{ ^
        'Authorization' = \"Bearer $token\"; ^
        'Accept' = 'application/vnd.github+json'; ^
        'X-GitHub-Api-Version' = '2022-11-28' ^
    }; ^
    ^
    Write-Host 'Création de la release...' -ForegroundColor Cyan; ^
    $releaseBody = @{ ^
        tag_name = \"v$version\"; ^
        name = \"Formalyse v$version\"; ^
        body = \"## 🚀 Release v$version`n`nMise à jour vers la version $version.`n`n### 📥 Installation`n`nTéléchargez l'installateur Windows ci-dessous.`n`n### 🔄 Mise à jour automatique`n`nSi vous avez déjà Formalyse installé, l'application détectera automatiquement cette mise à jour.\"; ^
        draft = $false; ^
        prerelease = $false ^
    } ^| ConvertTo-Json; ^
    ^
    try { ^
        $release = Invoke-RestMethod -Uri \"https://api.github.com/repos/$owner/$repo/releases\" -Method POST -Headers $headers -Body $releaseBody -ContentType 'application/json'; ^
        Write-Host \"✅ Release créée: $($release.html_url)\" -ForegroundColor Green; ^
        ^
        $uploadUrl = $release.upload_url -replace '\{\?name,label\}', ''; ^
        ^
        Write-Host \"`nUpload de l'installateur...\" -ForegroundColor Cyan; ^
        $exeBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $exePath)); ^
        $exeName = Split-Path $exePath -Leaf; ^
        Invoke-RestMethod -Uri \"$uploadUrl?name=$exeName\" -Method POST -Headers $headers -Body $exeBytes -ContentType 'application/octet-stream' ^| Out-Null; ^
        Write-Host \"✅ $exeName uploadé\" -ForegroundColor Green; ^
        ^
        Write-Host \"`nUpload de latest.json...\" -ForegroundColor Cyan; ^
        $jsonBytes = [System.IO.File]::ReadAllBytes((Resolve-Path 'latest.json')); ^
        Invoke-RestMethod -Uri \"$uploadUrl?name=latest.json\" -Method POST -Headers $headers -Body $jsonBytes -ContentType 'application/json' ^| Out-Null; ^
        Write-Host \"✅ latest.json uploadé\" -ForegroundColor Green; ^
        ^
        if (Test-Path $msiPath) { ^
            Write-Host \"`nUpload du MSI...\" -ForegroundColor Cyan; ^
            $msiBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $msiPath)); ^
            $msiName = Split-Path $msiPath -Leaf; ^
            Invoke-RestMethod -Uri \"$uploadUrl?name=$msiName\" -Method POST -Headers $headers -Body $msiBytes -ContentType 'application/octet-stream' ^| Out-Null; ^
            Write-Host \"✅ $msiName uploadé\" -ForegroundColor Green; ^
        }; ^
        ^
        Write-Host \"`n✅ Release complète !\" -ForegroundColor Green; ^
        Write-Host \"🌐 Voir: $($release.html_url)\" -ForegroundColor Blue; ^
        exit 0; ^
    } catch { ^
        Write-Host \"`n❌ Erreur: $($_.Exception.Message)\" -ForegroundColor Red; ^
        Write-Host \"Passez en mode manuel...\" -ForegroundColor Yellow; ^
        exit 1; ^
    }"
    
    if errorlevel 1 (
        echo.
        echo ⚠️  L'upload automatique a échoué
        echo ℹ️  Passage en mode manuel
        set AUTO_UPLOAD=no
    )
)

if "%AUTO_UPLOAD%"=="no" (
    echo.
    echo ════════════════════════════════════════════════════════════════
    echo                  📋 Upload Manuel Requis                      
    echo ════════════════════════════════════════════════════════════════
    echo.
    echo 🌐 Ouvrir la page de release GitHub ? (y/n)
    set /p openBrowser="Votre choix : "
    
    if /i "!openBrowser!"=="y" (
        start https://github.com/%REPO_OWNER%/%REPO_NAME%/releases/new?tag=v%version%^&title=Formalyse%%20v%version%
        echo ✅ Navigateur ouvert !
    )
    
    echo.
    echo 📂 Ouvrir le dossier des fichiers ? (y/n)
    set /p openFolder="Votre choix : "
    
    if /i "!openFolder!"=="y" (
        explorer /select,"%exePath%"
        echo ✅ Explorateur ouvert !
    )
    
    echo.
    echo 📋 Fichiers à uploader :
    echo    1. %exePath%
    echo    2. latest.json
    if exist "%msiPath%" echo    3. %msiPath%
)

REM ============================================================
REM Résumé final
REM ============================================================

echo.
echo ════════════════════════════════════════════════════════════════
echo                    ✅ Release Terminée !                       
echo ════════════════════════════════════════════════════════════════
echo.
echo 📋 Récapitulatif :
echo    • Version : %version%
echo    • Build : ✓
echo    • Git commit : ✓
echo    • Git tag : ✓
echo    • Push GitHub : ✓
if "%AUTO_UPLOAD%"=="yes" (
    echo    • Release GitHub : ✓
    echo    • Upload automatique : ✓
) else (
    echo    • Release GitHub : En attente d'upload manuel
)
echo.
echo 🌐 Release : https://github.com/%REPO_OWNER%/%REPO_NAME%/releases/tag/v%version%
echo.
echo 🎯 Les utilisateurs recevront la notification de mise à jour !
echo.

pause
