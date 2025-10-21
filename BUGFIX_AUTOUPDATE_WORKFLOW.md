# 🐛 Correctif : Workflow Auto-Update GitHub Actions

**Date :** 21 octobre 2025  
**Statut :** ✅ Corrigé

---

## 🎯 Problème identifié

Le workflow GitHub Actions affichait **"latest.json créé avec succès"** mais échouait avec **exit code 1**.

### Cause racine

PowerShell par défaut **continue l'exécution** même si une commande échoue, masquant ainsi les erreurs réelles.

**Commande qui échouait silencieusement :**
```powershell
npx @tauri-apps/cli signer sign ... # Échec de signature
# Script continue quand même
Write-Host "latest.json créé avec succès" # Message affiché malgré l'erreur
```

---

## ✅ Corrections appliquées

### 1. **`.github/workflows/release.yml`** - Workflow CI/CD amélioré

#### Changements principaux :

✅ **Gestion stricte des erreurs**
```powershell
$ErrorActionPreference = "Stop"  # Arrêt immédiat si erreur
```

✅ **Vérification de l'existence du fichier**
```powershell
if (-not (Test-Path $exePath)) {
  Write-Error "Fichier introuvable: $exePath"
  exit 1
}
```

✅ **Bloc try/catch/finally**
```powershell
try {
  $signatureOutput = npx ... 2>&1 | Out-String
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
  Remove-Item $keyPath -Force  # Nettoyage garanti
}
```

✅ **Encodage UTF-8 sans BOM**
```powershell
# Avant
Out-File -FilePath $keyPath -Encoding UTF8  # Peut créer BOM

# Après
Out-File -FilePath $keyPath -Encoding utf8NoBOM -NoNewline  # Sans BOM
```

✅ **Validation de la signature**
```powershell
$signature = ($signatureOutput -split "`n" | Where-Object { $_.Trim() -ne "" })[-1].Trim()

if ([string]::IsNullOrWhiteSpace($signature)) {
  Write-Error "Signature vide ou invalide"
  exit 1
}
```

✅ **Logs détaillés pour debug**
```powershell
Write-Host "Version détectée: $version" -ForegroundColor Cyan
Write-Host "Installateur trouvé: $exePath" -ForegroundColor Green
Write-Host "Sortie complète de la signature:" -ForegroundColor Cyan
Write-Host $signatureOutput
Write-Host "Signature extraite: $signature" -ForegroundColor Green
Write-Host "Contenu de latest.json:" -ForegroundColor Cyan
Get-Content "latest.json" | Write-Host
```

---

### 2. **`generate-latest-json.ps1`** - Script local synchronisé

**Mêmes améliorations** que le workflow pour cohérence :
- Gestion d'erreur stricte
- Validation de signature
- Encodage utf8NoBOM
- Logs détaillés

---

### 3. **`TROUBLESHOOTING_AUTOUPDATE.md`** - Guide de dépannage

Nouveau document créé avec :
- Diagnostic étape par étape
- Solutions aux erreurs courantes
- Tests recommandés
- Checklist de dépannage

---

## 🔍 Différences avant/après

### ❌ Avant

```powershell
# Pas de gestion d'erreur
$signatureOutput = npx ... 2>&1
# Pas de vérification du code de sortie
$signature = ($signatureOutput -split "`n")[-1].Trim()
# Pas de validation de la signature
```

**Résultat :** Erreurs masquées, signature potentiellement vide

---

### ✅ Après

```powershell
$ErrorActionPreference = "Stop"

try {
  $signatureOutput = npx ... 2>&1 | Out-String
  
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec"
    exit 1
  }
  
  Write-Host $signatureOutput  # Debug
}
catch {
  Write-Error "Erreur: $_"
  exit 1
}

$signature = ($signatureOutput -split "`n" | Where-Object { $_.Trim() -ne "" })[-1].Trim()

if ([string]::IsNullOrWhiteSpace($signature)) {
  Write-Error "Signature invalide"
  exit 1
}

Write-Host "Signature: $signature"  # Confirmation
```

**Résultat :** Erreurs détectées immédiatement, logs clairs

---

## 🧪 Comment tester les corrections

### Méthode 1 : Tag de test (recommandé)

```bash
# 1. Assurez-vous que les versions sont à jour
# package.json et tauri.conf.json

# 2. Créez un tag de test
git tag v1.0.2-test
git push origin v1.0.2-test

# 3. Surveillez le workflow
# https://github.com/yoyoboul/formalyse/actions

# 4. Consultez les nouveaux logs détaillés

