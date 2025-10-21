@echo off
echo ========================================
echo    Generation cle Minisign (pur)
echo ========================================
echo.
echo Cette commande va generer une cle MINISIGN pure
echo compatible avec Tauri
echo.
pause

REM Sauvegarder l'ancienne cle
if exist .tauri-updater-key (
    copy .tauri-updater-key .tauri-updater-key.old
)

REM Generer avec minisign
echo Entrez un mot de passe quand demande:
minisign -G -f -s .tauri-updater-key -p .tauri-updater-key.pub

if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Generation echouee !
    pause
    exit /b 1
)

echo.
echo [OK] Cle generee avec succes !
echo.

REM Copier dans le clipboard
powershell -Command "Get-Content .tauri-updater-key | Set-Clipboard"
echo [OK] Cle privee copiee dans le clipboard !
echo.
echo Maintenant:
echo 1. Mettez a jour le secret GitHub TAURI_PRIVATE_KEY
echo 2. Testez avec: .\test-signature-local.bat
echo.
pause

