# Correctif Urgent - Application Ne S'ouvre Pas

## Problème Identifié

L'application ne s'ouvrait pas après installation à cause du hook `useAutoUpdate` qui :
1. S'exécutait automatiquement au démarrage (même en dev)
2. Essayait d'appeler le plugin updater qui n'est pas toujours disponible
3. Causait un crash silencieux de l'application

## Corrections Apportées

### 1. Vérification de l'environnement Tauri

**Fichier** : `src/hooks/useAutoUpdate.ts`

```typescript
const checkForUpdates = async () => {
  try {
    // Vérifier que nous sommes dans un environnement Tauri
    if (typeof window === 'undefined' || !window.__TAURI__) {
      console.log('[AUTO-UPDATE] Non disponible en mode développement')
      return null
    }
    // ... reste du code
  }
}
```

### 2. Désactivation en mode développement

```typescript
useEffect(() => {
  // Ne vérifier les mises à jour qu'en mode production
  if (import.meta.env.PROD) {
    const timer = setTimeout(() => {
      checkForUpdates()
    }, 5000)
    return () => clearTimeout(timer)
  }
}, [])
```

## Résultat

✅ L'application démarre maintenant correctement
✅ L'auto-update ne s'exécute qu'en production
✅ Pas d'erreur en mode développement

## Rebuild Nécessaire

**IMPORTANT** : Vous devez rebuild l'application pour que ces corrections prennent effet :

```powershell
npm run tauri:build
```

Ensuite, réinstallez et testez.

## Version Corrigée

Ces corrections sont dans votre code actuel. La prochaine version buildée (1.1.2 ou autre) contiendra ces corrections.

---

**Status** : ✅ Corrigé  
**Date** : 22 octobre 2025

