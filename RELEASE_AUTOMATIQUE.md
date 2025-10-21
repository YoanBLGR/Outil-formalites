# 🤖 Release Automatique avec GitHub Actions

Guide complet pour automatiser vos releases avec CI/CD.

---

## ✨ Qu'est-ce qui est automatisé ?

Quand vous poussez un tag `v1.0.1`, GitHub Actions fait **AUTOMATIQUEMENT** :

```
1. ✅ Checkout du code
2. ✅ Installation de Node.js et Rust
3. ✅ Installation des dépendances npm
4. ✅ Build de production (Tauri)
5. ✅ Signature de l'installateur
6. ✅ Génération de latest.json
7. ✅ Création de la GitHub Release
8. ✅ Upload de l'installateur et latest.json
9. ✅ Génération des notes de release
```

**Tout ça en UNE seule commande !** 🎉

---

## 🔧 Configuration initiale (à faire UNE FOIS)

### Étape 1 : Ajouter les secrets GitHub

Les secrets permettent à GitHub Actions d'accéder à votre clé privée de manière sécurisée.

#### 1.1 Allez sur les paramètres des secrets

**URL** : https://github.com/yoyoboul/formalyse/settings/secrets/actions

#### 1.2 Ajoutez le premier secret : `TAURI_PRIVATE_KEY`

1. Cliquez **"New repository secret"**
2. **Name** : `TAURI_PRIVATE_KEY`
3. **Value** : Le contenu de `.tauri-updater-key`

**Pour obtenir le contenu** (PowerShell) :
```powershell
Get-Content .tauri-updater-key | Set-Clipboard
```
Puis collez (Ctrl+V) dans le champ "Value"

⚠️ **Important** : Copiez TOUT le contenu, y compris :
```
untrusted comment: ...
...
(tout le contenu)
```

#### 1.3 Ajoutez le second secret : `TAURI_KEY_PASSWORD`

1. Cliquez **"New repository secret"**
2. **Name** : `TAURI_KEY_PASSWORD`
3. **Value** : Votre mot de passe de clé privée

(Le mot de passe que vous avez choisi lors de `setup-autoupdate.bat`)

### ✅ Configuration terminée !

Vous n'aurez plus jamais à refaire cette étape.

---

## 🚀 Créer une release (3 commandes)

### Workflow standard

```bash
# 1. Modifiez la version dans package.json et tauri.conf.json
#    (ou utilisez release.bat qui le fait automatiquement)

# 2. Commitez
git add -A
git commit -m "chore: bump version to 1.0.1"

# 3. Créez et poussez le tag
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

**C'EST TOUT !** ✨

GitHub Actions démarre automatiquement et fait le reste.

---

## 📊 Suivre la progression

### En temps réel

1. Allez sur : **https://github.com/yoyoboul/formalyse/actions**
2. Vous verrez le workflow "Release Desktop App" en cours
3. Cliquez dessus pour voir les détails

### Étapes visibles

```
✓ Checkout repository
✓ Setup Node.js
✓ Install Rust stable
✓ Install dependencies
⏳ Build Tauri app (5-10 min)
⏳ Sign and generate latest.json
⏳ Create GitHub Release
```

**Durée totale** : ~15-20 minutes

---

## 🎁 Résultat automatique

### Une fois le workflow terminé :

**Sur** : https://github.com/yoyoboul/formalyse/releases

Vous aurez automatiquement :

✅ **Release créée** avec :
- Tag : `v1.0.1`
- Title : `v1.0.1`
- Notes de release (générées depuis les commits)

✅ **Fichiers uploadés** :
- `Formalyse_1.0.1_x64-setup.exe`
- `latest.json` (avec signature)

✅ **Auto-update activé** !

Les utilisateurs reçoivent instantanément la notification de mise à jour.

---

## 🎯 Workflow complet visualisé

```
┌─────────────────────────────────────────┐
│ 1. Développement local                  │
│    - Modifiez votre code                │
│    - Testez avec: npm run tauri:dev     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 2. Bump version                         │
│    - package.json: "version": "1.0.1"   │
│    - tauri.conf.json: "version": "1.0.1"│
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 3. Git commit + tag + push              │
│    git commit -m "v1.0.1"               │
│    git tag v1.0.1                       │
│    git push origin main                 │
│    git push origin v1.0.1               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 4. GitHub Actions (AUTOMATIQUE)         │
│    ✓ Clone du repo                      │
│    ✓ Setup environnement                │
│    ✓ Build                               │
│    ✓ Signature                           │
│    ✓ Génération latest.json             │
│    ✓ Création release                   │
│    ✓ Upload fichiers                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 5. Release publiée !                    │
│    Users receive auto-update ✨         │
└─────────────────────────────────────────┘
```

---

## 📝 Script simplifié (optionnel)

Créez `quick-release.bat` pour encore plus de simplicité :

```batch
@echo off
set /p VERSION="Version (ex: 1.0.1): "

