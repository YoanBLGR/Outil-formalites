# Test Auto-Update 2.0.0 → 2.0.1

## Modifications Effectuées

✅ **Badge de version v2.0.1** ajouté dans le header (à côté du titre)  
✅ **Version mise à jour** dans `useSimpleUpdate.ts` → `2.0.1`

---

## Étapes pour Tester

### 1. Builder la Version 2.0.1

```powershell
npm run tauri:build
```

**Temps estimé** : 2-3 minutes

### 2. Générer latest.json

```powershell
.\generate-latest-json.ps1 -Version "2.0.1"
```

### 3. Publier sur GitHub

**Option A - Automatique** (si vous avez le token GitHub) :
```powershell
.\create-github-release.ps1 -Version "2.0.1"
```

**Option B - Manuel** :

1. Allez sur : https://github.com/yoyoboul/formalyse/releases/new

2. Créez la release :
   - **Tag** : `v2.0.1`
   - **Title** : `Formalyse v2.0.1`
   - **Description** : `Test auto-update - Badge de version ajouté`

3. Uploadez 2 fichiers :
   - `src-tauri\target\release\bundle\nsis\Formalyse_2.0.1_x64-setup.exe`
   - `latest.json` (à la racine du projet)

4. Cliquez sur **"Publish release"**

---

### 4. Tester l'Auto-Update

#### A) Installer la Version 2.0.0 (si pas déjà fait)

Si vous avez encore l'installateur :
```
src-tauri\target\release\bundle\nsis\Formalyse_2.0.0_x64-setup.exe
```

Sinon, téléchargez depuis : https://github.com/yoyoboul/formalyse/releases/tag/v2.0.0

#### B) Lancer l'Application 2.0.0

1. Ouvrez Formalyse v2.0.0
2. **Vérifiez le badge** : Il doit afficher **"v2.0.0"** dans le header
3. **Attendez 5 secondes**
4. **Le panneau de mise à jour apparaît** en bas à droite

#### C) Observer les Logs

Cliquez sur le **chevron (^)** pour voir les logs :

```
[11:XX:XX] 🔍 Démarrage de la vérification des mises à jour...
[11:XX:XX] 📍 Version actuelle: 2.0.0
[11:XX:XX] 🌐 API GitHub: https://api.github.com/repos/yoyoboul/formalyse/releases/latest
[11:XX:XX] 📡 Utilisation de l'API Tauri HTTP...
[11:XX:XX] ✅ Connexion API GitHub réussie
[11:XX:XX] ✅ Données de release reçues
[11:XX:XX] 📦 Version disponible sur GitHub: 2.0.1
[11:XX:XX] 📥 Installateur trouvé: Formalyse_2.0.1_x64-setup.exe
[11:XX:XX] 🎉 Mise à jour disponible! 2.0.0 → 2.0.1
[11:XX:XX] 📥 URL de téléchargement prête
```

#### D) Télécharger et Installer

1. Cliquez sur **"Télécharger v2.0.1"**
2. Le navigateur s'ouvre avec le lien de téléchargement
3. Téléchargez et installez `Formalyse_2.0.1_x64-setup.exe`
4. Relancez l'application
5. **Vérifiez le badge** : Il doit maintenant afficher **"v2.0.1"** ! 🎉

---

## Résultats Attendus

### Avant Mise à Jour (v2.0.0)
- ✅ Badge affiche "v2.0.0"
- ✅ Panneau de mise à jour affiche "🎉 Mise à jour disponible"
- ✅ Bouton "Télécharger v2.0.1" visible

### Après Mise à Jour (v2.0.1)
- ✅ Badge affiche "v2.0.1"
- ✅ Panneau affiche "✅ Application à jour"
- ✅ Pas de notification de mise à jour

---

## En Cas de Problème

### Panneau n'apparaît pas
- Attendez au moins 10 secondes
- Ouvrez la console (F12) et regardez les logs `[AUTO-UPDATE]`

### Erreur "Failed to fetch"
- Vérifiez que le repository est bien **public**
- Vérifiez que `latest.json` est bien uploadé dans la release v2.0.1

### Badge ne s'affiche pas
- Rechargez l'application (Ctrl+R)
- Vérifiez que vous êtes bien sur la bonne version

---

## Commandes Rapides

```powershell
# Build
npm run tauri:build

# Générer latest.json
.\generate-latest-json.ps1 -Version "2.0.1"

# Upload manuel
.\upload-release.bat
```

---

**Bonne chance pour le test !** 🚀

