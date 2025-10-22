@echo off
REM ============================================================
REM Script pour configurer le token GitHub de manière permanente
REM ============================================================

echo.
echo ════════════════════════════════════════════════════════════════
echo        🔐 Configuration du Token GitHub - Formalyse            
echo ════════════════════════════════════════════════════════════════
echo.

echo Pour obtenir un token GitHub :
echo.
echo 1. Allez sur : https://github.com/settings/tokens/new
echo 2. Note : "Formalyse Release Token"
echo 3. Permissions : repo + write:packages
echo 4. Generate token
echo 5. Copiez le token (ghp_...)
echo.

set /p token="Entrez votre token GitHub : "

if not defined token (
    echo ❌ Token vide !
    pause
    exit /b 1
)

echo.
echo Configuration du token...

REM Définir la variable d'environnement pour l'utilisateur
powershell -NoProfile -Command "[System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', '%token%', 'User')"

if errorlevel 1 (
    echo ❌ Erreur lors de la configuration
    pause
    exit /b 1
)

echo.
echo ✅ Token configuré avec succès !
echo.
echo ℹ️  Le token est maintenant disponible pour toutes les futures sessions.
echo ℹ️  Vous pouvez maintenant utiliser release.bat en mode automatique.
echo.
echo ⚠️  Redémarrez votre terminal pour que la variable soit prise en compte.
echo.

pause

