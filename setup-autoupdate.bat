@echo off
echo ========================================
echo    Configuration Auto-Update Tauri
echo ========================================
echo.

echo Etape 1: Generation de la cle de signature
echo.
echo IMPORTANT: Vous allez devoir entrer un mot de passe.
echo Ce mot de passe protege votre cle privee.
echo.
echo Memorisez-le bien, vous en aurez besoin pour chaque release !
echo.
pause

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
echo Fichiers crees:
echo   - .tauri-updater-key (CLE PRIVEE - NE PAS COMMITER!)
echo   - .tauri-updater-key.pub (cle publique)
echo.
echo IMPORTANT:
echo 1. La cle privee est dans .tauri-updater-key
echo 2. NE COMMITEZ JAMAIS ce fichier !
echo 3. Sauvegardez-le en lieu sur (backup)
echo 4. La cle publique sera ajoutee a tauri.conf.json
echo.

REM Lire la cle publique
for /f "delims=" %%i in (.tauri-updater-key.pub) do set PUBKEY=%%i

echo Votre cle publique:
echo %PUBKEY%
echo.
echo Cette cle sera automatiquement ajoutee a la configuration.
echo.
pause

echo Etape 2: Configuration de Tauri
echo.

REM Backup de tauri.conf.json
copy src-tauri\tauri.conf.json src-tauri\tauri.conf.json.backup

REM Ajouter updater dans tauri.conf.json via PowerShell
powershell -Command "$config = Get-Content 'src-tauri\tauri.conf.json' | ConvertFrom-Json; if (-not $config.plugins) { $config | Add-Member -NotePropertyName 'plugins' -NotePropertyValue @{} -Force }; $config.plugins | Add-Member -NotePropertyName 'updater' -NotePropertyValue @{ active = $true; pubkey = '%PUBKEY%'; endpoints = @('https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json'); windows = @{ installMode = 'passive' } } -Force; $config | ConvertTo-Json -Depth 10 | Set-Content 'src-tauri\tauri.conf.json'"

echo.
echo [OK] Configuration mise a jour !
echo.
echo Prochaines etapes:
echo 1. Ajoutez .tauri-updater-key dans .gitignore
echo 2. Installez le package updater: npm install @tauri-apps/plugin-updater
echo 3. Lancez: npm run tauri:dev pour tester
echo.
pause

