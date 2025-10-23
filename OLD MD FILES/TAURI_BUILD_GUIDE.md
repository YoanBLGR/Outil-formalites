# 🚀 Guide de Build Tauri - Formalyse Desktop

Ce guide vous explique comment créer des exécutables standalone de Formalyse pour Windows, macOS et Linux.

## 📋 Prérequis

### Windows
1. **Node.js** (v20.19+ ou v22.12+)
   - Télécharger depuis : https://nodejs.org/

2. **Rust** (requis pour Tauri)
   ```powershell
   # Installer Rust via rustup
   winget install --id Rustlang.Rustup
   # OU télécharger depuis : https://rustup.rs/
   ```

3. **Visual Studio Build Tools** (pour compilation C++)
   - Installer via : https://visualstudio.microsoft.com/fr/downloads/
   - Sélectionner "Outils de build C++"

4. **WebView2 Runtime** (généralement déjà installé sur Windows 10/11)
   - Si absent : https://developer.microsoft.com/microsoft-edge/webview2/

### macOS
```bash
# Installer Xcode Command Line Tools
xcode-select --install

# Installer Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Linux (Ubuntu/Debian)
```bash
# Dépendances système
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# Installer Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 🎨 Préparer les icônes

### Option 1 : Générateur en ligne (Recommandé)
1. Créez un logo carré (1024x1024px minimum)
2. Visitez : https://icon.kitchen/
3. Uploadez votre logo
4. Sélectionnez "Desktop Icons"
5. Téléchargez et décompressez dans `src-tauri/icons/`

### Option 2 : CLI Tauri
```bash
# Générer automatiquement toutes les icônes depuis une image
npx @tauri-apps/cli icon path/to/your-icon.png
```

Les icônes requises :
- `32x32.png` - Petite icône Windows
- `128x128.png` - Icône standard
- `128x128@2x.png` - Icône Retina (macOS)
- `icon.icns` - Icône macOS
- `icon.ico` - Icône Windows

## 🔧 Configuration de l'environnement

### Variables d'environnement (.env)
Créez un fichier `.env` à la racine du projet avec vos clés API :

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_key_here
# Autres variables si nécessaire
```

## 🛠️ Commandes de développement

### Lancer en mode développement
```bash
# Terminal 1 : Démarre le serveur Vite ET l'application Tauri
npm run tauri:dev
```

Cette commande :
- Compile le code Rust
- Démarre le serveur Vite (React)
- Ouvre l'application desktop avec hot-reload
- Affiche les logs de débogage

### Mode web classique (sans Tauri)
```bash
npm run dev
# Ouvrez http://localhost:5173 dans votre navigateur
```

## 📦 Créer les exécutables

### Build de production

```bash
# Créer l'exécutable pour votre système actuel
npm run tauri:build
```

### Emplacements des builds

**Windows** :
- Installateur : `src-tauri/target/release/bundle/nsis/Formalyse_1.0.0_x64-setup.exe`
- MSI : `src-tauri/target/release/bundle/msi/Formalyse_1.0.0_x64_en-US.msi`
- Portable : `src-tauri/target/release/Formalyse.exe`

**macOS** :
- App : `src-tauri/target/release/bundle/macos/Formalyse.app`
- DMG : `src-tauri/target/release/bundle/dmg/Formalyse_1.0.0_x64.dmg`

**Linux** :
- Debian : `src-tauri/target/release/bundle/deb/formalyse_1.0.0_amd64.deb`
- AppImage : `src-tauri/target/release/bundle/appimage/formalyse_1.0.0_amd64.AppImage`

## 🎯 Tailles approximatives

| Plateforme | Taille minimale | Avec dépendances |
|------------|----------------|-------------------|
| Windows    | ~3-5 MB        | ~15-20 MB         |
| macOS      | ~4-6 MB        | ~20-25 MB         |
| Linux      | ~3-5 MB        | ~15-20 MB         |

*Bien plus léger qu'Electron (120+ MB) !*

## 🔍 Débogage

### Activer les DevTools
Dans `src-tauri/tauri.conf.json`, modifiez :
```json
{
  "app": {
    "withGlobalTauri": true
  }
}
```

Puis dans votre app, ouvrez les DevTools avec :
- **Windows/Linux** : F12 ou Ctrl+Shift+I
- **macOS** : Cmd+Option+I

### Logs Rust
```bash
# Afficher les logs détaillés pendant le build
RUST_BACKTRACE=1 npm run tauri:build

