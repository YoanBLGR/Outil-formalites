# 🔐 Vérification des Secrets GitHub pour Auto-Update

## ❌ Erreur actuelle

```
Erreur lors de la signature: Échec de la signature. Code de sortie: 2
```

**Cause probable** : Les secrets GitHub (`TAURI_PRIVATE_KEY` ou `TAURI_KEY_PASSWORD`) sont incorrects, incomplets ou mal formatés.

---

## ✅ Comment vérifier et reconfigurer les secrets

### Étape 1 : Accéder aux secrets

**URL** : https://github.com/yoyoboul/formalyse/settings/secrets/actions

Vous devez avoir **2 secrets** configurés :
1. `TAURI_PRIVATE_KEY`
2. `TAURI_KEY_PASSWORD`

---

### Étape 2 : Vérifier `TAURI_PRIVATE_KEY`

#### 📋 Obtenir le contenu correct

**Sur votre machine locale**, dans le dossier du projet :

```powershell
# Afficher le contenu complet de la clé
Get-Content .tauri-updater-key

# Copier dans le presse-papier
Get-Content .tauri-updater-key | Set-Clipboard
```

#### ✅ Format attendu

La clé doit ressembler à ceci :

```
untrusted comment: minisign secret key
RWRTY5FlABIGH+...longue chaîne base64...
```

**Important** :
- ✅ Doit commencer par `untrusted comment:`
- ✅ Contient généralement 2 lignes
- ✅ La deuxième ligne est une longue chaîne base64
- ✅ **Copiez TOUT**, y compris les sauts de ligne

#### 🔄 Reconfigurer le secret

1. Allez sur https://github.com/yoyoboul/formalyse/settings/secrets/actions
2. Cliquez sur `TAURI_PRIVATE_KEY`
3. Cliquez "Update secret"
4. Collez le contenu COMPLET (Ctrl+V)
5. Cliquez "Update secret"

---

### Étape 3 : Vérifier `TAURI_KEY_PASSWORD`

#### 🔑 C'est quoi ce mot de passe ?

C'est le mot de passe que vous avez choisi lors de l'exécution de `setup-autoupdate.bat`.

**Si vous ne vous en souvenez plus** :

Option 1 : Régénérer une nouvelle clé
```bash
.\setup-autoupdate.bat
# Choisissez un nouveau mot de passe
# Notez-le quelque part !
```

Option 2 : Chercher dans vos notes/gestionnaire de mots de passe

#### 🔄 Reconfigurer le secret

1. Allez sur https://github.com/yoyoboul/formalyse/settings/secrets/actions
2. Cliquez sur `TAURI_KEY_PASSWORD`
3. Cliquez "Update secret"
4. Entrez le mot de passe
5. Cliquez "Update secret"

---

### Étape 4 : Vérifier localement (optionnel mais recommandé)

Avant de pousser un nouveau tag, testez la signature en local :

```powershell
# Build de l'app
npm run tauri:build

# Test de signature
npx @tauri-apps/cli signer sign `
  "src-tauri\target\release\bundle\nsis\Formalyse_1.0.2_x64-setup.exe" `
  --private-key ".tauri-updater-key" `
  --password "VOTRE_MOT_DE_PASSE"
```

**Si ça fonctionne**, vous verrez une longue signature base64.  
**Si ça échoue**, vérifiez le mot de passe.

---

## 🔄 Relancer le workflow après correction

Une fois les secrets corrigés :

```bash
# Supprimer l'ancien tag
git tag -d v1.0.2
git push origin :refs/tags/v1.0.2

# Recreate le tag (sur le dernier commit)
git tag v1.0.2
git push origin v1.0.2
```

Le workflow se relancera automatiquement avec les nouveaux secrets.

---

## 🐛 Si le problème persiste

### Vérifiez que la clé n'a pas de BOM

```powershell
# Lire le fichier en hexadécimal (premiers bytes)
Format-Hex .tauri-updater-key -Count 16
```

**Si vous voyez `EF BB BF` au début** → BOM présent (problème)

**Solution** : Régénérer la clé avec `setup-autoupdate.bat`

---

### Vérifiez les sauts de ligne

La clé doit avoir des sauts de ligne LF (`\n`), pas CRLF (`\r\n`).

**Solution** : Régénérer la clé ou convertir avec :

```powershell
(Get-Content .tauri-updater-key -Raw) -replace "`r`n", "`n" | Set-Content .tauri-updater-key -NoNewline
```

---

## ✅ Checklist de vérification

- [ ] Secret `TAURI_PRIVATE_KEY` existe sur GitHub
- [ ] Secret commence par "untrusted comment:"
- [ ] Secret contient la clé complète (2 lignes)
- [ ] Secret `TAURI_KEY_PASSWORD` existe sur GitHub
- [ ] Mot de passe est correct (testé localement si possible)
- [ ] Pas de BOM dans `.tauri-updater-key`
- [ ] Sauts de ligne corrects (LF, pas CRLF)

---

## 🆘 Option nucléaire : Tout régénérer

Si rien ne fonctionne, recommencez from scratch :

```powershell
# 1. Sauvegarder l'ancienne clé (au cas où)
Copy-Item .tauri-updater-key .tauri-updater-key.old

# 2. Régénérer une nouvelle clé
.\setup-autoupdate.bat
# Notez le nouveau mot de passe !

# 3. Mettre à jour les secrets GitHub avec la nouvelle clé
Get-Content .tauri-updater-key | Set-Clipboard
# Puis coller dans GitHub

# 4. Mettre à jour tauri.conf.json avec la nouvelle clé publique
# (normalement fait automatiquement par setup-autoupdate.bat)

# 5. Commit et push
git add src-tauri/tauri.conf.json
git commit -m "chore: nouvelle clé updater"
git push origin main

# 6. Créer un nouveau tag
git tag v1.0.3
git push origin v1.0.3
```

---

**Avec les nouveaux logs de debug, le prochain run du workflow affichera** :
- Longueur de la clé
- Première ligne de la clé
- Sortie complète de la commande de signature
- Code de sortie exact

Cela permettra de diagnostiquer précisément le problème ! 🔍

