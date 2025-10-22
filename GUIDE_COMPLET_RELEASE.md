# 🚀 Guide Complet - Publier une Release Formalyse

Ce guide explique comment publier une nouvelle version de Formalyse avec auto-update fonctionnel.

---

## ⚡ Méthode Rapide (Recommandée)

### Utiliser `release.bat` - Tout Automatisé

```bash
.\release.bat
```

**Ce script fait TOUT automatiquement :**
1. ✅ Incrémente la version (patch/minor/major)
2. ✅ Met à jour `package.json` et `tauri.conf.json`
3. ✅ Build l'application Tauri
4. ✅ **Signe l'exécutable** avec votre clé privée
5. ✅ **Génère `latest.json` avec signature**
6. ✅ Commit et tag Git
7. ✅ Push sur GitHub
8. ✅ Crée la release GitHub (auto ou manuel)
9. ✅ Upload les fichiers (si token GitHub fourni)

---

## 📋 Prérequis

### Une seule fois (Configuration initiale)

#### 1. Clés de signature (DÉJÀ FAIT ✅)
Vous avez déjà :
- ✅ Clé privée : `C:\Users\Yoanb\.tauri\formalyse.key`
- ✅ Clé publique : Dans `src-tauri/tauri.conf.json`

#### 2. Token GitHub (Optionnel - pour upload automatique)

**Sans token :** Le script ouvrira GitHub pour upload manuel  
**Avec token :** Upload 100% automatique

**Pour obtenir un token :**
1. Allez sur : https://github.com/settings/tokens/new
2. Nom : `Formalyse Release`
3. Permissions : Cochez `repo` (tous les droits)
4. Générez et copiez le token (commence par `ghp_...`)

**Pour configurer le token :**

```bash
# Méthode 1 : Variable d'environnement permanente
setx GITHUB_TOKEN "ghp_votre_token_ici"

# Méthode 2 : Pour la session actuelle uniquement
set GITHUB_TOKEN=ghp_votre_token_ici
```

---

## 🎯 Processus Complet Étape par Étape

### Étape 1 : Lancer le script

```bash
.\release.bat
```

### Étape 2 : Choisir le type de version

Le script vous demande :
```
📌 Quelle version voulez-vous publier ?

   1. Patch (2.0.2 => 2.0.3)  - Correctifs mineurs
   2. Minor (2.0.2 => 2.1.0)  - Nouvelles fonctionnalités
   3. Major (2.0.2 => 3.0.0)  - Changements majeurs
   4. Manuelle                - Saisir manuellement (ex: 2.1.3)

Votre choix (1/2/3/4) :
```

**Exemples :**
- Correction de bugs → Choisir `1` (Patch)
- Nouvelle fonctionnalité → Choisir `2` (Minor)
- Breaking changes → Choisir `3` (Major)
- Version spécifique → Choisir `4` et saisir `2.5.0` par exemple

### Étape 3 : Le script travaille

```
🔄 Incrémentation de la version...
✅ package.json mis à jour : 2.0.3
✅ tauri.conf.json mis à jour : 2.0.3

🔨 Build de l'application Tauri v2.0.3...
   ⏱️  Cela peut prendre 2-3 minutes...
✅ Build terminé avec succès !

📦 Vérification du build...
✅ Installateur trouvé

🔐 Signature du build et génération de latest.json...
   ⚠️  Vous devrez entrer le mot de passe de votre clé privée
```

### Étape 4 : Entrer le mot de passe de la clé

Quand demandé :
```
Password: ************
```

Entrez le mot de passe que vous avez choisi lors de la génération de la clé.

### Étape 5 : Signature et génération

```
[OK] Signature generee

[2/3] Generation de latest.json...
[OK] latest.json cree

✅ Build signé et latest.json créé avec signature !
✅ Fichiers prêts pour publication :
   • Formalyse_2.0.3_x64-setup.exe (signé)
   • latest.json (avec signature)
```

### Étape 6 : Git commit et push

```
📦 Commit et tag Git...
✅ Commit et tag créés !

🌐 Push sur GitHub...
✅ Poussé sur GitHub !
```

