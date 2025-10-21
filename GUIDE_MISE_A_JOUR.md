# 🔄 Guide de Mise à Jour - Formalyse Desktop

Guide complet pour publier des mises à jour de votre application desktop.

---

## 📋 Workflow Standard (Manuel)

### 1. Développement
```bash
# Modifiez votre code
# Testez en mode dev
npm run tauri:dev
```

### 2. Mise à jour de la version

**Fichier 1** : `package.json`
```json
{
  "version": "1.0.1"  // ← Changez ici
}
```

**Fichier 2** : `src-tauri/tauri.conf.json`
```json
{
  "version": "1.0.1"  // ← Changez ici aussi
}
```

**Versionnement SemVer** :
- `1.0.0` → `1.0.1` : Bug fix
- `1.0.0` → `1.1.0` : Nouvelle fonctionnalité
- `1.0.0` → `2.0.0` : Breaking change

### 3. Build de production
```bash
npm run tauri:build
```

### 4. Test
Installez et testez le nouvel `.exe`

### 5. Git commit & tag
```bash
git add -A
git commit -m "v1.0.1: Description des changements"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

### 6. Distribution
- Uploadez l'installateur
- Créez une GitHub Release
- Informez vos utilisateurs

---

## ⚡ Workflow Rapide (Automatique)

### Utiliser le script `release.bat`

```bash
# Double-cliquez sur release.bat
# Ou lancez :
release.bat
```

Le script fait automatiquement :
1. ✅ Demande la nouvelle version
2. ✅ Met à jour `package.json` et `tauri.conf.json`
3. ✅ Lance le build de production
4. ✅ Propose de commit et push sur GitHub
5. ✅ Ouvre le dossier des builds

**Gain de temps : 10 minutes → 2 minutes !**

---

## 🌐 Distribution via GitHub Releases

### Créer une Release sur GitHub

1. **Allez sur** : https://github.com/yoyoboul/formalyse/releases

2. **Cliquez** : "Draft a new release"

3. **Configurez** :
   - **Tag** : `v1.0.1`
   - **Title** : `Formalyse v1.0.1`
   - **Description** :
     ```markdown
     ## 🎉 Nouveautés
     - Ajout de la fonctionnalité X
     - Amélioration de Y
     - Correction du bug Z
     
     ## 📥 Installation
     Téléchargez `Formalyse_1.0.1_x64-setup.exe` et lancez-le.
     
     ## 🔧 Changelog complet
     - Feature: Description
     - Fix: Description
     ```

4. **Uploadez** : `Formalyse_1.0.1_x64-setup.exe`

5. **Publiez** : "Publish release"

**Avantage** : Lien direct de téléchargement, historique de versions, changelog visible.

---

## 🔄 Auto-Update (Avancé)

### Configuration de Tauri Updater

#### 1. Activer le plugin updater

**`src-tauri/Cargo.toml`** :
```toml
[dependencies]
tauri = { version = "2.9.0", features = ["updater"] }
tauri-plugin-updater = "2"
```

**`src-tauri/tauri.conf.json`** :
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

#### 2. Générer une clé de signature

```bash
# Installer tauri-cli globalement
npm install -g @tauri-apps/cli

# Générer la paire de clés
tauri signer generate -w ~/.tauri/formalyse.key
```

Cela crée :
- **Clé privée** : `~/.tauri/formalyse.key` (GARDEZ SECRÈTE !)
- **Clé publique** : À mettre dans `tauri.conf.json`

#### 3. Créer le fichier `latest.json`

À chaque release, créez :

**`latest.json`** :
```json
{
  "version": "1.0.1",
  "notes": "Corrections de bugs et améliorations",
  "pub_date": "2025-10-21T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "SIGNATURE_GENEREE",
      "url": "https://github.com/yoyoboul/formalyse/releases/download/v1.0.1/Formalyse_1.0.1_x64-setup.exe"
    }
  }
}
```

#### 4. Code pour vérifier les mises à jour

**`src/main.tsx`** (ou `App.tsx`) :
```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

