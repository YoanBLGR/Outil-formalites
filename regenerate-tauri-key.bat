@echo off
echo ========================================
echo    Regeneration de la cle Tauri
echo ========================================
echo.
echo ATTENTION: Cette operation va:
echo 1. REMPLACER votre cle privee actuelle
echo 2. Generer une NOUVELLE cle publique
echo 3. Vous devrez mettre a jour:
echo    - Le secret GitHub TAURI_PRIVATE_KEY
echo    - Le fichier src-tauri/tauri.conf.json
echo.
pause

echo.
echo Etape 1: Generation de la nouvelle cle
echo.
echo Vous allez devoir entrer un mot de passe.
echo IMPORTANT: Memorisez-le bien !
echo.
pause

REM Sauvegarder l'ancienne cle (au cas ou)
if exist .tauri-updater-key (
    copy .tauri-updater-key .tauri-updater-key.backup
    echo [INFO] Ancienne cle sauvegardee dans .tauri-updater-key.backup
)

REM Generer la nouvelle cle
npx --yes @tauri-apps/cli signer generate -w .tauri-updater-key

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] Generation de la cle echouee !
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Cle generee avec succes !
echo ========================================
echo.

REM Afficher la cle privee (pour GitHub)
echo Etape 2: Copier la cle privee dans le presse-papier
echo.
powershell -Command "Get-Content .tauri-updater-key | Set-Clipboard"
echo [OK] Cle privee copiee dans le presse-papier !
echo.
echo Allez sur: https://github.com/yoyoboul/formalyse/settings/secrets/actions
echo 1. Cliquez sur TAURI_PRIVATE_KEY
echo 2. Cliquez "Update secret"
echo 3. Collez (Ctrl+V)
echo 4. Cliquez "Update secret"
echo.
pause

REM Afficher la cle publique
echo.
echo Etape 3: Mettre a jour la cle publique dans tauri.conf.json
echo.
for /f "delims=" %%i in (.tauri-updater-key.pub) do set PUBKEY=%%i
echo Votre nouvelle cle publique:
echo %PUBKEY%
echo.
echo Cette cle doit etre mise dans src-tauri/tauri.conf.json
echo dans la section: "plugins" ^> "updater" ^> "pubkey"
echo.
pause

REM Mettre a jour automatiquement tauri.conf.json
echo.
echo Voulez-vous mettre a jour automatiquement tauri.conf.json ? (O/N)
set /p UPDATE_CONFIG=
if /i "%UPDATE_CONFIG%"=="O" (
    echo Mise a jour de tauri.conf.json...
    powershell -Command "$config = Get-Content 'src-tauri\tauri.conf.json' | ConvertFrom-Json; $config.plugins.updater.pubkey = '%PUBKEY%'; $config | ConvertTo-Json -Depth 10 | Set-Content 'src-tauri\tauri.conf.json'"
    echo [OK] tauri.conf.json mis a jour !
)

echo.
echo ========================================
echo    Configuration terminee !
echo ========================================
echo.
echo Prochaines etapes:
echo 1. [X] Cle privee copiee dans le presse-papier
echo 2. [ ] Mettre a jour le secret GitHub TAURI_PRIVATE_KEY
echo 3. [ ] Verifier src-tauri/tauri.conf.json
echo 4. [ ] Tester localement: npm run tauri:build
echo.
echo Fichiers crees/modifies:
echo - .tauri-updater-key (CLE PRIVEE - NE PAS COMMITER)
echo - .tauri-updater-key.pub (cle publique)
echo - .tauri-updater-key.backup (ancienne cle)
echo.
pause

