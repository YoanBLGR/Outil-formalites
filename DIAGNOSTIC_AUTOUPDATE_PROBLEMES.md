# Diagnostic Auto-Update - Problèmes Détectés

## 🔍 Problèmes identifiés

### 1. ❌ Permissions manquantes dans `default.json`
**Fichier:** `src-tauri/capabilities/default.json`

**Problème:** Les permissions pour l'updater Tauri n'étaient pas déclarées.

**Solution appliquée:** Ajout de `"updater:default"` et `"process:default"` aux permissions.

```json
"permissions": [
  "core:default",
  "dialog:default",
  "fs:default",
  "shell:default",
  "shell:allow-open",
  "http:default",
  "updater:default",    // ✅ AJOUTÉ
  "process:default",    // ✅ AJOUTÉ
  // ...
]
```

---

### 2. ❌ Incohérence de version dans `useTauriUpdater.ts`
**Fichier:** `src/hooks/useTauriUpdater.ts`

**Problème:** La version hardcodée était `2.0.3` alors que la version réelle est `2.0.2`.

**Solution appliquée:** Correction de la version à `2.0.2`.

```typescript
const CURRENT_VERSION = '2.0.2' // ✅ CORRIGÉ (était 2.0.3)
```

---

### 3. ⚠️ Format du `latest.json` incomplet
**Fichier:** `latest.json`

**Problème actuel:**
```json
{
    "platforms": {
        "windows-x86_64": {
            "url": "https://github.com/yoyoboul/formalyse/releases/download/v2.0.2/Formalyse_2.0.2_x64-setup.exe"
        }
    },
    "pub_date": "2025-10-22T09:34:12Z",
    "version": "2.0.2",
    "notes": "Mise à jour vers la version 2.0.2"
}
```

**Ce qui manque:** La clé `signature` dans `platforms.windows-x86_64`.

**Format attendu par Tauri:**
```json
{
    "version": "2.0.2",
    "notes": "Mise à jour vers la version 2.0.2",
    "pub_date": "2025-10-22T09:34:12Z",
    "platforms": {
        "windows-x86_64": {
            "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",  // ⚠️ MANQUANT
            "url": "https://github.com/yoyoboul/formalyse/releases/download/v2.0.2/Formalyse_2.0.2_x64-setup.exe"
        }
    }
}
```

**Solution:** Utiliser le script `sign-and-generate-json.ps1` pour générer un `latest.json` valide avec signature.

```powershell
.\sign-and-generate-json.ps1 -Version "2.0.2"
```

Ce script va:
1. Signer l'exécutable avec la clé privée Tauri
2. Extraire la signature générée
3. Créer un `latest.json` avec la signature incluse

---

## 📋 Résumé des corrections appliquées

| Problème | Fichier | Statut | Impact |
|----------|---------|--------|--------|
| Permissions manquantes | `src-tauri/capabilities/default.json` | ✅ Corrigé | L'updater peut maintenant accéder aux APIs Tauri |
| Version incorrecte | `src/hooks/useTauriUpdater.ts` | ✅ Corrigé | La version affichée est cohérente |
| Signature manquante | `latest.json` | ⚠️ À regénérer | **CRITIQUE** - Sans signature, l'updater refuse la mise à jour |

---

## 🚀 Prochaines étapes

### Pour corriger immédiatement:

1. **Rebuilder l'application** (si nécessaire):
   ```bash
   npm run tauri:build
   ```

2. **Générer la clé de signature** (si pas déjà fait):
   ```bash
   npm run tauri signer generate
   ```
   Cela créera `~/.tauri/formalyse.key` et affichera la clé publique à mettre dans `tauri.conf.json`.

3. **Signer l'exécutable et générer latest.json**:
   ```powershell
   .\sign-and-generate-json.ps1 -Version "2.0.2"
   ```

4. **Uploader sur GitHub Release**:
   - Créer une release `v2.0.2` sur GitHub
   - Uploader `Formalyse_2.0.2_x64-setup.exe`
   - Uploader `latest.json` (avec signature)

5. **Tester l'auto-update**:
   ```powershell
   .\test-autoupdate.ps1
   ```

---

## 🔐 Configuration de la signature

Vérifiez que la clé publique dans `tauri.conf.json` correspond à votre clé privée:

```json
"plugins": {
    "updater": {
        "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDQwNzE0Q0JBMDFDNzkwNDkKUldSSmtNY0J1a3h4UUJSWTU4aG1pdHV1d2VGTzExcWdtb3JzMGVXQVNWaGQrZUN3eXhRYWNFaWIK",
        "endpoints": [
            "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json"
        ]
    }
}
```

---

## 📝 Notes

- **Versions détectées:**
  - `tauri.conf.json`: `2.0.2` ✅
  - `useTauriUpdater.ts`: `2.0.2` ✅ (corrigé)
  - `useSimpleUpdate.ts`: `2.0.1` ⚠️ (fichier alternatif, pas utilisé actuellement)
  - `latest.json`: `2.0.2` ✅

- **Plugin utilisé:** `@tauri-apps/plugin-updater` v2.9.0
  
- **Backend Rust:** Correctement configuré avec `tauri-plugin-updater::Builder::new().build()`

---

## ❓ Pourquoi "impossible de vérifier les mises à jour" ?

L'erreur provient probablement de **l'absence de signature** dans `latest.json`. Tauri Updater:

1. Télécharge `latest.json` depuis GitHub
2. Vérifie que la structure est correcte
3. **Vérifie que la signature est présente et valide** ❌ ÉCHOUE ICI
4. Si la signature manque ou est invalide → erreur "impossible de vérifier"

Une fois le `latest.json` regénéré avec signature, l'updater devrait fonctionner correctement.

