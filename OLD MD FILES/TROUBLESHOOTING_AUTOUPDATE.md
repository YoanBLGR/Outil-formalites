# 🔧 Dépannage Auto-Update - Formalyse

Guide de résolution des problèmes liés au système de mise à jour automatique.

---

## 🐛 Problème : "Error: Process completed with exit code 1"

### Symptômes

Le workflow GitHub Actions affiche :
```
latest.json créé avec succès
Error: Process completed with exit code 1.
```

### Cause

Le script PowerShell continue même si une commande échoue (par défaut). Le message de succès s'affiche même si la signature a échoué plus tôt.

**Commandes qui peuvent échouer silencieusement :**
1. `npx @tauri-apps/cli signer sign` - Signature de l'installateur
2. Extraction de la signature vide/invalide
3. Problème d'encodage de la clé privée (BOM UTF-8)

### ✅ Solution implémentée

**Changements dans `.github/workflows/release.yml` :**

1. **Ajout de `$ErrorActionPreference = "Stop"`**
   - Arrête le script immédiatement en cas d'erreur
   
2. **Vérification de l'existence du fichier .exe**
   ```powershell
   if (-not (Test-Path $exePath)) {
     Write-Error "Fichier introuvable: $exePath"
     exit 1
   }
   ```

3. **Gestion d'erreur explicite avec try/catch**
   ```powershell
   try {
     $signatureOutput = npx --yes @tauri-apps/cli signer sign ...
     if ($LASTEXITCODE -ne 0) {
       Write-Error "Échec de la signature"
       exit 1
     }
   }
   catch {
     Write-Error "Erreur: $_"
     exit 1
   }
   finally {
     Remove-Item $keyPath -Force
   }
   ```

4. **Encodage UTF-8 sans BOM**
   ```powershell
   # Avant
   Out-File -FilePath $keyPath -Encoding UTF8
   
   # Après
   Out-File -FilePath $keyPath -Encoding utf8NoBOM -NoNewline
   ```

5. **Vérification de la signature**
   ```powershell
   if ([string]::IsNullOrWhiteSpace($signature)) {
     Write-Error "Signature vide ou invalide"
     exit 1
   }
   ```

6. **Logs détaillés**
   - Affiche la sortie complète de la commande de signature
   - Affiche le contenu de `latest.json` généré
   - Messages colorés pour faciliter le debug

---

## 🔍 Diagnostic étape par étape

### Étape 1 : Vérifier les secrets GitHub

**URL :** https://github.com/yoyoboul/formalyse/settings/secrets/actions

**Secrets requis :**
- ✅ `TAURI_PRIVATE_KEY` : Contenu COMPLET de `.tauri-updater-key`
- ✅ `TAURI_KEY_PASSWORD` : Mot de passe de la clé privée

**Comment vérifier :**
```powershell
# Afficher le contenu de la clé (en local)
Get-Content .tauri-updater-key

# Assurez-vous que tout est copié, y compris :
# - "untrusted comment: ..."
# - Toutes les lignes de la clé
```

### Étape 2 : Vérifier les versions

**Fichiers à synchroniser :**
1. `package.json` → `"version": "X.Y.Z"`
2. `src-tauri/tauri.conf.json` → `"version": "X.Y.Z"`
3. Tag Git → `vX.Y.Z`

**Vérification :**
```bash
# Le tag doit correspondre à la version
git tag -l
```

### Étape 3 : Consulter les logs GitHub Actions

**URL :** https://github.com/yoyoboul/formalyse/actions

**Ce qu'il faut regarder :**

1. **Build Tauri app** - Vérifier que le build réussit
   ```
   ✓ Finished release [optimized] target(s) in 5m 30s
   ```

