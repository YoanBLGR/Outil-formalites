# Guide de Débogage Guichet Unique

Ce guide explique comment utiliser le nouveau système de logs pour déboguer les problèmes avec le Guichet Unique.

## 🔍 Composant de Logs

Un composant de logs en temps réel a été ajouté dans l'application pour capturer tous les événements liés au Guichet Unique.

### Où trouver les logs ?

Les logs sont affichés automatiquement dans :

1. **Page "Détail du Dossier" (Entrepreneur Individuel)**
   - Onglet "Informations"
   - Après le bouton "Saisir au Guichet Unique"
   - Section "Logs de débogage Guichet Unique"

2. **Page "Rédaction des Statuts" (Sociétés)**
   - En bas de page
   - Section "Logs de débogage Guichet Unique"

### Fonctionnalités

Le composant de logs offre :

- **Affichage en temps réel** : Tous les événements sont capturés instantanément
- **Filtres** :
  - Par niveau (Debug, Info, Warning, Error, Success)
  - Par catégorie (AUTH, API, REQUEST, etc.)
- **Actions** :
  - **Copier** : Copie tous les logs dans le presse-papier
  - **Export TXT** : Exporte les logs en fichier texte
  - **Export JSON** : Exporte les logs en format JSON pour analyse
  - **Effacer** : Vide tous les logs

### Niveaux de log

- 🔍 **Debug** : Informations détaillées de débogage
- ℹ️ **Info** : Informations générales
- ⚠️ **Warning** : Avertissements
- ❌ **Error** : Erreurs
- ✅ **Success** : Succès

### Catégories

- **AUTH** : Authentification au Guichet Unique
- **API** : Appels API
- **REQUEST** : Requêtes HTTP
- **RESPONSE** : Réponses HTTP
- **SYSTEM** : Événements système

## 🔧 Logs capturés

### Authentification

Le système capture :
- Configuration de l'environnement (dev/prod)
- URL d'endpoint utilisée
- Headers de requête
- Réponse HTTP (status, headers)
- Cookies de session
- Token reçu (si applicable)
- Toutes les erreurs détaillées

### Exemple de logs d'authentification

```
[14:23:45] [INFO] [AUTH] Début de l'authentification au Guichet Unique

[14:23:45] [DEBUG] [AUTH] Configuration de l'authentification
  {
    "endpoint": "https://api.guichet-unique.inpi.fr/api/user/login/sso",
    "isDev": false,
    "username": "votre-username",
    "apiUrl": "https://api.guichet-unique.inpi.fr",
    "mode": "production",
    "prod": true
  }

[14:23:45] [DEBUG] [AUTH] Envoi de la requête d'authentification
  {
    "endpoint": "https://api.guichet-unique.inpi.fr/api/user/login/sso",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "credentials": "include"
  }

[14:23:46] [DEBUG] [AUTH] Réponse reçue
  {
    "status": 200,
    "statusText": "OK",
    "ok": true,
    "headers": {
      "content-type": "application/json",
      "set-cookie": "..."
    }
  }
```

## 🐛 Déboguer l'erreur "Failed to fetch"

Si vous obtenez l'erreur "Failed to fetch", voici les étapes de débogage :

### 1. Vérifier les logs

Ouvrez le composant de logs et regardez :

1. **La catégorie AUTH** - Filtrez par catégorie "AUTH"
2. **Les erreurs** - Filtrez par niveau "Error"
3. **Les détails** - Cliquez sur "Afficher les détails" pour chaque log

### 2. Informations clés à vérifier

Dans les logs, vérifiez :

- ✅ **Endpoint utilisé** : Doit pointer vers l'API du Guichet Unique
- ✅ **Mode (dev/prod)** : En production, doit être `prod: true`
- ✅ **Credentials** : Doit être `"include"` en production
- ✅ **Headers** : Doit contenir `Content-Type: application/json`
- ✅ **Réponse HTTP** : Status code et message d'erreur

### 3. Erreurs courantes

#### "Failed to fetch"

**Cause possible** :
- Problème CORS
- URL incorrecte
- Firewall/Proxy bloquant
- Pas de connexion internet

**Solution** :
1. Vérifiez l'URL dans `.env` : `VITE_GU_API_URL`
2. Vérifiez que vous êtes sur l'app Tauri (pas web)
3. Exportez les logs et partagez-les pour diagnostic

#### "Erreur 401: Unauthorized"

**Cause** : Identifiants incorrects

**Solution** :
1. Vérifiez `VITE_GU_USERNAME` et `VITE_GU_PASSWORD` dans `.env`
2. Testez vos identifiants sur le site du Guichet Unique
3. Rebuild l'app après modification du `.env`

#### "Erreur 400: Bad Request"

**Cause** : Format de requête invalide

**Solution** :
1. Vérifiez les logs pour voir la structure envoyée
2. Exportez les logs en JSON pour analyse
3. Comparez avec la documentation de l'API

## 📤 Partager les logs

Pour obtenir de l'aide, partagez vos logs :

1. Cliquez sur **Export TXT** ou **Export JSON**
2. Le fichier est téléchargé automatiquement
3. Nom du fichier : `gu-logs-YYYY-MM-DDTHH:MM:SS.json`

**Note** : Les logs ne contiennent PAS le mot de passe (remplacé par ***)

## 🔒 Sécurité

- Les mots de passe ne sont **jamais** loggés
- Les tokens peuvent être visibles dans les logs - ne partagez pas publiquement
- Les logs sont stockés uniquement en mémoire (max 500 entrées)
- Les logs sont perdus au rafraîchissement de la page

## 💡 Astuces

1. **Gardez les logs ouverts** pendant les tests pour voir les erreurs en temps réel
2. **Utilisez les filtres** pour vous concentrer sur les erreurs
3. **Exportez avant de recharger** la page
4. **Comparez les logs dev vs prod** pour identifier les différences