async function checkForUpdates() {
  const update = await check();
  
  if (update?.available) {
    console.log(`Update disponible : ${update.version}`);
    
    // Télécharger et installer
    await update.downloadAndInstall();
    
    // Redémarrer l'app
    await relaunch();
  }
}

// Vérifier au démarrage
useEffect(() => {
  checkForUpdates();
}, []);
```

#### 5. Workflow de release avec auto-update

```bash
# 1. Build
npm run tauri:build

# 2. Signer l'installateur
tauri signer sign \
  src-tauri/target/release/bundle/nsis/Formalyse_1.0.1_x64-setup.exe \
  --private-key ~/.tauri/formalyse.key \
  --password YOUR_PASSWORD

# 3. Créer latest.json avec signature

# 4. Upload sur GitHub Release :
#    - Formalyse_1.0.1_x64-setup.exe
#    - latest.json
```

---

## 📦 Workflow Multi-Plateformes

### Build pour Windows, macOS, Linux

#### Sur Windows :
```bash
npm run tauri:build  # → Windows .exe
```

#### Sur macOS :
```bash
npm run tauri:build  # → macOS .dmg
```

#### Sur Linux :
```bash
npm run tauri:build  # → Linux .deb/.AppImage
```

**Alternative** : GitHub Actions (CI/CD automatique)

---

## 🤖 GitHub Actions (Automatisation complète)

Créez `.github/workflows/release.yml` :

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        platform: [windows-latest, ubuntu-latest, macos-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Tauri app
        run: npm run tauri:build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.platform }}
          path: src-tauri/target/release/bundle/**/*
```

**Avantage** : Push un tag → Build automatique pour toutes les plateformes !

---

## 📝 Changelog automatique

### Option 1 : Conventional Commits

Format de commit :
```bash
git commit -m "feat: nouvelle fonctionnalité"
git commit -m "fix: correction de bug"
git commit -m "chore: mise à jour dépendances"
```

### Option 2 : Fichier CHANGELOG.md

**`CHANGELOG.md`** :
```markdown
# Changelog

## [1.0.1] - 2025-10-21

### Ajouté
- Fonctionnalité X
- Support de Y

### Corrigé
- Bug Z
- Problème W

### Modifié
- Amélioration performance

## [1.0.0] - 2025-10-15

- Version initiale
```

---

## ✅ Checklist de Release

- [ ] Code testé en mode dev
- [ ] Version mise à jour (2 fichiers)
- [ ] Build de production réussi
- [ ] Installateur testé
- [ ] Commit avec message clair
- [ ] Tag créé et poussé
- [ ] GitHub Release créée
- [ ] Changelog mis à jour
- [ ] Utilisateurs informés

---

## 🔐 Bonnes pratiques

### Sécurité
- ✅ Ne commitez JAMAIS la clé privée
- ✅ Utilisez `.gitignore` pour les clés
- ✅ Signez vos releases (production)

### Versionnement
- ✅ Suivez SemVer (1.0.0)
- ✅ Taggez toutes les releases
- ✅ Maintenez un CHANGELOG

### Tests
- ✅ Testez sur machine propre
- ✅ Testez l'upgrade depuis version précédente
- ✅ Vérifiez la taille du bundle

---

## 🆘 Problèmes courants

### "Version inchangée"
→ Vérifiez les 2 fichiers : `package.json` + `tauri.conf.json`

### "Signature invalide"
→ Regénérez la clé ou vérifiez le password

### "Build échoue sur CI"
→ Vérifiez les dépendances système (Rust, Node)

---

## 📚 Ressources

- **Tauri Updater** : https://v2.tauri.app/plugin/updater/
- **GitHub Releases** : https://docs.github.com/releases
- **SemVer** : https://semver.org/
- **Conventional Commits** : https://www.conventionalcommits.org/

---

**Workflow recommandé pour débuter** :
1. Utilisez `release.bat` pour automatiser
2. Distribuez via GitHub Releases
3. Plus tard : activez l'auto-update Tauri

🚀 **Bonne chance avec vos releases !**