2. **Sign and generate latest.json** - Nouvelle sortie détaillée :
   ```
   Version détectée: 1.0.1
   Installateur trouvé: src-tauri\target\release\bundle\nsis\Formalyse_1.0.1_x64-setup.exe
   Signature de l'installateur en cours...
   Sortie complète de la signature:
   [sortie de npx...]
   Signature extraite: dW50cnVzdGVkIGNvbW1lbnQ6...
   ========================================
   latest.json créé avec succès !
   ========================================
   
   Contenu de latest.json:
   {
     "version": "1.0.1",
     ...
   }
   ```

3. **Create GitHub Release** - Vérifier l'upload
   ```
   ✓ Uploading Formalyse_1.0.1_x64-setup.exe
   ✓ Uploading latest.json
   ```

### Étape 4 : Tester en local

**Avant de pousser un tag, testez localement :**

```powershell
# 1. Build
npm run tauri:build

# 2. Générer latest.json
.\generate-latest-json.ps1 -Version "1.0.1" -KeyPassword "VOTRE_MOT_DE_PASSE"

# 3. Vérifier latest.json
Get-Content latest.json | ConvertFrom-Json
```

**Vérifications :**
- ✅ `version` correspond
- ✅ `signature` n'est pas vide
- ✅ `url` pointe vers le bon fichier GitHub
- ✅ `pub_date` est au format ISO 8601

---

## ⚠️ Erreurs courantes

### Erreur 1 : "Fichier introuvable"

**Message :**
```
Fichier introuvable: src-tauri\target\release\bundle\nsis\Formalyse_X.Y.Z_x64-setup.exe
```

**Cause :** La version dans le tag ne correspond pas à la version buildée

**Solution :**
1. Vérifiez `src-tauri/tauri.conf.json` → version
2. Rebuild avec la bonne version : `npm run tauri:build`
3. Le tag doit correspondre : `v1.0.1` → version `1.0.1`

---

### Erreur 2 : "Échec de la signature"

**Message :**
```
Échec de la signature. Code de sortie: 1
```

**Causes possibles :**
1. ❌ Mot de passe incorrect (`TAURI_KEY_PASSWORD`)
2. ❌ Clé privée corrompue ou incomplète
3. ❌ Problème d'encodage (BOM)

**Solutions :**
1. Vérifiez le secret `TAURI_KEY_PASSWORD` sur GitHub
2. Régénérez la clé avec `setup-autoupdate.bat`
3. Recopiez **TOUT** le contenu de `.tauri-updater-key` dans le secret

---

### Erreur 3 : "Signature vide ou invalide"

**Message :**
```
Signature vide ou invalide
```

**Cause :** La commande `npx signer sign` a échoué, mais le script a essayé d'extraire une signature

**Solution :**
Consultez la sortie complète de la signature dans les logs pour voir l'erreur exacte.

---

### Erreur 4 : "optional pre-release identifier must be numeric-only" (MSI)

**Message :**
```
failed to bundle project `optional pre-release identifier in app version must be numeric-only and cannot be greater than 65535 for msi target`
```

**Cause :** Le bundler MSI Windows n'accepte PAS les versions avec suffixe non-numérique

**Exemples :**
- ❌ `1.0.2-test` → INVALIDE (contient des lettres)
- ❌ `1.0.2-beta` → INVALIDE (contient des lettres)
- ❌ `1.0.2-rc1` → INVALIDE (mélange)
- ✅ `1.0.2` → VALIDE (pas de suffixe)
- ✅ `1.0.2-1` → VALIDE (numérique uniquement)

**Solution :**
1. Changez la version dans `package.json` et `tauri.conf.json`
2. Utilisez soit une version sans suffixe, soit un suffixe numérique
3. Recommit et recréez le tag

```bash
# Supprimer l'ancien tag
git tag -d v1.0.2-test
git push origin :refs/tags/v1.0.2-test

# Corriger la version → 1.0.2 ou 1.0.2-1
# Puis recreate le tag
git add package.json src-tauri/tauri.conf.json
git commit -m "fix: version compatible MSI"
git tag v1.0.2
git push origin main
git push origin v1.0.2
```

---

