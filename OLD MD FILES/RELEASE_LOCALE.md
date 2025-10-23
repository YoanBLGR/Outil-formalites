# 🚀 Release Locale - Guide d'Utilisation

Guide pour publier une release **en local** de manière **rapide et semi-automatisée**.

---

## 📋 Deux Options

### Option 1 : Script Batch Simple (recommandé pour débuter)
- ✅ **Simple** - Pas besoin de token GitHub
- ✅ **Rapide** - Build local (2-3 min)
- ⚠️ **Semi-automatique** - Upload manuel des fichiers sur GitHub

### Option 2 : Script PowerShell Avancé (100% automatique)
- ✅ **Totalement automatique** - Tout se fait en une commande
- ✅ **Rapide** - Build local (2-3 min)
- ⚠️ **Nécessite un token GitHub** - Configuration initiale requise

---

## 🎯 Option 1 : Script Batch Automatique

### Configuration (une seule fois)

Pour activer le mode **100% automatique** avec upload :

1. **Double-cliquez** sur `set-token.bat`
2. **Suivez** les instructions pour créer un token GitHub
3. **Entrez** le token
4. **Redémarrez** votre terminal

**C'est tout !** Le token est maintenant configuré de manière permanente.

### Utilisation

1. **Double-cliquez** sur `release.bat`
2. **Choisissez** le type de version (patch/minor/major)
3. **Attendez** 3-4 minutes

**TOUT est fait automatiquement** : build, commit, push, création release, upload ! 🎉

### Mode Manuel (sans token)

Si vous n'avez pas de token GitHub, le script fonctionne quand même :
- Build, commit, push automatiques
- Ouvre le navigateur pour upload manuel des fichiers

### Exemple

```cmd
> release.bat

╔════════════════════════════════════════════════════════════════╗
║          🚀 FORMALYSE - Release Automatique Locale            ║
╚════════════════════════════════════════════════════════════════╝

📌 Quelle version voulez-vous publier ?

   1. Patch (1.0.3 → 1.0.4)  - Correctifs mineurs
   2. Minor (1.0.3 → 1.1.0)  - Nouvelles fonctionnalités
   3. Major (1.0.3 → 2.0.0)  - Changements majeurs

Votre choix (1/2/3) : 1

✅ Type de version : patch
🔄 Incrémentation de la version...
✅ Nouvelle version : 1.0.4

🔨 Build de l'application Tauri...
   ⏱️  Cela peut prendre 2-3 minutes...
   
[... build en cours ...]

✅ Build terminé avec succès !
✅ Installateur trouvé
✅ latest.json créé !
✅ Commit et tag créés !
✅ Poussé sur GitHub !

🌐 Ouverture de la page de release...

📋 Récapitulatif :
   • Version : 1.0.4
   • Fichiers prêts
   • Git : commit + tag + push ✓

🎯 Prochaine étape :
   → Uploadez les fichiers sur GitHub Release (page ouverte)
```

### Avantages

- ✅ **Aucune configuration** nécessaire
- ✅ **Build 2x plus rapide** qu'avec GitHub Actions
- ✅ **Contrôle total** sur chaque étape
- ✅ **Interface visuelle** - Navigateur + Explorateur

---

## ⚡ Option 2 : Script PowerShell Avancé (100% automatique)

### Configuration (une seule fois)

#### 1. Créer un token GitHub

1. Allez sur : https://github.com/settings/tokens/new
2. **Note** : `Formalyse Release Token`
3. **Permissions** :
   - ✅ `repo` (Full control)
   - ✅ `write:packages` (Upload)
4. **Cliquez** "Generate token"
5. **Copiez** le token (commence par `ghp_...`)

#### 2. Configurer le token

**Méthode 1 : Variable d'environnement (recommandé)**

```powershell
# Ajouter à votre profil PowerShell
$env:GITHUB_TOKEN = "ghp_votre_token_ici"

# Pour le rendre permanent
[System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'ghp_votre_token_ici', 'User')
```

**Méthode 2 : Passer en paramètre**

```powershell
.\release-auto.ps1 -GitHubToken "ghp_votre_token_ici"
```

### Utilisation

#### Mode Simple (avec prompts)

```powershell
.\release-auto.ps1
```

Le script vous demandera :
1. Type de version (patch/minor/major)
2. Confirmation

#### Mode Direct (sans prompt)

```powershell
# Patch
.\release-auto.ps1 -VersionType patch

# Minor
.\release-auto.ps1 -VersionType minor

# Major
.\release-auto.ps1 -VersionType major
```

### Exemple

