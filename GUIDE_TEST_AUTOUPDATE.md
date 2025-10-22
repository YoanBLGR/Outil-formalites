# Guide de Test du Système d'Auto-Update

Guide complet pour tester et valider que le système de mise à jour automatique fonctionne correctement.

## Table des Matières

1. [Pré-requis](#pré-requis)
2. [Diagnostic Initial](#diagnostic-initial)
3. [Test Complet](#test-complet)
4. [Dépannage](#dépannage)
5. [Checklist de Validation](#checklist-de-validation)

---

## Pré-requis

Avant de commencer, assurez-vous d'avoir :

- [ ] Node.js et npm installés
- [ ] Rust et Cargo installés
- [ ] Git configuré
- [ ] Un compte GitHub avec accès au repository
- [ ] Au moins une release publiée sur GitHub (pour tester la mise à jour)

---

## Diagnostic Initial

### Étape 1 : Exécuter le script de diagnostic

Lancez le script de diagnostic pour identifier les problèmes potentiels :

```powershell
.\test-autoupdate.ps1
```

Ce script vérifie :
- ✓ Configuration de `tauri.conf.json`
- ✓ Accessibilité de `latest.json` sur GitHub
- ✓ Format du `latest.json` local
- ✓ Accessibilité de l'installateur
- ✓ Dépendances Rust (Cargo.toml)
- ✓ Initialisation du plugin (lib.rs)

**Résultat attendu** : Tous les tests doivent passer (✓)

Si des tests échouent, consultez la section [Dépannage](#dépannage).

---

## Test Complet

### Scénario 1 : Test avec deux versions

Ce test simule le cas réel d'un utilisateur qui a une ancienne version et reçoit une mise à jour.

#### 1. Préparer la version actuelle (v1.0.8)

```powershell
# Vérifier que vous avez la version actuelle
npm run tauri:build
```

Installez cette version sur votre machine :
```powershell
.\src-tauri\target\release\bundle\nsis\Formalyse_1.0.8_x64-setup.exe
```

#### 2. Créer une nouvelle version (v1.0.9)

```powershell
# Méthode 1 : Incrément automatique
.\release.bat
# Choisissez "1" pour patch (1.0.8 → 1.0.9)

# Méthode 2 : Manuel
npm version patch
npm run tauri:build
.\generate-latest-json.ps1 -Version "1.0.9"
```

#### 3. Publier la nouvelle version sur GitHub

Si vous avez un token GitHub :
```powershell
.\create-github-release.ps1 -Version "1.0.9"
```

Sinon, upload manuel :
```powershell
.\upload-release.bat
```

Uploadez :
- `Formalyse_1.0.9_x64-setup.exe`
- `latest.json`

#### 4. Tester la détection de mise à jour

1. Ouvrez l'application installée (version 1.0.8)
2. Attendez 5 secondes
3. Ouvrez la console développeur (F12 ou Ctrl+Shift+I)
4. Regardez les logs dans la console

**Logs attendus** :
```
[AUTO-UPDATE] Démarrage de la vérification des mises à jour...
[AUTO-UPDATE] Endpoint configuré dans tauri.conf.json
[AUTO-UPDATE] ✓ Mise à jour trouvée! { version: '1.0.9', ... }
```

5. Une notification doit apparaître en bas à droite :
```
┌────────────────────────────────┐
│ Mise à jour disponible         │
│ Version 1.0.9 disponible       │
│                                │
│ [ Plus tard ]  [ Mettre à jour]│
└────────────────────────────────┘
```

#### 5. Tester le téléchargement et l'installation

1. Cliquez sur "Mettre à jour"
2. Regardez les logs dans la console

**Logs attendus** :
```
[AUTO-UPDATE] Démarrage du téléchargement et installation...
[AUTO-UPDATE] Mise à jour confirmée: 1.0.9
[AUTO-UPDATE] 📥 Téléchargement démarré - Taille: XX.XX MB
[AUTO-UPDATE] 📊 Progression: 10% ...
[AUTO-UPDATE] 📊 Progression: 20% ...
...
[AUTO-UPDATE] ✓ Téléchargement terminé!
[AUTO-UPDATE] 🔄 Installation de la mise à jour...
[AUTO-UPDATE] 🚀 Redémarrage de l'application...
```

3. L'application doit se fermer et se rouvrir automatiquement
4. Vérifiez la version dans l'application → Elle doit être 1.0.9

---

### Scénario 2 : Test avec version à jour

Ce test vérifie que le système ne propose pas de mise à jour quand l'application est déjà à jour.

1. Installez la version 1.0.9
2. Lancez l'application
3. Attendez 5 secondes

**Logs attendus** :
```
[AUTO-UPDATE] Démarrage de la vérification des mises à jour...
[AUTO-UPDATE] Endpoint configuré dans tauri.conf.json
[AUTO-UPDATE] ✓ Aucune mise à jour disponible - Application à jour
```

**Résultat attendu** : Aucune notification de mise à jour n'apparaît.

---

## Dépannage

### Problème 1 : "Impossible d'accéder à latest.json"

**Symptômes** :
```
[AUTO-UPDATE] ✗ Erreur lors de la vérification
```

**Causes possibles** :
1. Aucune release publiée sur GitHub
2. `latest.json` non uploadé dans la release
3. Problème de connexion internet
4. Repository privé sans permissions

**Solutions** :

1. Vérifiez manuellement l'URL dans votre navigateur :
   ```
   https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json
   ```

2. Si le fichier n'existe pas, publiez une release :
   ```powershell
   .\release.bat
   ```

3. Vérifiez que le repository est public ou que vous avez les permissions

### Problème 2 : "Plugin updater non configuré"

**Symptômes** :
```
[TEST 1] ✗ Plugin updater non configuré!
```

**Solution** :

Vérifiez `src-tauri/tauri.conf.json` :
```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

### Problème 3 : "Plugin non initialisé"

**Symptômes** :
```
[TEST 6] ✗ Plugin updater non initialisé!
```

**Solution** :

Vérifiez `src-tauri/src/lib.rs` :
```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        // ... autres plugins
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Problème 4 : Format de `latest.json` invalide

**Symptômes** :
```
[TEST 3] ✗ JSON invalide
```

**Solution** :

Régénérez le fichier :
```powershell
.\generate-latest-json.ps1 -Version "1.0.9"
```

Format attendu :
```json
{
  "version": "1.0.9",
  "notes": "Mise à jour vers la version 1.0.9",
  "pub_date": "2025-10-22T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/yoyoboul/formalyse/releases/download/v1.0.9/Formalyse_1.0.9_x64-setup.exe"
    }
  }
}
```

**Note** : Pas de champ `signature` (mode sans signature)

### Problème 5 : L'installateur n'est pas accessible

**Symptômes** :
```
[TEST 4] ✗ Impossible d'accéder à l'installateur
```

**Solution** :

1. Vérifiez que le fichier existe sur GitHub
2. Vérifiez que l'URL dans `latest.json` est correcte
3. L'URL doit correspondre exactement au nom du fichier uploadé

### Problème 6 : Signature cryptographique requise

**Symptômes** :
```
Error: Signature verification failed
```

**Solution** :

Supprimez la clé publique de `tauri.conf.json` :
```json
{
  "plugins": {
    "updater": {
      // Supprimez cette ligne :
      // "pubkey": "..."
      "endpoints": [...]
    }
  }
}
```

---

## Checklist de Validation

Utilisez cette checklist pour valider que tout fonctionne :

### Configuration

- [ ] `tauri.conf.json` a le plugin `updater` configuré
- [ ] L'endpoint pointe vers GitHub
- [ ] Pas de `pubkey` (signature désactivée)
- [ ] `Cargo.toml` contient `tauri-plugin-updater = "2"`
- [ ] `lib.rs` initialise le plugin updater
- [ ] `lib.rs` initialise le plugin process

### Build et Release

- [ ] `npm run tauri:build` fonctionne sans erreur
- [ ] Le fichier `.exe` est généré
- [ ] `generate-latest-json.ps1` génère un JSON valide
- [ ] La release est publiée sur GitHub
- [ ] `latest.json` est uploadé sur la release
- [ ] L'installateur `.exe` est uploadé sur la release

### Tests Fonctionnels

- [ ] Le script de diagnostic (`test-autoupdate.ps1`) passe tous les tests
- [ ] L'URL `latest.json` est accessible dans un navigateur
- [ ] Une version ancienne détecte la nouvelle version
- [ ] La notification de mise à jour apparaît
- [ ] Le téléchargement démarre et progresse
- [ ] L'installation se fait automatiquement
- [ ] L'application redémarre avec la nouvelle version
- [ ] Une version à jour ne propose pas de mise à jour

### Logs et Débogage

- [ ] Les logs `[AUTO-UPDATE]` apparaissent dans la console
- [ ] Pas d'erreurs dans la console
- [ ] Les logs indiquent clairement le statut de la mise à jour

---

## Workflow Recommandé

Pour chaque nouvelle version :

1. **Développement**
   ```powershell
   npm run tauri:dev
   ```

2. **Build et test local**
   ```powershell
   npm run tauri:build
   ```

3. **Diagnostic**
   ```powershell
   .\test-autoupdate.ps1
   ```

4. **Publication**
   ```powershell
   .\release.bat
   ```

5. **Test en conditions réelles**
   - Installez la version N-1
   - Vérifiez que la mise à jour vers N fonctionne

---

## Ressources

- **Documentation Tauri Updater** : https://v2.tauri.app/plugin/updater/
- **GitHub Releases** : https://github.com/yoyoboul/formalyse/releases
- **Script de diagnostic** : `.\test-autoupdate.ps1`
- **Script de génération** : `.\generate-latest-json.ps1`

---

**Dernière mise à jour** : 22 octobre 2025  
**Version du guide** : 1.0

Si vous rencontrez des problèmes non couverts par ce guide, ouvrez la console développeur (F12) et partagez les logs `[AUTO-UPDATE]`.