# Logs en mode dev
RUST_LOG=debug npm run tauri:dev
```

## 📝 Personnalisation

### Modifier les informations de l'application
Éditez `src-tauri/tauri.conf.json` :

```json
{
  "productName": "Votre Nom",
  "version": "2.0.0",
  "identifier": "com.votre-domaine.app"
}
```

### Fenêtre de l'application
```json
{
  "app": {
    "windows": [{
      "title": "Mon App",
      "width": 1600,
      "height": 1000,
      "resizable": true,
      "fullscreen": false
    }]
  }
}
```

## 🚀 Distribution

### Windows
- **Recommandé** : Distribuez le fichier `.exe` du setup NSIS (installateur)
- **Alternative** : Fichier `.exe` portable (aucune installation requise)

### macOS
- Distribuez le fichier `.dmg`
- Pour App Store : configuration supplémentaire requise

### Linux
- **Debian/Ubuntu** : Fichier `.deb`
- **Universel** : Fichier `.AppImage` (fonctionne sur toutes les distros)

## ⚡ Optimisations

### Build optimisé (plus petit, plus rapide)
Dans `src-tauri/Cargo.toml`, ajoutez :

```toml
[profile.release]
opt-level = "z"     # Optimisation pour la taille
lto = true          # Link Time Optimization
codegen-units = 1   # Compilation plus lente mais binaire plus petit
panic = "abort"     # Réduction de taille
strip = true        # Retirer les symboles de débogage
```

### Build pour plusieurs architectures
```bash
# Windows ARM
rustup target add aarch64-pc-windows-msvc
npm run tauri build -- --target aarch64-pc-windows-msvc

# Linux ARM
rustup target add aarch64-unknown-linux-gnu
npm run tauri build -- --target aarch64-unknown-linux-gnu
```

## 🔐 Signature et notarisation

### Windows (optionnel)
Pour signer votre .exe avec un certificat :
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

### macOS (obligatoire pour distribution)
```bash
# Signer l'app
codesign --deep --force --verify --verbose --sign "Developer ID" \
  "src-tauri/target/release/bundle/macos/Formalyse.app"

# Notariser (pour macOS 10.15+)
xcrun notarytool submit Formalyse.dmg \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password"
```

## 🆘 Problèmes courants

### Erreur : "Rust not found"
```bash
# Vérifier l'installation
rustc --version
cargo --version

# Réinstaller si nécessaire
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Erreur : "WebView2 not found" (Windows)
Installer : https://developer.microsoft.com/microsoft-edge/webview2/

### Build très lent
Première compilation Rust = 5-15 minutes (normal)
Compilations suivantes = 1-3 minutes

### L'app ne démarre pas
1. Vérifier les logs dans `src-tauri/target/release/`
2. Tester en mode dev : `npm run tauri:dev`
3. Vérifier les permissions (antivirus, pare-feu)

## 📚 Ressources

- **Documentation Tauri** : https://v2.tauri.app/
- **API Reference** : https://v2.tauri.app/reference/javascript/
- **Discord Tauri** : https://discord.com/invite/tauri
- **Exemples** : https://github.com/tauri-apps/tauri/tree/dev/examples

## 🎉 Commandes rapides

```bash
# Développement
npm run tauri:dev

# Build production
npm run tauri:build

# Build + installer les dépendances
npm install && npm run tauri:build

# Nettoyer les builds précédents
cd src-tauri && cargo clean && cd ..
```

---

## ✅ Checklist avant distribution

- [ ] Icônes personnalisées créées
- [ ] Version mise à jour dans `tauri.conf.json` et `package.json`
- [ ] Variables d'environnement configurées
- [ ] Tests sur la plateforme cible
- [ ] Build en mode release testé
- [ ] Documentation utilisateur créée
- [ ] Installateur testé (Windows)
- [ ] App signée (Windows/macOS si distribution publique)

---

**Bon build ! 🚀**