# 5. Si succès, supprimez le tag de test
git tag -d v1.0.2-test
git push origin :refs/tags/v1.0.2-test

# 6. Créez le vrai tag
git tag v1.0.2
git push origin v1.0.2
```

---

### Méthode 2 : Test local d'abord

```powershell
# 1. Build
npm run tauri:build

# 2. Générez latest.json avec le script amélioré
.\generate-latest-json.ps1 -Version "1.0.2" -KeyPassword "VOTRE_PASSWORD"

# 3. Vérifiez le résultat
Get-Content latest.json | ConvertFrom-Json

# 4. Si OK, poussez le tag
git tag v1.0.2
git push origin v1.0.2
```

---

## 📊 Nouveaux logs dans GitHub Actions

Avec les corrections, vous verrez maintenant :

```
✓ Version détectée: 1.0.2
✓ Installateur trouvé: src-tauri\target\release\bundle\nsis\Formalyse_1.0.2_x64-setup.exe
⏳ Signature de l'installateur en cours...

Sortie complète de la signature:
[sortie détaillée de npx...]

✓ Signature extraite: dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHNpZ25...

========================================
latest.json créé avec succès !
========================================

Contenu de latest.json:
{
  "version": "1.0.2",
  "notes": "Release version 1.0.2",
  "pub_date": "2025-10-21T14:30:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ...",
      "url": "https://github.com/yoyoboul/formalyse/releases/download/v1.0.2/Formalyse_1.0.2_x64-setup.exe"
    }
  }
}
```

---

## ⚡ Erreurs maintenant détectées

Avec ces corrections, les erreurs suivantes seront **immédiatement détectées et affichées** :

1. ❌ Fichier .exe introuvable → **Message clair + exit**
2. ❌ Échec de signature → **Code de sortie + logs + exit**
3. ❌ Signature vide → **Validation + exit**
4. ❌ Clé privée corrompue → **Erreur explicite**
5. ❌ Mot de passe incorrect → **Erreur de signature**

---

## 🔐 Rappel : Vérification des secrets GitHub

Avant de tester, assurez-vous que les secrets sont bien configurés :

**URL :** https://github.com/yoyoboul/formalyse/settings/secrets/actions

**Secrets requis :**

1. **`TAURI_PRIVATE_KEY`**
   ```powershell
   # Pour copier dans le presse-papier
   Get-Content .tauri-updater-key | Set-Clipboard
   ```
   Puis coller dans GitHub (TOUT le contenu, y compris "untrusted comment")

2. **`TAURI_KEY_PASSWORD`**
   Le mot de passe que vous avez choisi lors de `setup-autoupdate.bat`

---

## 📋 Checklist avant la prochaine release

- [ ] Versions synchronisées (package.json + tauri.conf.json)
- [ ] Secrets GitHub configurés
- [ ] Test local du build : `npm run tauri:build`
- [ ] Test local de signature : `.\generate-latest-json.ps1`
- [ ] Tag de test créé : `v1.0.2-test`
- [ ] Workflow réussi sur le tag de test
- [ ] Logs détaillés vérifiés
- [ ] Signature non vide confirmée
- [ ] Tag de test supprimé
- [ ] Vrai tag créé et poussé
- [ ] Release publiée automatiquement
- [ ] Auto-update testé sur une vieille version

---

## 🎉 Résultat attendu

Avec ces corrections, le workflow devrait maintenant :

✅ Détecter les erreurs **immédiatement**  
✅ Afficher des **logs clairs et détaillés**  
✅ Échouer **proprement** avec messages explicites  
✅ Réussir **sans erreur** si tout est correct  
✅ Créer une **release fonctionnelle** automatiquement  

---

## 📚 Documentation mise à jour

1. **`TROUBLESHOOTING_AUTOUPDATE.md`** ← Nouveau guide de dépannage
2. **`AUTOUPDATE_GUIDE.md`** ← Guide existant (toujours valide)
3. **`RELEASE_AUTOMATIQUE.md`** ← Guide GitHub Actions (toujours valide)
4. **`BUGFIX_AUTOUPDATE_WORKFLOW.md`** ← Ce document

---

## 🚀 Prochaines étapes

1. **Testez avec un tag de test** pour valider les corrections
2. **Consultez les nouveaux logs** pour confirmer que tout fonctionne
3. **Créez une vraie release** une fois le test réussi
4. **Vérifiez l'auto-update** sur une ancienne version de l'app

---

**Les corrections sont en place ! Le workflow est maintenant robuste et debuggable.** ✨

Si des erreurs persistent, consultez `TROUBLESHOOTING_AUTOUPDATE.md` pour des diagnostics détaillés.

