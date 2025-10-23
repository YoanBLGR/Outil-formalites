# Implémentation Updater Complet avec Signature - Tauri v2

Documentation suivie : Documentation officielle Tauri v2

## Étape 1 : Générer les Clés de Signature

### Commande officielle :
```bash
npm run tauri signer generate
```

**Important** : Cette commande va générer :
- Une **clé privée** (à garder SECRÈTE)
- Une **clé publique** (à mettre dans tauri.conf.json)

**Où stocker la clé privée** :
- En local : `~/.tauri/myapp.key` 
- Comme secret GitHub : `TAURI_SIGNING_PRIVATE_KEY`

**Note** : La clé publique sera affichée dans le terminal et devra être copiée.

---

## Étape 2 : Configuration de tauri.conf.json

Selon la doc officielle :

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "VOTRE_CLE_PUBLIQUE_ICI"
    }
  }
}
```

---

## Étape 3 : Réactiver le Plugin dans lib.rs

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        // ... autres plugins
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Étape 4 : Code Frontend (API Officielle)

Selon la doc Tauri v2 :

```typescript
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

async function checkForUpdates() {
  const update = await check()
  
  if (update?.available) {
    console.log(`Mise à jour vers ${update.version} disponible !`)
    
    // Télécharger et installer
    await update.downloadAndInstall((progress) => {
      console.log(`Téléchargement: ${progress.downloaded} / ${progress.total}`)
    })
    
    // Redémarrer l'application
    await relaunch()
  }
}
```

---

## Étape 5 : Format de latest.json (avec signature)

```json
{
  "version": "2.0.3",
  "notes": "Mise à jour vers la version 2.0.3",
  "pub_date": "2025-10-22T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "SIGNATURE_GENEREE_PAR_TAURI_SIGNER",
      "url": "https://github.com/yoyoboul/formalyse/releases/download/v2.0.3/Formalyse_2.0.3_x64-setup.exe"
    }
  }
}
```

---

## Étape 6 : Signer un Build

Après chaque `npm run tauri:build`, signer avec :

```bash
npm run tauri signer sign -- -k ~/.tauri/myapp.key -f chemin/vers/Formalyse_2.0.3_x64-setup.exe
```

Cette commande retourne la **signature** à mettre dans `latest.json`.

---

## Étape 7 : Workflow GitHub Actions (Automatisation)

```yaml
name: Release with Signature

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run tauri:build
        
      - name: Sign binary
        run: |
          echo "${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}" > private.key
          npm run tauri signer sign -- -k private.key -f src-tauri/target/release/bundle/nsis/Formalyse_*_x64-setup.exe > signature.txt
          
      - name: Generate latest.json with signature
        run: |
          # Script PowerShell pour générer latest.json avec la signature
          
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/nsis/Formalyse_*_x64-setup.exe
            latest.json
```

---

## Sécurité

✅ **Clé privée** : JAMAIS commitée dans Git  
✅ **Clé privée** : Stockée dans les secrets GitHub  
✅ **Clé publique** : Dans le code (tauri.conf.json)  
✅ **Signature** : Vérifiée automatiquement par Tauri  

---

## Avantages du Système Complet

✅ Téléchargement automatique en arrière-plan  
✅ Installation automatique  
✅ Redémarrage automatique  
✅ Sécurité cryptographique  
✅ Vérification d'intégrité  
✅ Protection contre les modifications malveillantes  

---

## Prochaines Étapes

1. Générer les clés
2. Configurer l'application
3. Tester en local
4. Configurer GitHub Actions
5. Publier une release signée
6. Tester l'auto-update


