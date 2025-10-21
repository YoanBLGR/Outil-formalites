#!/bin/bash

echo "========================================"
echo "   Formalyse Desktop - Build"
echo "========================================"
echo ""
echo "Création de l'exécutable..."
echo ""
echo "ATTENTION : Première compilation = 5-15 minutes"
echo "            Compilations suivantes = 1-3 minutes"
echo ""

# Vérifier si Rust est installé
if ! command -v rustc &> /dev/null; then
    echo "[ERREUR] Rust n'est pas installé !"
    echo ""
    echo "Installez Rust avec :"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo ""
    exit 1
fi

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installation des dépendances..."
    npm install
fi

echo "[INFO] Build en cours..."
echo ""
npm run tauri:build

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "   BUILD RÉUSSI !"
    echo "========================================"
    echo ""
    echo "Fichiers créés :"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  - App : src-tauri/target/release/bundle/macos/Formalyse.app"
        echo "  - DMG : src-tauri/target/release/bundle/dmg/Formalyse_1.0.0_x64.dmg"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  - DEB     : src-tauri/target/release/bundle/deb/formalyse_1.0.0_amd64.deb"
        echo "  - AppImage: src-tauri/target/release/bundle/appimage/formalyse_1.0.0_amd64.AppImage"
    fi
    
    echo ""
else
    echo ""
    echo "[ERREUR] Le build a échoué !"
    echo "Vérifiez les logs ci-dessus pour plus d'informations."
    exit 1
fi

