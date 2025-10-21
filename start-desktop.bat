@echo off
echo ========================================
echo    Formalyse Desktop - Mode Dev
echo ========================================
echo.
echo Demarrage de l'application desktop...
echo.

REM Verifier si Rust est installe
where rustc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Rust n'est pas installe !
    echo.
    echo Installez Rust avec :
    echo   winget install --id Rustlang.Rustup
    echo.
    echo Ou visitez : https://rustup.rs/
    echo.
    pause
    exit /b 1
)

echo [OK] Rust est installe : 
rustc --version
echo.

REM Verifier si node_modules existe
if not exist "node_modules\" (
    echo [INFO] Installation des dependances...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERREUR] Installation echouee !
        pause
        exit /b 1
    )
)

echo [INFO] Lancement de Tauri...
echo.
call npm run tauri:dev

pause

