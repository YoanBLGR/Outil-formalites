# ⚡ Quick Start - Formalyse Desktop

Guide rapide pour transformer Formalyse en application desktop standalone.

## 🎯 En 3 étapes

### 1️⃣ Installer Rust (obligatoire)

**Windows** :
```powershell
winget install --id Rustlang.Rustup
```

**macOS/Linux** :
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2️⃣ Lancer l'application

```bash
# Mode développement (avec hot-reload)
npm run tauri:dev
```

L'application s'ouvre automatiquement en mode desktop ! 🎉

### 3️⃣ Créer l'exécutable

```bash
# Build pour votre système
npm run tauri:build
```

**Résultat** :
- Windows : `src-tauri/target/release/bundle/nsis/Formalyse_1.0.0_x64-setup.exe`
- macOS : `src-tauri/target/release/bundle/dmg/Formalyse_1.0.0_x64.dmg`
- Linux : `src-tauri/target/release/bundle/deb/formalyse_1.0.0_amd64.deb`

## 📦 Taille des exécutables

- **~3-5 MB** (binaire seul)
- **~15-20 MB** (avec dépendances)
- **95% plus léger qu'Electron !**

## 🎨 Ajouter votre logo (optionnel)

```bash
# Générer les icônes depuis une image PNG (1024x1024px)
npx @tauri-apps/cli icon chemin/vers/votre-logo.png
```

Les icônes seront automatiquement placées dans `src-tauri/icons/`.

## 🔧 Commandes utiles

| Commande | Action |
|----------|--------|
| `npm run tauri:dev` | Mode développement |
| `npm run tauri:build` | Créer l'exécutable |
| `npm run dev` | Mode web (sans Tauri) |

## ⚠️ Prérequis Windows supplémentaires

Si vous rencontrez des erreurs de compilation, installez :
- **Visual Studio Build Tools** : https://visualstudio.microsoft.com/fr/downloads/
  - Sélectionner "Outils de build C++"

## 🚀 Premiers tests

1. **Test en mode dev** :
   ```bash
   npm run tauri:dev
   ```
   ✅ L'app s'ouvre en desktop avec hot-reload

2. **Créer le build** :
   ```bash
   npm run tauri:build
   ```
   ⏱️ Première fois : 5-15 minutes (compilation Rust)
   ⚡ Fois suivantes : 1-3 minutes

3. **Tester l'installateur** :
   - Naviguez vers `src-tauri/target/release/bundle/`
   - Double-cliquez sur l'installateur créé
   - Installez et lancez !

## 📖 Documentation complète

Consultez `TAURI_BUILD_GUIDE.md` pour :
- Configuration avancée
- Signature de code
- Multi-plateforme
- Optimisations
- Débogage

## 🆘 Aide

**Erreur "Rust not found"** :
```bash
rustc --version  # Vérifier l'installation
```

**Build très lent** :
- Normal pour la première compilation
- Utilisez `npm run tauri:dev` pour les tests

**L'app ne démarre pas** :
```bash
# Vérifier les logs
npm run tauri:dev
# Regardez les erreurs dans la console
```

## ✨ Avantages Tauri vs Web

✅ **Aucune connexion internet requise**
✅ **Démarrage instantané**
✅ **Intégration système (notifications, fichiers, etc.)**
✅ **Sécurité renforcée**
✅ **Performance native**
✅ **Très léger (3-20 MB vs 120+ MB pour Electron)**

---

**Bon développement ! 🚀**

Pour toute question : consultez https://v2.tauri.app/

