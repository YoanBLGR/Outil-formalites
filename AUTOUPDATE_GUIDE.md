# 🔄 Guide Auto-Update - Formalyse

Guide complet pour utiliser le système de mise à jour automatique.

---

## 📋 Configuration initiale (À faire UNE SEULE FOIS)

### 1️⃣ Générer la clé de signature

Double-cliquez sur **`setup-autoupdate.bat`**

Ou lancez :
```bash
npx @tauri-apps/cli signer generate -w .tauri-updater-key
```

**Vous devrez entrer un mot de passe** pour protéger la clé privée.

⚠️ **IMPORTANT** : 
- Mémorisez bien ce mot de passe !
- La clé privée (`.tauri-updater-key`) est SECRÈTE
- Ne la commitez JAMAIS sur Git
- Sauvegardez-la en lieu sûr

### 2️⃣ Fichiers créés

```
.tauri-updater-key      ← CLÉ PRIVÉE (ne pas commiter!)
.tauri-updater-key.pub  ← Clé publique (sera dans tauri.conf.json)
```

### 3️⃣ Configuration automatique

Le script `setup-autoupdate.bat` configure automatiquement :
- `src-tauri/tauri.conf.json` avec la clé publique
- `src-tauri/Cargo.toml` avec le plugin updater
- `src-tauri/src/lib.rs` avec le plugin

---

## 🚀 Publier une mise à jour

### Workflow complet

#### 1. Développer et tester
```bash
npm run tauri:dev
```

#### 2. Mettre à jour la version

**`package.json`** :
```json
{
  "version": "1.0.1"
}
```

**`src-tauri/tauri.conf.json`** :
```json
{
  "version": "1.0.1"
}
```

#### 3. Build de production
```bash
npm run tauri:build
```

#### 4. Générer `latest.json` avec signature

**PowerShell** :
```powershell
.\generate-latest-json.ps1 -Version "1.0.1" -KeyPassword "VOTRE_MOT_DE_PASSE"
```

Cela crée `latest.json` avec la signature de l'installateur.

#### 5. Créer une GitHub Release

1. Allez sur : https://github.com/yoyoboul/formalyse/releases
2. Cliquez "Draft a new release"
3. **Tag** : `v1.0.1`
4. **Title** : `Formalyse v1.0.1`
5. **Uploadez** :
   - `Formalyse_1.0.1_x64-setup.exe`
   - `latest.json`
6. Publiez !

#### 6. Test de l'auto-update

- Ouvrez l'ancienne version de l'app
- Attendez 5 secondes
- Une notification apparaît : "Mise à jour disponible"
- Cliquez "Mettre à jour"
- L'app se met à jour et redémarre automatiquement ! 🎉

---

## 📱 Utilisation côté utilisateur

### Vérification automatique

L'application vérifie automatiquement les mises à jour :
- **Au démarrage** (après 5 secondes)
- **En arrière-plan** (peut être configuré)

### Notification de mise à jour

Quand une MAJ est disponible, une notification apparaît en bas à droite :

```
┌─────────────────────────────────┐
│ Mise à jour disponible          │
│ Version 1.0.1 disponible        │
│                                 │
│ [ Plus tard ]  [ Mettre à jour ]│
└─────────────────────────────────┘
```

### Installation

1. Clic sur "Mettre à jour"
2. Téléchargement automatique
3. Installation automatique
4. Redémarrage de l'app

**Aucune manipulation manuelle !**

---

## ⚙️ Configuration avancée

### Modifier la fréquence de vérification

