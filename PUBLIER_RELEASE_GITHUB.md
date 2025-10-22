# 📤 Publier la Release v2.0.2 sur GitHub

## ✅ Fichiers prêts à uploader

Dans votre projet, vous avez maintenant :
- `src-tauri\target\release\bundle\nsis\Formalyse_2.0.2_x64-setup.exe` (signé)
- `latest.json` (avec signature)

---

## 🚀 Étapes pour publier

### 1. Aller sur GitHub Releases

Ouvrez ce lien dans votre navigateur :
```
https://github.com/yoyoboul/formalyse/releases/new
```

---

### 2. Configurer la release

**Tag version:**
```
v2.0.2
```

**Titre de la release:**
```
Version 2.0.2 - Auto-Update Fonctionnel
```

**Description (optionnel):**
```markdown
## 🎉 Version 2.0.2

### ✨ Nouveautés
- ✅ Système d'auto-update entièrement fonctionnel
- ✅ Vérification automatique des mises à jour au démarrage
- ✅ Installation silencieuse des mises à jour

### 🔧 Corrections
- Permissions updater corrigées
- Signature de l'exécutable activée
- Amélioration de la sécurité

### 📥 Installation
Téléchargez `Formalyse_2.0.2_x64-setup.exe` ci-dessous
```

---

### 3. Uploader les fichiers

**Faites glisser ces 2 fichiers dans la zone "Attach binaries by dropping them here":**

1. `Formalyse_2.0.2_x64-setup.exe` (depuis `src-tauri\target\release\bundle\nsis\`)
2. `latest.json` (depuis la racine du projet)

⚠️ **IMPORTANT:** Les deux fichiers DOIVENT être uploadés pour que l'auto-update fonctionne !

---

### 4. Publier

Cliquez sur **"Publish release"** (bouton vert en bas)

---

## ✅ Vérification

Après publication, vérifiez que :
- [ ] Le tag `v2.0.2` est créé
- [ ] Les 2 fichiers sont visibles dans les assets
- [ ] L'URL du `latest.json` est accessible : https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json

---

## 🧪 Test de l'auto-update

Une fois la release publiée, vous pouvez tester :

### Option 1 : Tester depuis l'application
1. Lancez l'application Formalyse
2. Attendez 5 secondes
3. Un panneau devrait apparaître en bas à droite indiquant la mise à jour disponible

### Option 2 : Vérifier manuellement
```powershell
# Vérifier que latest.json est accessible
Invoke-WebRequest -Uri "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json"
```

---

## 🎯 Résultat attendu

Après publication, l'application :
- ✅ Vérifiera automatiquement les mises à jour au démarrage
- ✅ Affichera une notification quand une MAJ est disponible
- ✅ Permettra de télécharger et installer en un clic
- ✅ Redémarrera automatiquement après installation

---

## ❓ En cas de problème

Si l'auto-update ne fonctionne pas :
1. Vérifiez que `latest.json` est bien uploadé
2. Vérifiez que l'URL est accessible (pas en mode "draft")
3. Consultez les logs dans le panneau de debug de l'application
4. Vérifiez que la version dans `tauri.conf.json` est bien `2.0.2`

---

## 📝 Pour les prochaines versions

Pour publier la version `2.0.3` par exemple :

1. Modifier `src-tauri/tauri.conf.json` : `"version": "2.0.3"`
2. Modifier `src/hooks/useTauriUpdater.ts` : `const CURRENT_VERSION = '2.0.3'`
3. Builder : `npm run tauri:build`
4. Signer : `.\sign-and-generate-json.ps1 -Version "2.0.3"`
5. Publier la release avec les 2 fichiers
6. Les utilisateurs en v2.0.2 seront automatiquement notifiés ! 🎉

