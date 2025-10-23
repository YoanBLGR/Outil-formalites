# Nouveau Système d'Auto-Update - Version Simplifiée

## Problème Rencontré

Le plugin `tauri-plugin-updater` de Tauri v2 **EXIGE** obligatoirement :
1. Un champ `pubkey` dans la configuration
2. Des signatures cryptographiques pour tous les builds
3. Une infrastructure complexe de gestion de clés

**Résultat** : L'application crashait au démarrage avec l'erreur :
```
missing field `pubkey`
```

## Solution Implémentée

### Système Manuel Simple

Au lieu d'utiliser le plugin Tauri updater, nous avons créé un **système simple et fonctionnel** :

1. **Vérification HTTP simple** du fichier `latest.json`
2. **Notification à l'utilisateur** quand une mise à jour est disponible
3. **Ouverture du lien de téléchargement** dans le navigateur

### Avantages

✅ **Pas de signature requise** - Système 100% simplifié  
✅ **Pas de crash** - Fonctionne dans tous les cas  
✅ **Pas de dépendances** - Juste du fetch() HTTP  
✅ **Transparent** - L'utilisateur voit le lien de téléchargement  
✅ **Fiable** - Moins de points de défaillance

### Inconvénients

⚠️ **Pas de téléchargement automatique** - L'utilisateur doit cliquer  
⚠️ **Pas d'installation automatique** - L'utilisateur doit installer manuellement

Mais c'est un **compromis acceptable** pour avoir un système qui fonctionne réellement.

---

## Fichiers Créés/Modifiés

### 1. `src/hooks/useSimpleUpdate.ts` (NOUVEAU)

Hook React qui :
- Vérifie `latest.json` via HTTP
- Compare les versions
- Fournit l'URL de téléchargement

```typescript
export function useSimpleUpdate() {
  // Vérifie les mises à jour toutes les 5 secondes après le démarrage
  // Expose : updateInfo, checkForUpdates, openDownloadPage
}
```

### 2. `src/components/SimpleUpdateNotification.tsx` (NOUVEAU)

Composant React qui affiche :
- Notification élégante en bas à droite
- Bouton "Télécharger" qui ouvre le lien
- Bouton "Plus tard" pour dismisser

### 3. `src-tauri/src/lib.rs` (MODIFIÉ)

```rust
// Plugin updater désactivé
// .plugin(tauri_plugin_updater::Builder::new().build())
```

### 4. `src-tauri/tauri.conf.json` (MODIFIÉ)

```json
"plugins": {
  // Section updater supprimée
}
```

### 5. `src/App.tsx` (MODIFIÉ)

```tsx
import { SimpleUpdateNotification } from './components/SimpleUpdateNotification'
// ...
<SimpleUpdateNotification />
```

---

## Comment Ça Fonctionne

### Côté Utilisateur

1. **Démarrage de l'app** (version 1.1.1 par exemple)
2. **Après 5 secondes**, vérification automatique
3. **Si mise à jour disponible** (version 1.2.0 sur GitHub) :
   ```
   ┌────────────────────────────────┐
   │ Mise à jour disponible         │
   │ Version 1.2.0 disponible       │
   │ [Plus tard] [Télécharger]      │
   └────────────────────────────────┘
   ```
4. **Clic sur "Télécharger"** → Ouvre le navigateur avec le lien direct
5. **L'utilisateur télécharge** et installe manuellement

### Côté Développeur

**Pour chaque nouvelle version** :

```powershell
# 1. Mettre à jour la version dans useSimpleUpdate.ts
# src/hooks/useSimpleUpdate.ts
const CURRENT_VERSION = '1.2.0'  # ← Changer ici

# 2. Build
npm run tauri:build

# 3. Publier
.\release.bat
```

**Important** : N'oubliez pas de mettre à jour `CURRENT_VERSION` dans `useSimpleUpdate.ts` !

---

## Test

### Test Local

