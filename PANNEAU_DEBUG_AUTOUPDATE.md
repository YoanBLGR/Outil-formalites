# 📊 Panneau de Debug Auto-Update

## Nouveau Composant avec Logs Visuels

J'ai créé un **panneau de debug visuel** qui affiche tous les logs de mise à jour directement dans l'interface de l'application.

---

## 🎨 À Quoi Ça Ressemble

### État Initial (Application à jour)

```
┌──────────────────────────────────────────────┐
│ 🔄 Système de mise à jour              [v] [x]│
│ Version actuelle: 1.1.1                      │
│ Dernière vérification: 14:32:15              │
│                                              │
│ [🔄 Vérifier maintenant]                     │
└──────────────────────────────────────────────┘
```

### Avec Mise à Jour Disponible

```
┌──────────────────────────────────────────────┐
│ 🎉 Mise à jour disponible          [v] [x]  │
│ Version 1.2.0 disponible (actuelle: 1.1.1)   │
│ Dernière vérification: 14:32:15              │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Une nouvelle version est disponible !   │ │
│ │ Cliquez sur "Télécharger" pour obtenir  │ │
│ │ la dernière version.                    │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [🔄 Vérifier] [📥 Télécharger v1.2.0 →]     │
└──────────────────────────────────────────────┘
```

### Logs Expandus (Clic sur ^)

```
┌──────────────────────────────────────────────┐
│ 🔄 Système de mise à jour         [^] [x]   │
│ Version actuelle: 1.1.1                      │
│ Dernière vérification: 14:32:15              │
│                                              │
│ Logs de vérification              5 entrées │
│ ┌──────────────────────────────────────────┐ │
│ │ [14:32:10] 🔍 Démarrage de la vérif...  │ │
│ │ [14:32:10] 📍 Version actuelle: 1.1.1   │ │
│ │ [14:32:10] 🌐 URL: https://github...    │ │
│ │ [14:32:11] ✅ Connexion réussie          │ │
│ │ [14:32:11] ✅ Données JSON reçues        │ │
│ │ [14:32:11] 📦 Version sur GitHub: 1.1.1 │ │
│ │ [14:32:11] ✅ Application à jour         │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [🔄 Vérifier maintenant]                     │
└──────────────────────────────────────────────┘
```

---

## ✨ Fonctionnalités

### 1. Vérification Automatique
- Au démarrage (après 5 secondes)
- Logs automatiques de chaque étape

### 2. Vérification Manuelle
- Bouton "Vérifier maintenant"
- Animation de chargement pendant la vérification

### 3. Logs en Temps Réel
- Tous les logs visibles dans l'interface
- Code couleur :
  - 🔴 Rouge : Erreurs
  - 🟢 Vert : Succès
  - 🔵 Bleu : Informations
  - ⚫ Gris : Logs normaux

### 4. Actions Disponibles
- **Vérifier maintenant** : Force une vérification
- **Télécharger** : Ouvre le navigateur avec le lien (si MAJ disponible)
- **Expand/Collapse** : Afficher/masquer les logs
- **Dismiss** : Fermer le panneau

---

## 📋 Types de Logs

### Vérification Réussie (Application à jour)
```
[14:32:10] 🔍 Démarrage de la vérification des mises à jour...
[14:32:10] 📍 Version actuelle: 1.1.1
[14:32:10] 🌐 URL: https://github.com/yoyoboul/formalyse/releases/latest/download/latest.json
[14:32:11] ✅ Connexion réussie
[14:32:11] ✅ Données JSON reçues
[14:32:11] 📦 Version disponible sur GitHub: 1.1.1
[14:32:11] ✅ Application à jour - Aucune mise à jour nécessaire
```

### Mise à Jour Disponible
```
[14:32:10] 🔍 Démarrage de la vérification des mises à jour...
[14:32:10] 📍 Version actuelle: 1.1.1
[14:32:10] 🌐 URL: https://github.com/...
[14:32:11] ✅ Connexion réussie
[14:32:11] ✅ Données JSON reçues
[14:32:11] 📦 Version disponible sur GitHub: 1.2.0
[14:32:11] 🎉 Mise à jour disponible! 1.1.1 → 1.2.0
[14:32:11] 📥 URL de téléchargement prête
```

### Erreur de Connexion
```
[14:32:10] 🔍 Démarrage de la vérification des mises à jour...
[14:32:10] 📍 Version actuelle: 1.1.1
[14:32:10] 🌐 URL: https://github.com/...
[14:32:15] ❌ Erreur: HTTP 404
```

---

## 🧪 Test

### 1. Lancer l'application

```powershell
npm run tauri:dev
```

### 2. Observer le panneau

- Apparaît en bas à droite après 5 secondes
- Affiche "Système de mise à jour"

### 3. Cliquer sur le chevron (^)

- Logs s'affichent
- Vous voyez toutes les étapes de vérification

### 4. Tester une Mise à Jour

**Modifiez** `src/hooks/useSimpleUpdate.ts` :
```typescript
const CURRENT_VERSION = '1.0.0' // ← Ancienne version pour test
```

**Relancez** :
```powershell
npm run tauri:dev
```

**Résultat** :
- Le panneau affiche "🎉 Mise à jour disponible"
- Logs montrent la version détectée
- Bouton "Télécharger" est actif

---

## 🎯 Informations Affichées

| Information | Description |
|-------------|-------------|
| **État** | Checking, À jour, MAJ disponible, Erreur |
| **Version actuelle** | Version de l'app installée |
| **Version disponible** | Dernière version sur GitHub (si différente) |
| **Dernière vérification** | Timestamp de la dernière vérification |
| **Logs** | Historique complet de la vérification |
| **Erreur** | Message d'erreur si échec |

---

## 📁 Fichiers Créés/Modifiés

### Nouveau
- `src/components/UpdateDebugPanel.tsx` - Panneau visuel avec logs

### Modifié
- `src/hooks/useSimpleUpdate.ts` - Ajout des logs et états
- `src/App.tsx` - Utilise UpdateDebugPanel

---

## 🔧 Personnalisation

### Désactiver les Logs dans la Console

Si vous voulez seulement les logs visuels (pas dans la console F12) :

```typescript
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  const logMessage = `[${timestamp}] ${message}`
  // console.log(logMessage) ← Commentez cette ligne
  setUpdateInfo(prev => ({
    ...prev,
    logs: [...prev.logs, logMessage]
  }))
}
```

### Changer la Position

Dans `UpdateDebugPanel.tsx` :
```tsx
<div className="fixed bottom-4 right-4 z-50 max-w-2xl">
// Changez "right-4" en "left-4" pour gauche
// Changez "bottom-4" en "top-4" pour haut
```

### Désactiver la Vérification Auto

Dans `useSimpleUpdate.ts` :
```typescript
useEffect(() => {
  // Commentez tout le contenu pour désactiver
  // const timer = setTimeout(...)
}, [])
```

---

## ✅ Avantages

✅ **Visible** - Logs directement dans l'interface  
✅ **Interactif** - Bouton pour vérifier manuellement  
✅ **Debug facile** - Voir exactement ce qui se passe  
✅ **UX claire** - L'utilisateur comprend l'état  
✅ **Pas besoin de F12** - Tout visible sans outils dev

---

## 🚀 Prochaines Étapes

1. **Testez** avec `npm run tauri:dev`
2. **Vérifiez** que le panneau apparaît après 5 sec
3. **Expandez** les logs pour voir le détail
4. **Testez** une MAJ fictive (changez CURRENT_VERSION)

---

**Date** : 22 octobre 2025  
**Version** : Panneau de debug avec logs visuels