REM Bump version
call npm version %VERSION% --no-git-tag-version

REM Update tauri.conf.json
powershell -Command "(Get-Content src-tauri\tauri.conf.json) -replace '\"version\": \".*\"', '\"version\": \"%VERSION%\"' | Set-Content src-tauri\tauri.conf.json"

REM Git commit + tag + push
git add -A
git commit -m "chore: release v%VERSION%"
git tag v%VERSION%
git push origin main
git push origin v%VERSION%

echo.
echo ✅ Tag v%VERSION% poussé !
echo GitHub Actions va créer la release automatiquement.
echo Suivez sur : https://github.com/yoyoboul/formalyse/actions
pause
```

**Usage** :
```bash
quick-release.bat
# Entrez: 1.0.1
# C'est tout !
```

---

## 🌍 Extension multi-plateformes

### Actuellement : Windows uniquement

Pour ajouter **macOS** et **Linux**, modifiez `.github/workflows/release.yml` :

```yaml
matrix:
  platform: [windows-latest, macos-latest, ubuntu-latest]
```

GitHub Actions buildera pour les 3 plateformes en parallèle ! 🚀

**Résultat** :
- `Formalyse_1.0.1_x64-setup.exe` (Windows)
- `Formalyse_1.0.1_x64.dmg` (macOS)
- `formalyse_1.0.1_amd64.deb` (Linux)
- `latest.json` (multi-plateformes)

---

## 🔐 Sécurité

### Les secrets GitHub sont :

✅ **Chiffrés** au repos
✅ **Jamais exposés** dans les logs
✅ **Accessibles uniquement** pendant le workflow
✅ **Révocables** à tout moment

### Bonnes pratiques

1. ✅ Ne commitez JAMAIS `.tauri-updater-key`
2. ✅ Utilisez TOUJOURS les secrets GitHub
3. ✅ Changez le mot de passe si compromis
4. ✅ Limitez l'accès au repo

---

## 🆘 Dépannage

### "Workflow doesn't run"

**Cause** : Fichier mal placé ou syntaxe YAML incorrecte

**Solution** :
1. Vérifiez que le fichier est dans `.github/workflows/release.yml`
2. Vérifiez la syntaxe YAML (indentation, etc.)
3. Allez dans "Actions" > "Enable workflows" si désactivé

### "Secret not found"

**Cause** : Secrets non configurés

**Solution** :
1. Allez sur : https://github.com/yoyoboul/formalyse/settings/secrets/actions
2. Vérifiez que `TAURI_PRIVATE_KEY` et `TAURI_KEY_PASSWORD` existent
3. Recréez-les si nécessaire

### "Build failed"

**Cause** : Erreur de compilation ou dépendances manquantes

**Solution** :
1. Consultez les logs dans "Actions"
2. Testez localement : `npm run tauri:build`
3. Corrigez l'erreur et recommitez

### "Signature invalid"

**Cause** : Clé privée ou mot de passe incorrect

**Solution** :
1. Vérifiez le secret `TAURI_PRIVATE_KEY` (contenu complet)
2. Vérifiez le secret `TAURI_KEY_PASSWORD`
3. Testez localement avec `generate-latest-json.ps1`

---

## 📊 Comparaison : Manuel vs Automatique

| Étape | Manuel | Automatique (GitHub Actions) |
|-------|--------|------------------------------|
| Bump version | ✋ Manuel | 🤖 Script |
| Build | ⏱️ 15-20 min local | ⏱️ 15-20 min cloud |
| Signature | ✋ Commande PS | 🤖 Automatique |
| latest.json | ✋ Script | 🤖 Automatique |
| Créer release | ✋ Interface GitHub | 🤖 Automatique |
| Upload fichiers | ✋ Drag & drop | 🤖 Automatique |
| **Total temps** | **30-45 min** | **30 secondes** (votre temps) |

---

## ✅ Checklist de configuration

- [ ] Fichier `.github/workflows/release.yml` créé
- [ ] Secret `TAURI_PRIVATE_KEY` ajouté sur GitHub
- [ ] Secret `TAURI_KEY_PASSWORD` ajouté sur GitHub
- [ ] Test avec un tag (ex: `v1.0.1-test`)
- [ ] Workflow réussi
- [ ] Release créée automatiquement
- [ ] Auto-update testé et fonctionnel

---

## 🎉 Conclusion

Avec GitHub Actions :

✨ **Vous tapez** : 3 commandes git
🤖 **GitHub fait** : Tout le reste
⏱️ **Vous gagnez** : 30-40 minutes par release
🎯 **Résultat** : Release professionnelle en 15-20 min

**Fini les releases manuelles fastidieuses !** 🚀

---

## 📚 Ressources

- **GitHub Actions** : https://docs.github.com/actions
- **Tauri Actions** : https://github.com/tauri-apps/tauri-action
- **Secrets** : https://docs.github.com/actions/security-guides/encrypted-secrets

---

**Bon release automatique ! 🎊**

