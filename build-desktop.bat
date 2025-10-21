@echo off
echo ========================================
echo    Formalyse Desktop - Build
echo ========================================
echo.
echo Creation de l'executable Windows...
echo.
echo ATTENTION : Premiere compilation = 5-15 minutes
echo             Compilations suivantes = 1-3 minutes
echo.

REM Verifier si Rust est installe
where rustc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Rust n'est pas installe !
    echo.
    echo Installez Rust avec :
    echo   winget install --id Rustlang.Rustup
    echo.
    pause
    exit /b 1
)

REM Verifier si node_modules existe
if not exist "node_modules\" (
    echo [INFO] Installation des dependances...
    call npm install
)

echo [INFO] Build en cours...
echo.
call npm run tauri:build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo    BUILD REUSSI !
    echo ========================================
    echo.
    echo Fichiers crees :
    echo   - Installateur : src-tauri\target\release\bundle\nsis\Formalyse_1.0.0_x64-setup.exe
    echo   - MSI         : src-tauri\target\release\bundle\msi\
    echo   - Portable    : src-tauri\target\release\Formalyse.exe
    echo.
    echo Ouvrir le dossier des builds ?
    choice /C ON /M "Voulez-vous ouvrir le dossier"
    if errorlevel 2 (
        start "" "src-tauri\target\release\bundle\nsis"
    )
) else (
    echo.
    echo [ERREUR] Le build a echoue !
    echo Verifiez les logs ci-dessus pour plus d'informations.
)

pause

