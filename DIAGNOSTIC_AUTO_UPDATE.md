# Diagnostic Auto-Update - Checklist Manuelle

## Vérifications Rapides

### 1. Vérifier la configuration Tauri

Ouvrez `src-tauri/tauri.conf.json` et vérifiez :

```json
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
```

✅ **NE DOIT PAS** contenir de clé `pubkey` (supprimée pour éviter les problèmes de signature)

### 2. Tester l'accès au fichier latest.json

Ouvrez ce lien dans votre navigateur :
```
https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json
```

**Résultat attendu** : Vous devez voir un fichier JSON avec :
```json
{
  "version": "1.0.8",
  "pub_date": "2025-10-22T08:14:54Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/yoyoboul/formalyse/releases/download/v1.0.8/Formalyse_1.0.8_x64-setup.exe"
    }
  }
}
```

❌ **Si erreur 404** : latest.json n'est pas uploadé dans votre dernière release

### 3. Vérifier les dépendances Rust

Dans `src-tauri/Cargo.toml`, vérifiez la présence de :
```toml
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
```

### 4. Vérifier l'initialisation du plugin

Dans `src-tauri/src/lib.rs`, vérifiez :
```rust
.plugin(tauri_plugin_updater::Builder::new().build())
.plugin(tauri_plugin_process::init())
```

### 5. Tester en conditions réelles

1. **Build une nouvelle version** :
   ```powershell
   npm run tauri:build
   ```

2. **Générer latest.json** :
   ```powershell
   .\generate-latest-json.ps1 -Version "1.0.9"
   ```

3. **Publier sur GitHub** :
   ```powershell
   .\release.bat
   ```
   
4. **Tester la mise à jour** :
   - Installez la version précédente (1.0.8)
   - Lancez l'application
   - Ouvrez la console développeur (F12)
   - Attendez 5 secondes
   - Regardez les logs : `[AUTO-UPDATE]`

### 6. Logs attendus dans la console

**Cas 1 : Mise à jour trouvée**
```
[AUTO-UPDATE] Démarrage de la vérification des mises à jour...
[AUTO-UPDATE] Endpoint configuré dans tauri.conf.json
[AUTO-UPDATE] ✓ Mise à jour trouvée! {version: '1.0.9', ...}
```

**Cas 2 : Pas de mise à jour**
```
[AUTO-UPDATE] Démarrage de la vérification des mises à jour...
[AUTO-UPDATE] Endpoint configuré dans tauri.conf.json
[AUTO-UPDATE] ✓ Aucune mise à jour disponible - Application à jour
```

**Cas 3 : Erreur**
```
[AUTO-UPDATE] ✗ Erreur lors de la vérification
[AUTO-UPDATE] Type d'erreur: ...
[AUTO-UPDATE] Message: ...
```

## Problèmes Courants

### Erreur : "Failed to fetch latest.json"

**Causes** :
- latest.json n'existe pas sur GitHub
- URL incorrecte dans tauri.conf.json
- Problème de connexion internet

**Solution** :
1. Vérifiez manuellement l'URL dans le navigateur
2. Publiez une release avec latest.json
3. Vérifiez la console réseau (F12 > Network)

### Erreur : "Signature verification failed"

**Cause** : La clé `pubkey` est encore présente dans tauri.conf.json

**Solution** : Supprimez la ligne `"pubkey": "..."` de tauri.conf.json

### Pas de notification

**Causes** :
- L'application est déjà à jour
- Le hook useAutoUpdate n'est pas appelé
- latest.json inaccessible

**Solution** :
1. Vérifiez que latest.json contient une version supérieure
2. Vérifiez les logs de la console
3. Vérifiez que `UpdateNotification` ou `UpdatePanel` est bien dans App.tsx

## Actions Correctives Appliquées

✅ **Suppression de la clé publique** dans `src-tauri/tauri.conf.json`  
✅ **Amélioration des logs** dans `src/hooks/useAutoUpdate.ts`  
✅ **Guide de test** créé dans `GUIDE_TEST_AUTOUPDATE.md`  

## Prochaines Étapes

1. **Testez l'accès au latest.json** (lien ci-dessus)
2. **Buildez une version 1.0.9** :
   ```powershell
   npm version patch
   npm run tauri:build
   .\generate-latest-json.ps1 -Version "1.0.9"
   ```
3. **Publiez sur GitHub** :
   ```powershell
   .\release.bat
   ```
4. **Installez la version 1.0.8 et testez** que la notification de 1.0.9 apparaît

## Support

Si le problème persiste après ces vérifications :

1. Partagez les logs de la console (F12) avec les messages `[AUTO-UPDATE]`
2. Vérifiez que l'URL latest.json retourne bien un JSON valide
3. Consultez `GUIDE_TEST_AUTOUPDATE.md` pour des tests plus détaillés