**`src/hooks/useAutoUpdate.ts`** :
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    checkForUpdates()
  }, 5000)  // ← Changez ici (en millisecondes)

  return () => clearTimeout(timer)
}, [])
```

### Désactiver la vérification automatique

Commentez dans `src/App.tsx` :
```typescript
// <UpdateNotification />
```

### Changer l'endpoint

**`src-tauri/tauri.conf.json`** :
```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://votre-serveur.com/latest.json"
      ]
    }
  }
}
```

---

## 🔒 Sécurité

### Signature cryptographique

Chaque mise à jour est signée avec votre clé privée.

L'application vérifie la signature avant d'installer :
- ✅ **Signature valide** : Installation
- ❌ **Signature invalide** : Rejet

### Clé privée

⚠️ **CRUCIAL** :
- Ne JAMAIS commiter `.tauri-updater-key`
- La stocker dans un coffre-fort (LastPass, 1Password, etc.)
- Ne la partager avec PERSONNE

### HTTPS obligatoire

Les téléchargements se font uniquement via HTTPS.

---

## 📁 Structure `latest.json`

```json
{
  "version": "1.0.1",
  "notes": "Mise à jour vers la version 1.0.1",
  "pub_date": "2025-10-21T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "SIGNATURE_CRYPTOGRAPHIQUE_GENEREE",
      "url": "https://github.com/yoyoboul/formalyse/releases/download/v1.0.1/Formalyse_1.0.1_x64-setup.exe"
    }
  }
}
```

### Champs

- **version** : Nouvelle version
- **notes** : Description de la MAJ
- **pub_date** : Date de publication (ISO 8601)
- **signature** : Signature cryptographique de l'exe
- **url** : URL de téléchargement

---

## 🛠️ Scripts disponibles

### `setup-autoupdate.bat`
Configuration initiale (une seule fois)

### `generate-latest-json.ps1`
Génère `latest.json` après un build

**Usage** :
```powershell
.\generate-latest-json.ps1 -Version "1.0.1" -KeyPassword "MOT_DE_PASSE"
```

---

## 🆘 Dépannage

### "Erreur de signature invalide"

**Cause** : Mot de passe incorrect ou clé corrompue

**Solution** :
1. Vérifiez le mot de passe
2. Régénérez la clé avec `setup-autoupdate.bat`
3. Reconstruisez l'app

### "Aucune mise à jour trouvée"

**Causes possibles** :
- `latest.json` non uploadé sur GitHub
- Version dans `latest.json` ≤ version actuelle
- URL incorrecte dans `tauri.conf.json`

**Solution** :
1. Vérifiez que `latest.json` est accessible
2. Vérifiez la version dans `latest.json`
3. Testez l'URL manuellement

### "Téléchargement échoue"

**Causes** :
- Pas de connexion internet
- URL GitHub invalide
- Fichier trop gros (timeout)

**Solution** :
1. Vérifiez la connexion
2. Testez l'URL dans un navigateur
3. Augmentez le timeout si nécessaire

---

## 📊 Workflow recommandé

```
1. Développement
   └─> npm run tauri:dev

2. Version prête
   └─> Mettre à jour version (package.json + tauri.conf.json)

3. Build
   └─> npm run tauri:build

4. Signature
   └─> generate-latest-json.ps1

5. GitHub Release
   └─> Upload .exe + latest.json

6. Auto-update fonctionne !
   └─> Les utilisateurs reçoivent la MAJ automatiquement
```

---

## ✅ Checklist de release avec auto-update

- [ ] Version mise à jour (2 fichiers)
- [ ] Build de production réussi
- [ ] `latest.json` généré avec signature
- [ ] GitHub Release créée
- [ ] `.exe` uploadé
- [ ] `latest.json` uploadé
- [ ] URL de téléchargement testée
- [ ] Test d'auto-update effectué

---

## 🌟 Avantages

✅ **Expérience utilisateur** : MAJ sans friction
✅ **Sécurité** : Signature cryptographique
✅ **Simplicité** : Un clic pour mettre à jour
✅ **Fiabilité** : Vérification automatique
✅ **Contrôle** : Vous décidez quand publier

---

## 📚 Ressources

- **Tauri Updater** : https://v2.tauri.app/plugin/updater/
- **Signing** : https://v2.tauri.app/reference/cli/#signer
- **GitHub Releases** : https://docs.github.com/releases

---

**L'auto-update est maintenant configuré ! 🎉**

*Les utilisateurs recevront automatiquement les mises à jour sans rien faire !*

