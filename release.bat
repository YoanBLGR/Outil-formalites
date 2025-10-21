@echo off
echo ========================================
echo    Formalyse - Nouveau Release
echo ========================================
echo.

REM Demander la nouvelle version
set /p VERSION="Nouvelle version (ex: 1.0.1): "

if "%VERSION%"=="" (
    echo [ERREUR] Version requise !
    pause
    exit /b 1
)

echo.
echo [INFO] Mise a jour de la version vers %VERSION%...
echo.

REM Mettre à jour package.json (nécessite jq ou npm version)
call npm version %VERSION% --no-git-tag-version

REM Mettre à jour tauri.conf.json (PowerShell)
powershell -Command "(Get-Content src-tauri\tauri.conf.json) -replace '\"version\": \".*\"', '\"version\": \"%VERSION%\"' | Set-Content src-tauri\tauri.conf.json"

echo [OK] Version mise a jour dans package.json et tauri.conf.json
echo.

REM Build de production
echo [INFO] Lancement du build de production...
echo.
call npm run tauri:build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo    BUILD REUSSI !
    echo ========================================
    echo.
    echo Version: %VERSION%
    echo Fichier: src-tauri\target\release\bundle\nsis\Formalyse_%VERSION%_x64-setup.exe
    echo.
    
    REM Git commit et tag
    choice /C ON /M "Voulez-vous commit et push sur GitHub"
    if errorlevel 2 (
        echo.
        echo [INFO] Commit et tag...
        git add package.json src-tauri/tauri.conf.json
        git commit -m "chore: bump version to %VERSION%"
        git tag v%VERSION%
        
        echo.
        choice /C ON /M "Push vers GitHub"
        if errorlevel 2 (
            git push origin main
            git push origin v%VERSION%
            echo.
            echo [OK] Pousse sur GitHub !
            echo.
            echo Prochaine etape :
            echo 1. Allez sur https://github.com/yoyoboul/formalyse/releases
            echo 2. Creez une release pour v%VERSION%
            echo 3. Uploadez l'installateur
        )
    )
    
    echo.
    choice /C ON /M "Ouvrir le dossier des builds"
    if errorlevel 2 (
        start "" "src-tauri\target\release\bundle\nsis"
    )
) else (
    echo.
    echo [ERREUR] Le build a echoue !
)

pause

