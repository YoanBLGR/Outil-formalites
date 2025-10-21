#!/bin/bash

echo "========================================"
echo "   Formalyse Desktop - Mode Dev"
echo "========================================"
echo ""
echo "Démarrage de l'application desktop..."
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

echo "[OK] Rust est installé : $(rustc --version)"
echo ""

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installation des dépendances..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERREUR] Installation échouée !"
        exit 1
    fi
fi

echo "[INFO] Lancement de Tauri..."
echo ""
npm run tauri:dev