### Étape 7A : Upload automatique (si token configuré)

```
🎁 Création de la release GitHub automatique...

Création de la release...
✅ Release créée: https://github.com/yoyoboul/formalyse/releases/tag/v2.0.3

Upload de l'installateur...
✅ Formalyse_2.0.3_x64-setup.exe uploadé

Upload de latest.json...
✅ latest.json uploadé

✅ Release complète !
🌐 Voir: https://github.com/yoyoboul/formalyse/releases/tag/v2.0.3
```

### Étape 7B : Upload manuel (si pas de token)

```
════════════════════════════════════════════════════════════════
                 📋 Upload Manuel Requis
════════════════════════════════════════════════════════════════

🌐 Ouvrir la page de release GitHub ? (y/n)
Votre choix : y
✅ Navigateur ouvert !

📂 Ouvrir le dossier des fichiers ? (y/n)
Votre choix : y
✅ Explorateur ouvert !

📋 Fichiers à uploader :
   1. src-tauri\target\release\bundle\nsis\Formalyse_2.0.3_x64-setup.exe
   2. latest.json
```

**Si upload manuel :**
1. Dans le navigateur, glissez les 2 fichiers dans la zone "Attach binaries"
2. Cliquez sur "Publish release"

### Étape 8 : Terminé !

```
════════════════════════════════════════════════════════════════
                   ✅ Release Terminée !
════════════════════════════════════════════════════════════════

📋 Récapitulatif :
   • Version : 2.0.3
   • Build : ✓
   • Git commit : ✓
   • Git tag : ✓
   • Push GitHub : ✓
   • Release GitHub : ✓
   • Upload automatique : ✓

🌐 Release : https://github.com/yoyoboul/formalyse/releases/tag/v2.0.3

🎯 Les utilisateurs recevront la notification de mise à jour !
```

---

## ✅ Vérification Post-Release

### 1. Vérifier que la release est publiée

Ouvrez : https://github.com/yoyoboul/formalyse/releases

Vous devriez voir :
- ✅ Tag `v2.0.3`
- ✅ Titre "Formalyse v2.0.3"
- ✅ Fichiers attachés :
  - `Formalyse_2.0.3_x64-setup.exe`
  - `latest.json`

### 2. Vérifier que `latest.json` est accessible

Dans PowerShell :
```powershell
Invoke-WebRequest -Uri "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json"
```

Devrait retourner le JSON avec :
- `version`: "2.0.3"
- `signature`: "dW50cnVzdGVk..." (longue chaîne)
- `url`: lien vers l'exécutable

### 3. Tester l'auto-update

**Option A : Depuis une ancienne version**
1. Installez la version précédente (2.0.2)
2. Lancez l'application
3. Attendez 5 secondes
4. Un panneau doit apparaître en bas à droite : "🎉 Mise à jour disponible"

**Option B : Depuis le code**
1. Modifiez `src/hooks/useTauriUpdater.ts` :
   ```typescript
   const CURRENT_VERSION = '2.0.2' // Simuler une ancienne version
   ```
2. Lancez l'app en dev : `npm run tauri:dev`
3. Le panneau de MAJ devrait apparaître

---

## 🔄 Pour les Prochaines Versions

### Simple : Relancez `release.bat`

```bash
.\release.bat
```

Et c'est tout ! Le script :
- ✅ Incrémente automatiquement la version
- ✅ Signe le build
- ✅ Génère latest.json avec signature
- ✅ Publie sur GitHub

---

## 📝 Workflow Complet Récapitulatif

| Étape | Action | Automatique | Durée |
|-------|--------|-------------|-------|
| 1 | Lancer `.\release.bat` | - | 1 sec |
| 2 | Choisir type de version | Manuel | 5 sec |
| 3 | Build Tauri | ✅ Auto | 2-3 min |
| 4 | Signature exécutable | ✅ Auto (mot de passe requis) | 10 sec |
| 5 | Générer latest.json | ✅ Auto | 5 sec |
| 6 | Git commit/tag/push | ✅ Auto | 10 sec |
| 7 | Créer release GitHub | ✅ Auto (si token) | 30 sec |
| 8 | Upload fichiers | ✅ Auto (si token) ou Manuel | 1 min |
| **Total** | | | **4-5 min** |

