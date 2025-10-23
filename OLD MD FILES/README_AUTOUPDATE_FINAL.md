# ✅ Auto-Update - Système Simplifié Fonctionnel

## Ce Qui a Changé

Le système d'auto-update a été **complètement refait** car le plugin Tauri officiel exigeait des signatures cryptographiques obligatoires (trop complexe).

## Nouveau Système

### Comment ça marche ?

1. L'app vérifie `latest.json` sur GitHub (5 sec après démarrage)
2. Si une nouvelle version existe, une notification apparaît
3. L'utilisateur clique sur "Télécharger"
4. Le navigateur s'ouvre avec le lien direct
5. L'utilisateur télécharge et installe manuellement

### Différence avec avant

| Ancien (plugin Tauri) | Nouveau (HTTP simple) |
|-----------------------|-----------------------|
| ❌ Crash au démarrage | ✅ Fonctionne toujours |
| ❌ Signature requise | ✅ Pas de signature |
| ✅ Installation auto | ⚠️ Installation manuelle |
| ❌ Complexe | ✅ Simple |

---

## 🚀 Pour Créer une Nouvelle Release

### 1. Mettre à jour la version

**Fichier** : `src/hooks/useSimpleUpdate.ts`

```typescript
const CURRENT_VERSION = '1.2.0' // ← Changez ici
```

### 2. Build

```powershell
npm run tauri:build
```

### 3. Publier

```powershell
.\release.bat
```

### 4. Uploader sur GitHub

Deux fichiers :
- `Formalyse_X.X.X_x64-setup.exe`
- `latest.json`

---

## 🧪 Test Rapide

### Vérifier que ça fonctionne

```powershell
# Lancer en dev
npm run tauri:dev

# Attendre 5 secondes
# Regarder la console (F12)
```

**Logs attendus** :
```
[AUTO-UPDATE] Vérification des mises à jour...
[AUTO-UPDATE] URL: https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json
[AUTO-UPDATE] ✓ Application à jour
```

### Test avec notification

1. Modifiez `CURRENT_VERSION` dans `useSimpleUpdate.ts` :
   ```typescript
   const CURRENT_VERSION = '1.0.0' // Version ancienne
   ```

2. Relancez l'app
3. Après 5 sec, la notification apparaît
4. Cliquez sur "Télécharger" → navigateur s'ouvre

---

## ✅ Checklist de Release

Avant chaque release :

- [ ] Mettre à jour `CURRENT_VERSION` dans `src/hooks/useSimpleUpdate.ts`
- [ ] Build : `npm run tauri:build`
- [ ] Publish : `.\release.bat`
- [ ] Uploader `.exe` et `latest.json` sur GitHub
- [ ] Tester avec une version ancienne

---

## 📁 Fichiers Créés

- `src/hooks/useSimpleUpdate.ts` - Hook de vérification
- `src/components/SimpleUpdateNotification.tsx` - Composant de notification

## 📁 Fichiers Modifiés

- `src-tauri/src/lib.rs` - Plugin updater désactivé
- `src-tauri/tauri.conf.json` - Section updater supprimée
- `src/App.tsx` - Utilise SimpleUpdateNotification

---

## 💡 Important

**N'oubliez jamais** de mettre à jour `CURRENT_VERSION` dans `useSimpleUpdate.ts` avant chaque build !

---

## 🎯 Statut Final

✅ **Système opérationnel**  
✅ **Application démarre**  
✅ **Notifications fonctionnent**  
✅ **Simple et fiable**

**Documentation complète** : `NOUVEAU_SYSTEME_AUTOUPDATE.md`

---

**Date** : 22 octobre 2025  
**Version** : Système HTTP simple (sans plugin Tauri)

