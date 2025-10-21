@echo off
echo ========================================
echo    Test de signature en local
echo ========================================
echo.

REM Demander le mot de passe
set /p PASSWORD="Entrez votre mot de passe de cle: "

REM Trouver le fichier .exe le plus recent
set EXE_PATH=src-tauri\target\release\bundle\nsis\Formalyse_*.exe

REM Verifier que le fichier existe
if not exist %EXE_PATH% (
    echo [ERREUR] Aucun installateur trouve !
    echo.
    echo Lancez d'abord: npm run tauri:build
    pause
    exit /b 1
)

echo.
echo Test de signature avec:
echo - Fichier: %EXE_PATH%
echo - Cle: .tauri-updater-key
echo.

REM Tester la signature
npx --yes @tauri-apps/cli signer sign %EXE_PATH% --private-key .tauri-updater-key --password %PASSWORD%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCES] Signature reussie !
    echo ========================================
    echo.
    echo La cle fonctionne correctement.
    echo Vous pouvez maintenant:
    echo 1. Copier la cle dans le secret GitHub
    echo 2. Pousser un tag pour declencher le workflow
    echo.
) else (
    echo.
    echo ========================================
    echo [ECHEC] Erreur de signature !
    echo ========================================
    echo.
    echo Causes possibles:
    echo 1. Mot de passe incorrect
    echo 2. Fichier .tauri-updater-key corrompu ou invalide
    echo 3. Format de cle incorrect (rsign au lieu de minisign)
    echo.
    echo Solution: Executez regenerate-tauri-key.bat
    echo.
)

pause

