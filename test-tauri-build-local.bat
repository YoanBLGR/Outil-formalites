@echo off
echo ========================================
echo    Test Build Tauri avec Signature
echo ========================================
echo.
echo Ce script va:
echo 1. Builder l'application Tauri
echo 2. Tauri signera automatiquement avec les variables d'environnement
echo 3. Verifier que le fichier .sig est genere
echo.

REM Demander le mot de passe
set /p PASSWORD="Entrez votre mot de passe de cle: "

echo.
echo Configuration des variables d'environnement...

REM Lire le contenu du fichier de cle
set KEY_FILE=.tauri-updater-key
if not exist %KEY_FILE% (
    echo [ERREUR] Fichier %KEY_FILE% introuvable !
    echo.
    echo Executez d'abord: .\generate-minisign-key.bat
    pause
    exit /b 1
)

REM Definir les variables d'environnement (noms corrects pour Tauri)
set TAURI_SIGNING_PRIVATE_KEY=%KEY_FILE%
set TAURI_SIGNING_PRIVATE_KEY_PASSWORD=%PASSWORD%

echo.
echo ========================================
echo Lancement du build...
echo ========================================
echo.

REM Builder avec Tauri
call npm run tauri:build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] Build echoue !
    pause
    exit /b 1
)

echo.
echo ========================================
echo Verification de la signature...
echo ========================================
echo.

REM Chercher le fichier .exe le plus recent
for /f "delims=" %%F in ('dir /b /od src-tauri\target\release\bundle\nsis\Formalyse_*.exe 2^>nul') do set "LATEST_EXE=%%F"

if not defined LATEST_EXE (
    echo [ERREUR] Aucun fichier .exe trouve !
    pause
    exit /b 1
)

set EXE_PATH=src-tauri\target\release\bundle\nsis\%LATEST_EXE%
set SIG_PATH=%EXE_PATH%.sig

echo Installateur: %EXE_PATH%
echo Signature: %SIG_PATH%
echo.

if exist %SIG_PATH% (
    echo.
    echo ========================================
    echo [SUCCES] Signature generee automatiquement !
    echo ========================================
    echo.
    echo Fichier .sig trouve: %SIG_PATH%
    echo.
    echo Contenu de la signature:
    type %SIG_PATH%
    echo.
    echo.
    echo ========================================
    echo TOUT FONCTIONNE !
    echo ========================================
    echo.
    echo La cle et le processus de signature sont OK.
    echo Vous pouvez maintenant pusher sur GitHub.
    echo.
) else (
    echo.
    echo ========================================
    echo [ECHEC] Fichier .sig non genere !
    echo ========================================
    echo.
    echo Causes possibles:
    echo 1. Les variables d'environnement ne sont pas correctement definies
    echo 2. Le format de la cle est incorrect
    echo 3. Le mot de passe est incorrect
    echo.
    echo Verifiez que vous avez utilise generate-minisign-key.bat
    echo pour generer la cle au format minisign.
    echo.
)

pause

