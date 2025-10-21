# 🤖 GitHub Actions - Automatisation des releases

## 🚀 Workflow automatique

Le fichier `release.yml` automatise **complètement** le processus de release :

### Ce qui est automatisé :
1. ✅ Build de l'application (Windows)
2. ✅ Signature de l'installateur
3. ✅ Génération de `latest.json`
4. ✅ Création de la GitHub Release
5. ✅ Upload des fichiers

---

## 📋 Configuration requise (à faire UNE FOIS)

### Étape 1 : Ajouter les secrets GitHub

1. Allez sur : **https://github.com/yoyoboul/formalyse/settings/secrets/actions**

2. Cliquez **"New repository secret"**

3. **Ajoutez ces 2 secrets** :

#### Secret 1 : `TAURI_PRIVATE_KEY`
- **Name** : `TAURI_PRIVATE_KEY`
- **Value** : Le contenu COMPLET de votre fichier `.tauri-updater-key`
  
  Pour obtenir le contenu :
  ```bash
  Get-Content .tauri-updater-key
  ```
  Copiez TOUT le contenu (y compris les lignes de début/fin)

#### Secret 2 : `TAURI_KEY_PASSWORD`
- **Name** : `TAURI_KEY_PASSWORD`
- **Value** : Le mot de passe de votre clé privée

⚠️ **IMPORTANT** : Ces secrets sont stockés de manière sécurisée par GitHub et ne sont jamais exposés !

---

## 🎯 Utilisation (super simple !)

### Pour créer une nouvelle release :

```bash
# 1. Modifiez la version dans package.json et tauri.conf.json
# 2. Commitez vos changements
git add -A
git commit -m "chore: bump version to 1.0.1"

# 3. Créez et poussez un tag
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

**C'EST TOUT !** 🎉

GitHub Actions fait automatiquement :
- Build de l'app
- Signature
- Génération de latest.json
- Création de la release
- Upload des fichiers

---

## 📊 Suivre le build

1. Allez sur : **https://github.com/yoyoboul/formalyse/actions**
2. Cliquez sur le workflow "Release Desktop App"
3. Voyez la progression en temps réel !

**Durée** : ~15-20 minutes

---

## 🎁 Résultat

Une fois terminé, vous aurez automatiquement :

**Sur** : https://github.com/yoyoboul/formalyse/releases/tag/v1.0.1

- ✅ Release créée
- ✅ `Formalyse_1.0.1_x64-setup.exe` uploadé
- ✅ `latest.json` uploadé
- ✅ Notes de release générées automatiquement

**L'auto-update fonctionne immédiatement !** 🚀

---

## 🔄 Workflow complet

```
1. Développez votre app
   ↓
2. Changez la version (package.json + tauri.conf.json)
   ↓
3. Commit + Tag + Push
   ↓
4. GitHub Actions s'occupe de TOUT automatiquement !
   ↓
5. Release publiée
   ↓
6. Les utilisateurs reçoivent la MAJ automatiquement
```

---

## 🌟 Avantages

✅ **Zéro manipulation manuelle**
✅ **Reproductible** (même build à chaque fois)
✅ **Sécurisé** (clés dans secrets GitHub)
✅ **Traçable** (logs complets)
✅ **Rapide** (une simple commande)

---

## 🛠️ Extension future (multi-plateformes)

Pour ajouter macOS et Linux, modifiez simplement :

```yaml
matrix:
  platform: [windows-latest, macos-latest, ubuntu-latest]
```

GitHub Actions buildera pour les 3 plateformes automatiquement ! 🎯

---

## 🆘 Dépannage

### "Workflow not found"
→ Assurez-vous que le fichier est dans `.github/workflows/release.yml`

### "Secret not found"
→ Vérifiez que vous avez bien ajouté les 2 secrets dans les paramètres GitHub

### "Build failed"
→ Consultez les logs dans l'onglet "Actions"

---

**Avec GitHub Actions, publier une release prend 30 secondes !** ⚡