### Erreur 5 : "Permission denied" (GitHub Release)

**Message :**
```
Error: Resource not accessible by integration
```

**Cause :** Le workflow n'a pas les permissions pour créer une release

**Solution :**
Le workflow inclut déjà :
```yaml
permissions:
  contents: write
```

Si le problème persiste :
1. Allez dans **Settings** → **Actions** → **General**
2. Sous "Workflow permissions", sélectionnez **"Read and write permissions"**

---

## 🧪 Tests recommandés

### Test 1 : Signature locale

```powershell
npx @tauri-apps/cli signer sign `
  "src-tauri\target\release\bundle\nsis\Formalyse_1.0.1_x64-setup.exe" `
  --private-key ".tauri-updater-key" `
  --password "VOTRE_MOT_DE_PASSE"
```

**Attendu :** Une longue chaîne base64 (la signature)

---

### Test 2 : Workflow test tag

Créez un tag de test :
```bash
git tag v1.0.1-test
git push origin v1.0.1-test
```

Cela déclenche le workflow sans impacter les utilisateurs.

**Après succès :** Supprimez le tag
```bash
git tag -d v1.0.1-test
git push origin :refs/tags/v1.0.1-test
```

---

### Test 3 : Vérification du latest.json

**Téléchargez depuis GitHub :**
```powershell
Invoke-WebRequest -Uri "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json" -OutFile "test-latest.json"
Get-Content test-latest.json | ConvertFrom-Json
```

**Vérifiez :**
- ✅ Version correcte
- ✅ Signature présente
- ✅ URL accessible

---

## 📊 Checklist de dépannage

Quand un workflow échoue :

- [ ] Vérifier que les secrets sont bien configurés
- [ ] Vérifier la correspondance des versions (package.json / tauri.conf.json / tag)
- [ ] Consulter les logs détaillés dans GitHub Actions
- [ ] Tester la signature en local
- [ ] Vérifier que le fichier .exe a bien été généré
- [ ] Vérifier l'encodage de la clé (sans BOM)
- [ ] Tester avec un tag de test avant de faire une vraie release

---

## 🎯 Workflow de release sécurisé

Pour éviter les problèmes :

```bash
# 1. Mettre à jour les versions
# - package.json
# - src-tauri/tauri.conf.json

# 2. Tester le build en local
npm run tauri:build

# 3. Tester la signature en local
.\generate-latest-json.ps1 -Version "1.0.1" -KeyPassword "PASSWORD"

# 4. Vérifier latest.json
Get-Content latest.json

# 5. Si tout est OK, commit et tag
git add -A
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1

# 6. Surveiller le workflow
# https://github.com/yoyoboul/formalyse/actions

# 7. Vérifier la release
# https://github.com/yoyoboul/formalyse/releases
```

---

## 📚 Ressources

- **GitHub Actions Logs :** https://github.com/yoyoboul/formalyse/actions
- **Releases :** https://github.com/yoyoboul/formalyse/releases
- **Tauri Updater Docs :** https://v2.tauri.app/plugin/updater/
- **Tauri Signer Docs :** https://v2.tauri.app/reference/cli/#signer

---

## ✅ Changements appliqués (résumé)

| Fichier | Changement | Raison |
|---------|------------|--------|
| `.github/workflows/release.yml` | `$ErrorActionPreference = "Stop"` | Arrêt immédiat en cas d'erreur |
| `.github/workflows/release.yml` | Try/catch autour de la signature | Meilleure gestion d'erreur |
| `.github/workflows/release.yml` | `utf8NoBOM` pour clé et JSON | Éviter problèmes d'encodage |
| `.github/workflows/release.yml` | Vérifications multiples | Détecter erreurs plus tôt |
| `.github/workflows/release.yml` | Logs détaillés | Faciliter le debug |
| `generate-latest-json.ps1` | Mêmes améliorations | Cohérence local/CI |

---

**Prochaine release : testez avec un tag de test d'abord !** 🚀