---

## ❓ Questions Fréquentes

### Q1 : Que faire si j'ai oublié mon mot de passe de clé privée ?

**Réponse :** Vous devrez regénérer une nouvelle paire de clés.

```bash
npm run tauri signer generate
```

Puis mettez à jour la clé publique dans `src-tauri/tauri.conf.json`.

⚠️ **Attention :** Les utilisateurs avec l'ancienne version ne pourront plus mettre à jour. Il faudra publier une version majeure.

---

### Q2 : Le script ne trouve pas la clé privée

**Erreur :**
```
[X] Cle privee introuvable: C:\Users\Yoanb\.tauri\formalyse.key
```

**Solution :**
Vérifiez que le fichier existe :
```powershell
Test-Path "$env:USERPROFILE\.tauri\formalyse.key"
```

Si `False`, regénérez la clé (voir Q1).

---

### Q3 : Comment annuler une release ?

**Si la release n'est pas encore publiée :**
1. Allez sur GitHub Releases
2. Cliquez sur "Edit" puis "Delete release"
3. Supprimez le tag :
   ```bash
   git tag -d v2.0.3
   git push origin :refs/tags/v2.0.3
   ```

**Si déjà publiée :**
Publiez une nouvelle version corrective immédiatement.

---

### Q4 : Puis-je sauter une version ?

**Oui !** Utilisez le mode manuel (choix 4) :
```
Entrez la nouvelle version (ex: 2.1.3) : 3.0.0
```

---

### Q5 : Comment publier une beta/prerelease ?

Modifiez temporairement `release.bat` ligne 282 :
```batch
prerelease = $true
```

Ou publiez manuellement sur GitHub en cochant "This is a pre-release".

---

## 🆘 En Cas de Problème

### Erreur de build

```
❌ Build échoué !
```

**Solutions :**
1. Vérifiez que Node.js est à jour : `node --version` (v20.19+ requis)
2. Réinstallez les dépendances : `npm install`
3. Nettoyez le cache : `npm run tauri:build -- --clear`

---

### Erreur de signature

```
[X] Erreur lors de la signature
```

**Solutions :**
1. Vérifiez que la clé existe : `Test-Path "$env:USERPROFILE\.tauri\formalyse.key"`
2. Vérifiez le mot de passe
3. Régénérez la clé si nécessaire

---

### Erreur d'upload GitHub

```
ERROR: 401 Unauthorized
```

**Solutions :**
1. Vérifiez que le token est valide : `echo %GITHUB_TOKEN%`
2. Vérifiez les permissions du token (doit avoir `repo`)
3. Regénérez un nouveau token si expiré

---

## 📚 Fichiers Importants

| Fichier | Rôle | Modifiable |
|---------|------|------------|
| `release.bat` | Script principal de release | ✅ Oui |
| `sign-and-generate-json.ps1` | Signature + latest.json | ⚠️ Non recommandé |
| `latest.json` | Fichier de MAJ (généré) | ❌ Non (auto-généré) |
| `src-tauri/tauri.conf.json` | Config Tauri + version | ⚠️ Version auto-mise à jour |
| `package.json` | Version npm | ⚠️ Version auto-mise à jour |

---

## 🎉 Résumé : Publier en 3 Commandes

```bash
# 1. Lancer le script
.\release.bat

# 2. Choisir le type de version (1/2/3/4)
1

# 3. Entrer le mot de passe de la clé quand demandé
Password: ************

# C'EST TOUT ! 🚀
```

Le reste est 100% automatique ! 🎊

---

## 📞 Support

En cas de problème, consultez :
- `DIAGNOSTIC_AUTOUPDATE_PROBLEMES.md` - Diagnostic des problèmes d'auto-update
- `CONFIGURATION_CLES_SIGNATURE.md` - Configuration des clés
- `PUBLIER_RELEASE_GITHUB.md` - Publication manuelle

Ou contactez le support technique.

