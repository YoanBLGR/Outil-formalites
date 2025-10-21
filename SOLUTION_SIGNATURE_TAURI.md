# 🎯 Solution Définitive : Signature Automatique Tauri

## 🔍 **Problème Identifié**

Nous rencontrions l'erreur : `failed to decode base64 secret key: Invalid symbol 46, offset 0`

### Causes Multiples

1. ❌ **Signature manuelle après le build** : Nous tentions de signer manuellement avec `npx @tauri-apps/cli signer sign`, ce qui créait des conflits
2. ❌ **Mauvais noms de variables d'environnement** : Utilisait `TAURI_PRIVATE_KEY` au lieu de `TAURI_SIGNING_PRIVATE_KEY`
3. ❌ **Incompatibilité des outils** : `npx @tauri-apps/cli signer generate` génère des clés `rsign`, mais `npx @tauri-apps/cli signer sign` ne peut pas les décoder

## ✅ **Solution Complète**

### 1️⃣ Tauri Signe **AUTOMATIQUEMENT** Pendant le Build

**Tauri gère la signature en interne** si les variables d'environnement correctes sont définies :

- ✅ `TAURI_SIGNING_PRIVATE_KEY` : Chemin ou contenu de la clé privée
- ✅ `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` : Mot de passe de la clé

**Résultat** : Un fichier `.sig` est créé automatiquement à côté de l'installateur (ex: `Formalyse_1.0.2_x64-setup.exe.sig`)

### 2️⃣ Utiliser Minisign pour Générer la Clé

**Commande correcte** :
```bash
minisign -G -f -p .tauri-updater-key.pub -s .tauri-updater-key
```

**Pourquoi minisign et pas le CLI Tauri ?**
- `npx @tauri-apps/cli signer generate` génère des clés **rsign** (incompatibles)
- Tauri utilise **minisign** en interne pour signer
- Il faut donc générer des clés au format **minisign pur**

### 3️⃣ Configuration GitHub Actions

#### **Variables d'Environnement Correctes**

```yaml
- name: Build Tauri app
  run: npm run tauri:build
  env:
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
```

⚠️ **Attention** : Les noms des variables dans `env:` doivent être :
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

**PAS** :
- ~~`TAURI_PRIVATE_KEY`~~
- ~~`TAURI_KEY_PASSWORD`~~

#### **Récupérer la Signature Générée**

Au lieu de re-signer manuellement, **lisez le fichier `.sig`** :

```powershell
$exePath = "src-tauri\target\release\bundle\nsis\Formalyse_${version}_x64-setup.exe"
$sigPath = "$exePath.sig"

# Lire la signature générée par Tauri
$signature = Get-Content $sigPath -Raw
$signature = $signature.Trim()
```

### 4️⃣ Format du Secret GitHub

Le secret `TAURI_PRIVATE_KEY` doit contenir **le contenu complet** du fichier `.tauri-updater-key` :

```
untrusted comment: minisign encrypted secret key
RWRTY0IyQNiuLKWgz9Tuc02L049WpMxckgoUXZU8OkCWIJp7ePkAAAACAAAAAAAAAEAAAAAASc3JRGbzKdWaKwXfJF/Ea0fvv/ldKPXUeNEgvOrNUC9ATAYRUQ0bA0nZwkWhI8U3IaTbGjSghLwSGD2UHDPPoyN3vP7vChSGMQ5r9j9inLbTeU7Qng3fcqc96jSmkPnMapdJd2LA3p8=
```

**Inclure** :
- ✅ La ligne `untrusted comment: ...`
- ✅ La clé base64 complète
- ✅ Pas de retour à la ligne supplémentaire

## 📋 **Workflow Complet**

### **Génération de Clé (Une seule fois)**

```bash
# 1. Installer minisign
winget install minisign

# 2. Générer la clé
.\generate-minisign-key.bat

# 3. Copier la clé privée dans le secret GitHub
type .tauri-updater-key | clip

# 4. Copier la clé publique dans tauri.conf.json
type .tauri-updater-key.pub
```

### **Tester Localement (Avant de Pusher)**

```bash
.\test-tauri-build-local.bat
```

Ce script va :
1. Builder l'application avec les variables d'environnement
2. Vérifier que Tauri génère automatiquement le fichier `.sig`
3. Afficher la signature

### **Déployer sur GitHub**

```bash
# 1. Mettre à jour la version
npm version patch

# 2. Créer et pousser le tag
git tag v1.0.3
git push origin v1.0.3
```

Le workflow GitHub Actions va :
1. ✅ Builder l'application
2. ✅ Tauri signe automatiquement (génère `.sig`)
3. ✅ Lire le fichier `.sig`
4. ✅ Créer `latest.json` avec la signature
5. ✅ Publier la release

## 🛠️ **Scripts Disponibles**

| Script | Description |
|--------|-------------|
| `generate-minisign-key.bat` | Génère une clé minisign pure |
| `regenerate-tauri-key.bat` | Régénère clé + met à jour `tauri.conf.json` |
| `test-tauri-build-local.bat` | Teste le build complet avec signature auto |
| `test-signature-local.bat` | ⚠️ Obsolète (signature manuelle) |

## 🔐 **Secrets GitHub Requis**

| Nom | Contenu |
|-----|---------|
| `TAURI_PRIVATE_KEY` | Contenu complet de `.tauri-updater-key` |
| `TAURI_KEY_PASSWORD` | Mot de passe de la clé |

**Où les configurer** :
```
GitHub → Settings → Secrets and variables → Actions → Repository secrets
```

## ✅ **Checklist Avant de Pousser**

- [ ] Clé générée avec `minisign` (pas Tauri CLI)
- [ ] Clé publique mise à jour dans `tauri.conf.json`
- [ ] Secret `TAURI_PRIVATE_KEY` contient **tout** le fichier (avec "untrusted comment")
- [ ] Secret `TAURI_KEY_PASSWORD` contient le bon mot de passe
- [ ] Test local réussi avec `.\test-tauri-build-local.bat`
- [ ] Version MSI valide (pas de `-test` ou caractères non numériques)
- [ ] Variables d'env dans le workflow : `TAURI_SIGNING_PRIVATE_KEY` et `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

## 📚 **Références**

- [Tauri Updater Documentation](https://v2.tauri.app/plugin/updater/)
- [Minisign](https://jedisct1.github.io/minisign/)
- [Tauri Signing (Linux)](https://v2.tauri.app/fr/distribute/sign/linux/)

---

**Date** : 21 octobre 2025  
**Statut** : ✅ Solution validée et documentée

