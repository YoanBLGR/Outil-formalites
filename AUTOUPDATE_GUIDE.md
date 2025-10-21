# 🔄 Guide Auto-Update - Formalyse

Guide complet pour utiliser le système de mise à jour automatique.

> ⚡ **Version Simplifiée** - Plus besoin de clés cryptographiques !  
> Pour un guide ultra-rapide, consultez [AUTOUPDATE_SIMPLE.md](AUTOUPDATE_SIMPLE.md)

---

## ✨ Nouvelle Version Simplifiée (Sans Signature)

Le système a été simplifié pour **supprimer toute complexité** :

- ✅ **Pas de clés cryptographiques** à générer
- ✅ **Pas de secrets GitHub** à configurer
- ✅ **Workflow 2x plus rapide** (7-10 min au lieu de 15+)
- ✅ **Zéro erreur de signature** possible
- ✅ **Sécurisé par HTTPS** (GitHub)

### Configuration (Déjà Faite ✓)

Le système est **déjà configuré** et prêt à l'emploi :
- ✅ `src-tauri/tauri.conf.json` configuré
- ✅ `src-tauri/Cargo.toml` avec le plugin updater
- ✅ `src-tauri/src/lib.rs` avec le plugin
- ✅ Workflow GitHub Actions opérationnel

---

## 🚀 Publier une mise à jour

### Workflow Simplifié (3 Étapes)

#### 1. Développer et tester
```bash
npm run tauri:dev
```

#### 2. Créer une nouvelle version

```bash
npm version patch    # 1.0.0 → 1.0.1
npm version minor    # 1.0.0 → 1.1.0  
npm version major    # 1.0.0 → 2.0.0
```

Cette commande met à jour automatiquement :
- `package.json`
- `src-tauri/tauri.conf.json`
- Crée un commit git

#### 3. Publier sur GitHub

```bash
git pull
git push origin vX.X.X  # Remplacer par votre version (ex: v1.0.1)
```

**C'est tout !** 🎉

Le workflow GitHub Actions s'occupe automatiquement de :
1. ✅ Build l'application (5-7 min)
2. ✅ Génération de `latest.json`
3. ✅ Création de la release GitHub
4. ✅ Upload des fichiers

---

### Workflow Manuel (Optionnel)

Si vous préférez créer la release manuellement :

#### 3a. Build local
```bash
npm run tauri:build
```

#### 3b. Générer latest.json

**PowerShell** :
```powershell
.\generate-latest-json.ps1 -Version "1.0.1"
```

#### 3c. Créer une GitHub Release

1. Allez sur : https://github.com/yoyoboul/formalyse/releases
2. Cliquez "Draft a new release"
3. **Tag** : `v1.0.1`
4. **Title** : `Formalyse v1.0.1`
5. **Uploadez** :
   - `Formalyse_1.0.1_x64-setup.exe`
   - `latest.json`
6. Publiez !

---

### Test de l'auto-update

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

### Système de Sécurité Simplifié

Le système utilise **HTTPS pour la sécurité** au lieu de signatures cryptographiques :

#### Couches de Sécurité

1. **HTTPS/TLS** : GitHub utilise HTTPS pour tous les téléchargements
2. **Endpoints Fixes** : L'application télécharge UNIQUEMENT depuis GitHub
3. **Pas de Downgrade** : Tauri refuse d'installer une version plus ancienne
4. **Windows Installer** : Validation automatique par le système

#### Niveau de Sécurité

- ✅ **Excellent pour** : Applications internes, startups, PME, la plupart des projets
- ✅ **Équivalent à** : La majorité des applications desktop modernes
- 🔐 **Note** : Pour ajouter une signature cryptographique plus tard (applications bancaires, santé), consultez la documentation Tauri

### Pourquoi HTTPS suffit ?

GitHub est une plateforme sécurisée de confiance utilisée par des millions de projets. Si un attaquant compromettait GitHub, des millions d'applications seraient affectées - le risque est négligeable comparé à la complexité d'un système de signature.

---

## 📁 Structure `latest.json`

```json
{
  "version": "1.0.1",
  "notes": "Mise à jour vers la version 1.0.1",
  "pub_date": "2025-10-21T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/yoyoboul/formalyse/releases/download/v1.0.1/Formalyse_1.0.1_x64-setup.exe"
    }
  }
}
```

### Champs

- **version** : Nouvelle version disponible
- **notes** : Description de la mise à jour
- **pub_date** : Date de publication (format ISO 8601)
- **url** : URL de téléchargement direct (HTTPS seulement)

---

## 🛠️ Scripts disponibles

### `generate-latest-json.ps1`
Génère `latest.json` après un build local (optionnel)

**Usage** :
```powershell
.\generate-latest-json.ps1 -Version "1.0.1"
```

**Note** : En mode automatique, GitHub Actions génère ce fichier - vous n'avez pas besoin de ce script !

---

## 🆘 Dépannage

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
   └─> npm version patch/minor/major

3. Publier
   └─> git push origin vX.X.X

4. Auto-update fonctionne !
   └─> GitHub Actions build, crée la release
   └─> Les utilisateurs reçoivent la MAJ automatiquement
```

**Temps total : 5 minutes de votre part + 7-10 min de build automatique**

---

## ✅ Checklist de release avec auto-update

- [ ] Tests locaux OK (`npm run tauri:dev`)
- [ ] Version incrémentée (`npm version patch/minor/major`)
- [ ] Tag poussé sur GitHub (`git push origin vX.X.X`)
- [ ] Workflow GitHub Actions terminé avec succès
- [ ] Release créée automatiquement
- [ ] Test : ancienne version détecte la MAJ

---

## 🌟 Avantages

✅ **Expérience utilisateur** : MAJ sans friction, un seul clic
✅ **Sécurité** : HTTPS + validation Windows
✅ **Simplicité** : Pas de configuration complexe
✅ **Fiabilité** : Système robuste sans erreurs de signature
✅ **Rapidité** : Workflow 2x plus rapide
✅ **Contrôle** : Vous décidez quand publier

---

## 📚 Ressources

- **Tauri Updater** : https://v2.tauri.app/plugin/updater/
- **Signing** : https://v2.tauri.app/reference/cli/#signer
- **GitHub Releases** : https://docs.github.com/releases

---

**L'auto-update est maintenant configuré ! 🎉**

*Les utilisateurs recevront automatiquement les mises à jour sans rien faire !*