```powershell
# Démarrer en dev
npm run tauri:dev

# Vérifier la console après 5 secondes
# Logs attendus :
[AUTO-UPDATE] Vérification des mises à jour...
[AUTO-UPDATE] URL: https://github.com/.../latest.json
[AUTO-UPDATE] ✓ Application à jour
```

### Test avec Mise à Jour

1. **Modifiez temporairement** `CURRENT_VERSION` dans `useSimpleUpdate.ts` :
   ```typescript
   const CURRENT_VERSION = '1.0.0' // Version ancienne pour test
   ```

2. **Lancez l'app** :
   ```powershell
   npm run tauri:dev
   ```

3. **Après 5 secondes**, la notification doit apparaître

4. **Cliquez sur "Télécharger"** → Le navigateur s'ouvre avec le lien

---

## Workflow de Release

### 1. Développement
```powershell
npm run tauri:dev
```

### 2. Nouvelle Version

**Éditez** `src/hooks/useSimpleUpdate.ts` :
```typescript
const CURRENT_VERSION = '1.2.0' // ← Nouvelle version
```

### 3. Build
```powershell
npm run tauri:build
```

### 4. Publication
```powershell
.\release.bat
```

Uploadez :
- `Formalyse_1.2.0_x64-setup.exe`
- `latest.json`

---

## Structure de latest.json

**Format attendu** (généré automatiquement par `generate-latest-json.ps1`) :

```json
{
  "version": "1.2.0",
  "pub_date": "2025-10-22T10:00:00Z",
  "notes": "Mise à jour vers la version 1.2.0",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/yoyoboul/formalyse/releases/download/v1.2.0/Formalyse_1.2.0_x64-setup.exe"
    }
  }
}
```

**Note** : Pas de champ `signature` - le système HTTPS suffit.

---

## Avantages par Rapport à l'Ancien Système

| Critère | Plugin Tauri Updater | Système Simple |
|---------|---------------------|----------------|
| Configuration | Complexe (pubkey obligatoire) | Simple (juste fetch) |
| Signature | Obligatoire | Aucune |
| Gestion de clés | Minisign requis | Aucune |
| Crash au démarrage | Oui (si mal configuré) | Non |
| Installation auto | Oui | Non (manuel) |
| Fiabilité | Moyenne (beaucoup de points de défaillance) | Haute (simple HTTP) |
| Expérience utilisateur | Meilleure (automatique) | Acceptable (1 clic) |

---

## FAQ

### Q: Pourquoi ne pas utiliser le plugin officiel ?

**R:** Le plugin Tauri Updater v2 exige obligatoirement des signatures cryptographiques. Sans `pubkey`, l'application crash au démarrage. C'est trop complexe pour un bénéfice marginal.

### Q: Est-ce sécurisé ?

**R:** Oui ! 
- Les fichiers sont hébergés sur GitHub (HTTPS)
- L'utilisateur voit l'URL de téléchargement
- Pas de downgrade possible (vérification de version)

### Q: L'utilisateur peut-il refuser la mise à jour ?

**R:** Oui, il clique sur "Plus tard" et la notification disparaît.

### Q: Comment re-vérifier manuellement ?

**R:** Actuellement, la vérification se fait uniquement au démarrage. Pour ajouter un bouton manuel, vous pouvez exposer `checkForUpdates()`.

---

## Prochaines Améliorations Possibles

1. **Bouton manuel** dans les paramètres pour vérifier
2. **Vérification périodique** (toutes les X heures)
3. **Afficher les notes de version** depuis `latest.json`
4. **Auto-download** (télécharger en arrière-plan)

---

## Statut

✅ **Système opérationnel et testé**  
✅ **Application démarre correctement**  
✅ **Notifications fonctionnent**  
✅ **Téléchargement via navigateur OK**

**Version du système** : Simple HTTP (sans plugin Tauri)  
**Date** : 22 octobre 2025

