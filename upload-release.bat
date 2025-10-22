@echo off
echo.
echo Ouverture de la page GitHub pour upload manuel...
echo.

REM Lire la version depuis package.json
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content package.json | ConvertFrom-Json).version"') do set version=%%i

echo Version detectee : %version%
echo.

REM Ouvrir GitHub
start https://github.com/yoyoboul/formalyse/releases/new?tag=v%version%^&title=Formalyse%%20v%version%

echo Navigateur ouvert !
echo.

REM Ouvrir l'explorateur avec les fichiers
set "exePath=src-tauri\target\release\bundle\nsis\Formalyse_%version%_x64-setup.exe"
explorer /select,"%exePath%"

echo Explorateur ouvert !
echo.
echo Fichiers a uploader :
echo   1. Formalyse_%version%_x64-setup.exe
echo   2. latest.json
echo   3. Formalyse_%version%_x64_en-US.msi
echo.

pause

