# 🚀 Publier la Version 1.0.0 - Guide Rapide

## ✅ Versions Synchronisées

Tous les fichiers sont maintenant à la version **1.0.0** :
- ✅ `package.json` → 1.0.0
- ✅ `src-tauri/tauri.conf.json` → 1.0.0
- ✅ `src/hooks/useTauriUpdater.ts` → 1.0.0

---

## 🎯 Méthode 1 : Utiliser `release.bat` (Recommandé)

### Étape 1 : Committer les changements actuels

```bash
git add .
git commit -m "Reset to v1.0.0"
```

### Étape 2 : Lancer le script de release

```bash
.\release.bat
```

Le script va vous demander :
```
📌 Quelle version voulez-vous publier ?

   1. Patch (1.0.0 => 1.0.1)
   2. Minor (1.0.0 => 1.1.0)
   3. Major (1.0.0 => 2.0.0)
   4. Manuelle

Votre choix (1/2/3/4) :
```

**Répondez : 4** (Manuelle)

Puis quand demandé :
```
Entrez la nouvelle version (ex: 2.1.3) : 1.0.0
```

Le script va :
1. ✅ Construire l'application v1.0.0
2. ✅ Signer l'exécutable (vous devrez entrer votre mot de passe)
3. ✅ Générer `latest.json` avec signature
4. ✅ Créer le commit et tag Git
5. ✅ Pousser sur GitHub
6. ✅ Créer la release (auto ou manuel selon token)

---

## 🎯 Méthode 2 : Manuelle (Pas à Pas)

Si vous préférez faire chaque étape manuellement :

### Étape 1 : Commit et Tag

```bash
git add package.json src-tauri/tauri.conf.json src/hooks/useTauriUpdater.ts
git commit -m "v1.0.0"
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

### Étape 2 : Build

```bash
npm run tauri:build
```

Durée : ~2-3 minutes

### Étape 3 : Signer et générer latest.json

```powershell
.\sign-and-generate-json.ps1 -Version "1.0.0"
```

Entrez le mot de passe de votre clé privée quand demandé.

**Fichiers générés :**
- `src-tauri\target\release\bundle\nsis\Formalyse_1.0.0_x64-setup.exe` (signé)
- `latest.json` (avec signature)

### Étape 4 : Créer la release GitHub

#### Option A : Automatique (si token configuré)

```powershell
$env:GITHUB_TOKEN = "ghp_votre_token"
.\create-release-simple.ps1 -Version "1.0.0"
```

#### Option B : Manuel

1. Allez sur : https://github.com/yoyoboul/formalyse/releases/new
2. **Tag version** : `v1.0.0`
3. **Titre** : `Formalyse v1.0.0`
4. **Description** :
   ```markdown
   ## 🎉 Version 1.0.0 - Release Initiale
   
   Première version stable de Formalyse Desktop avec auto-update fonctionnel.
   
   ### ✨ Fonctionnalités
   - Gestion complète des dossiers juridiques
   - Génération automatique de statuts (EURL, SARL, SASU)
   - Export en PDF et DOCX
   - IA intégrée pour assistance
   - **Auto-update automatique**
   
   ### 📥 Installation
   Téléchargez `Formalyse_1.0.0_x64-setup.exe` ci-dessous
   ```

5. **Uploadez les fichiers** :
   - Glissez `Formalyse_1.0.0_x64-setup.exe`
   - Glissez `latest.json`

6. **Cliquez sur "Publish release"**

---

## ✅ Vérification

### 1. Vérifier que la release est publiée

https://github.com/yoyoboul/formalyse/releases/tag/v1.0.0

Vous devriez voir :
- ✅ Tag `v1.0.0`
- ✅ 2 fichiers attachés :
  - `Formalyse_1.0.0_x64-setup.exe`
  - `latest.json`

### 2. Vérifier que latest.json est accessible

```powershell
Invoke-WebRequest -Uri "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json" -UseBasicParsing
```

Devrait retourner :
```json
{
    "version": "1.0.0",
    "platforms": {
        "windows-x86_64": {
            "signature": "dW50cnVzdGVk...",
            "url": "https://github.com/yoyoboul/formalyse/releases/download/v1.0.0/Formalyse_1.0.0_x64-setup.exe"
        }
    }
}
```

### 3. Tester l'installation

Double-cliquez sur `Formalyse_1.0.0_x64-setup.exe` pour installer.

Lancez l'application :
- Le panneau de mise à jour doit afficher : **"Version actuelle: 1.0.0"**
- Logs : **"✅ Application à jour"** (car c'est la dernière version)

---

## 🔄 Pour les Prochaines Versions

### Publier v1.0.1 (Correctif)

```bash
.\release.bat
# Choisir : 1 (Patch)
```

Le script passe automatiquement de 1.0.0 → 1.0.1 et fait tout le reste !

### Publier v1.1.0 (Nouvelle fonctionnalité)

```bash
.\release.bat
# Choisir : 2 (Minor)
```

Le script passe de 1.0.0 → 1.1.0

### Publier v2.0.0 (Breaking changes)

```bash
.\release.bat
# Choisir : 3 (Major)
```

Le script passe de 1.0.0 → 2.0.0

---

## 🎯 Test de l'Auto-Update

Pour tester que l'auto-update fonctionnera pour les futures versions :

### 1. Installer la v1.0.0

Double-cliquez sur `Formalyse_1.0.0_x64-setup.exe`

### 2. Publier une v1.0.1

```bash
.\release.bat
# Choisir : 1 (Patch)
# Entrer le mot de passe de la clé
```

### 3. Relancer l'app v1.0.0 installée

Après 5-10 secondes, un panneau devrait apparaître :

```
🎉 Mise à jour disponible
Version 1.0.1 disponible (actuelle: 1.0.0)

[Mettre à jour v1.0.1]
```

Cliquez sur "Mettre à jour" → Installation automatique → L'app redémarre en v1.0.1 ! 🎊

---

## 📋 Checklist Finale

Avant de publier v1.0.0, vérifiez :

- [ ] Toutes les versions sont synchronisées à 1.0.0
  - `package.json`
  - `src-tauri/tauri.conf.json`
  - `src/hooks/useTauriUpdater.ts`
- [ ] Les changements sont committés
- [ ] Le build fonctionne sans erreur
- [ ] L'exécutable est signé
- [ ] Le `latest.json` contient une signature
- [ ] La release est créée sur GitHub
- [ ] Les 2 fichiers sont uploadés (exe + json)
- [ ] L'URL du latest.json est accessible
- [ ] L'application installée affiche "Version actuelle: 1.0.0"

---

## 🎉 Félicitations !

Une fois la v1.0.0 publiée :
- ✅ Vous avez une base solide pour vos releases
- ✅ L'auto-update est configuré et fonctionnel
- ✅ Le workflow de release est automatisé
- ✅ Toutes les futures versions se feront en 1 commande

**Bienvenue dans l'ère des releases automatisées ! 🚀**

---

## 🆘 En Cas de Problème

Si quelque chose ne fonctionne pas :

1. Vérifiez les logs dans l'application
2. Consultez `DIAGNOSTIC_AUTOUPDATE_PROBLEMES.md`
3. Vérifiez que la signature est présente dans latest.json
4. Vérifiez les permissions dans `src-tauri/capabilities/default.json`

La documentation complète est disponible dans :
- `GUIDE_COMPLET_RELEASE.md`
- `TESTER_AUTOUPDATE_MAINTENANT.md`
- `PROBLEME_VERSION_RESOLU.md`