```powershell
> .\release-auto.ps1 -VersionType patch

╔════════════════════════════════════════════════════════════════╗
║  🔐 Vérification du token GitHub
╚════════════════════════════════════════════════════════════════╝

✅ Token GitHub détecté

╔════════════════════════════════════════════════════════════════╗
║  📌 Choix de la version
╚════════════════════════════════════════════════════════════════╝

✅ Type de version : patch

╔════════════════════════════════════════════════════════════════╗
║  🔄 Incrémentation de la version
╚════════════════════════════════════════════════════════════════╝

✅ Nouvelle version : 1.0.4

╔════════════════════════════════════════════════════════════════╗
║  🔨 Build de l'application Tauri
╚════════════════════════════════════════════════════════════════╝

ℹ️  ⏱️  Cela peut prendre 2-3 minutes...

[... build ...]

✅ Build terminé avec succès !

╔════════════════════════════════════════════════════════════════╗
║  📦 Vérification des fichiers
╚════════════════════════════════════════════════════════════════╝

✅ Installateur trouvé
✅ MSI trouvé

╔════════════════════════════════════════════════════════════════╗
║  📝 Génération de latest.json
╚════════════════════════════════════════════════════════════════╝

✅ latest.json créé !

╔════════════════════════════════════════════════════════════════╗
║  📦 Commit et tag Git
╚════════════════════════════════════════════════════════════════╝

✅ Commit et tag créés !

╔════════════════════════════════════════════════════════════════╗
║  🌐 Push sur GitHub
╚════════════════════════════════════════════════════════════════╝

✅ Poussé sur GitHub !

╔════════════════════════════════════════════════════════════════╗
║  🎁 Création de la release GitHub (automatique)
╚════════════════════════════════════════════════════════════════╝

ℹ️  Création de la release...
✅ Release créée : https://github.com/yoyoboul/formalyse/releases/tag/v1.0.4

ℹ️  Upload de l'installateur...
✅ Installateur uploadé : Formalyse_1.0.4_x64-setup.exe

ℹ️  Upload de latest.json...
✅ latest.json uploadé

ℹ️  Upload du MSI...
✅ MSI uploadé : Formalyse_1.0.4_x64_en-US.msi

╔════════════════════════════════════════════════════════════════╗
║                    ✅ Release publiée !                        ║
╚════════════════════════════════════════════════════════════════╝

📋 Récapitulatif :
   • Version : 1.0.4
   • Build : ✓
   • Git : ✓
   • Release GitHub : ✓
   • Upload automatique : ✓

🌐 Voir la release : https://github.com/yoyoboul/formalyse/releases/tag/v1.0.4

🎯 Les utilisateurs vont recevoir la notification de mise à jour automatiquement !
```

### Avantages

- ✅ **100% automatique** - Zero intervention
- ✅ **Build ultra rapide** - 2-3 min vs 7-10 min
- ✅ **Upload automatique** - Pas besoin du navigateur
- ✅ **Une seule commande** - `.\release-auto.ps1 -VersionType patch`
- ✅ **Traçabilité** - Logs détaillés de chaque étape

---

## 📊 Comparaison

| Critère | GitHub Actions | Batch Simple | PowerShell Auto |
|---------|---------------|--------------|-----------------|
| **Temps total** | 7-10 min | 3-5 min | 2-3 min |
| **Configuration** | ✅ Aucune | ✅ Aucune | ⚠️ Token GitHub |
| **Automatisation** | 100% | 80% | 100% |
| **Upload fichiers** | ✅ Auto | ⚠️ Manuel | ✅ Auto |
| **Build local** | ❌ Non | ✅ Oui | ✅ Oui |
| **Contrôle** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Quelle option choisir ?

### Utilisez **GitHub Actions** si :
- ✅ Vous n'êtes pas pressé
- ✅ Vous ne voulez **rien installer**
- ✅ Vous voulez que tout soit **dans le cloud**

### Utilisez **Batch Simple** si :
- ✅ Vous voulez **commencer simplement**
- ✅ Vous n'avez **pas de token GitHub**
- ✅ Build rapide + upload manuel vous convient

### Utilisez **PowerShell Auto** si :
- ✅ Vous publiez **fréquemment**
- ✅ Vous voulez la **vitesse maximale**
- ✅ Vous voulez **zéro intervention manuelle**

---

## 🔧 Dépannage

### "npm version échoue"

**Cause** : Modifications non commitées

**Solution** :
```bash
git add .
git commit -m "Préparation release"
```

### "Build échoue"

**Cause** : Dépendances manquantes

**Solution** :
```bash
npm install
```

### "Token GitHub invalide"

**Cause** : Token expiré ou permissions insuffisantes

**Solution** :
1. Créez un nouveau token : https://github.com/settings/tokens
2. Permissions nécessaires : `repo` + `write:packages`

### "Upload échoue (PowerShell Auto)"

**Cause** : Fichier trop gros ou connexion

**Solution** :
- Vérifiez votre connexion internet
- Réessayez
- Utilisez le mode manuel en dernier recours

---

## 💡 Astuces

### Workflow Recommandé

1. **Développez** vos fonctionnalités
2. **Testez** localement : `npm run tauri:dev`
3. **Publiez** : `.\release-auto.ps1 -VersionType patch`
4. **Profitez** ☕

### Alias PowerShell

Ajoutez à votre profil PowerShell :

```powershell
function release-patch { .\release-auto.ps1 -VersionType patch }
function release-minor { .\release-auto.ps1 -VersionType minor }
function release-major { .\release-auto.ps1 -VersionType major }
```

Puis utilisez simplement :
```powershell
> release-patch   # 1.0.3 → 1.0.4
> release-minor   # 1.0.3 → 1.1.0
> release-major   # 1.0.3 → 2.0.0
```

---

## 📚 Ressources

- **Guide Auto-Update** : [AUTOUPDATE_GUIDE.md](AUTOUPDATE_GUIDE.md)
- **GitHub API** : https://docs.github.com/en/rest/releases
- **Tauri Build** : https://v2.tauri.app/develop/build/

---

**Happy Releasing! 🚀**

