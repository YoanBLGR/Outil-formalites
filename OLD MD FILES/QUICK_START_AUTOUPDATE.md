# Quick Start - Auto-Update Corrigé

## ✅ Le système est maintenant opérationnel !

### Ce qui a été corrigé

1. **Suppression de la signature cryptographique** (source d'erreurs)
2. **Ajout de logs détaillés** pour le débogage
3. **Mode HTTPS sécurisé** par GitHub (plus simple et fiable)

---

## 🚀 Test Rapide (5 min)

### Étape 1 : Vérifier que latest.json est accessible

Ouvrez ce lien dans votre navigateur :
```
https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json
```

**✅ OK** : Vous voyez un fichier JSON  
**❌ Erreur 404** : Pas de release publiée → Passez à l'Étape 2

---

### Étape 2 : Créer une nouvelle release pour tester

```powershell
# 1. Build une nouvelle version
.\release.bat

# 2. Choisissez "1" pour patch (1.0.8 → 1.0.9)

# 3. Le script va :
#    - Builder l'app
#    - Générer latest.json
#    - Publier sur GitHub
```

---

### Étape 3 : Tester la mise à jour

1. **Installez la version précédente** (1.0.8)
   - Fichier : `src-tauri\target\release\bundle\nsis\Formalyse_1.0.8_x64-setup.exe`

2. **Lancez l'application**

3. **Ouvrez la console développeur** : `F12` ou `Ctrl+Shift+I`

4. **Attendez 5 secondes**

5. **Vérifiez les logs** :
   ```
   [AUTO-UPDATE] Démarrage de la vérification...
   [AUTO-UPDATE] ✓ Mise à jour trouvée! {version: '1.0.9', ...}
   ```

6. **La notification doit apparaître** en bas à droite :
   ```
   ┌────────────────────────────────┐
   │ Mise à jour disponible         │
   │ Version 1.0.9 disponible       │
   │ [Plus tard] [Mettre à jour]    │
   └────────────────────────────────┘
   ```

7. **Cliquez sur "Mettre à jour"**

8. **L'app se met à jour et redémarre automatiquement !** 🎉

---

## ❌ Si ça ne fonctionne pas

### 1. Vérifiez les logs de la console

**Erreur "Failed to fetch"** :
```
[AUTO-UPDATE] ✗ Erreur lors de la vérification
```
→ latest.json n'est pas accessible sur GitHub  
→ Vérifiez manuellement l'URL dans votre navigateur

**"No update available"** :
```
[AUTO-UPDATE] ✓ Aucune mise à jour disponible
```
→ Normal si vous êtes déjà à jour  
→ Vérifiez la version dans latest.json

### 2. Checklist rapide

```powershell
# Vérifier la configuration
Get-Content src-tauri\tauri.conf.json | Select-String "updater"
```

Doit afficher :
```json
"updater": {
  "endpoints": [
    "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json"
  ]
}
```

**NE DOIT PAS** contenir de `"pubkey"` ✅

---

## 📚 Documentation Complète

- **Corrections détaillées** : `CORRECTIONS_AUTO_UPDATE.md`
- **Guide de test complet** : `GUIDE_TEST_AUTOUPDATE.md`
- **Diagnostic manuel** : `DIAGNOSTIC_AUTO_UPDATE.md`
- **Release simplifiée** : `AUTOUPDATE_SIMPLE.md`

---

## 🎯 Workflow Quotidien

### Pour chaque nouvelle version :

```powershell
# 1. Développement
npm run tauri:dev

# 2. Tests
npm run tauri:build

# 3. Release
.\release.bat
```

**C'est tout !** Les utilisateurs recevront automatiquement la notification.

---

## ⚡ Support Rapide

**Problème** | **Solution**
---|---
Pas de notification | Vérifiez les logs console (F12)
Erreur de téléchargement | Vérifiez l'URL de l'installateur
Erreur de signature | Supprimez `pubkey` de tauri.conf.json

---

**Statut** : ✅ Opérationnel  
**Prochaine étape** : Testez avec une vraie release !

