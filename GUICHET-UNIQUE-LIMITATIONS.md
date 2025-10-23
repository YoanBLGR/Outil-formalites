# Limitations de l'intégration Guichet Unique

## Problème : CORS en production web

L'intégration directe au Guichet Unique INPI via leur API **ne fonctionne pas** dans un navigateur web classique en production à cause des restrictions CORS (Cross-Origin Resource Sharing).

### Pourquoi ?

1. **Politique CORS du Guichet Unique** : L'API du Guichet Unique (`https://guichet-unique.inpi.fr`) n'autorise pas les requêtes cross-origin depuis des domaines tiers (comme votre site hébergé sur Vercel).

2. **Cookies HttpOnly** : L'authentification par cookies HttpOnly ne fonctionne pas en cross-domain sans configuration CORS appropriée côté serveur.

3. **Erreur typique** : `failed to fetch` ou `blocked by CORS policy`

## Solutions

### ✅ Solution actuelle : Application Desktop uniquement

L'intégration Guichet Unique est **disponible uniquement dans l'application Tauri** (desktop).

**Comportement implémenté :**

- **En production web** : 
  - Le bouton "Saisir au Guichet Unique" est désactivé
  - Un message d'avertissement s'affiche :
    > ⚠️ L'intégration directe au Guichet Unique n'est disponible que dans l'application desktop.
    > Veuillez utiliser la version Tauri ou créer votre formalité manuellement sur procedures.inpi.fr

- **Dans l'app Tauri** :
  - L'intégration fonctionne normalement
  - Pas de restriction CORS (l'app n'est pas dans un navigateur)
  - Les cookies de session sont gérés correctement

- **En développement local** :
  - Fonctionne via le proxy Vite configuré dans `vite.config.ts`
  - Le proxy contourne les restrictions CORS

### 🔧 Solutions alternatives (non implémentées)

Si vous souhaitez faire fonctionner l'intégration en production web, vous devriez :

#### Option 1 : Proxy backend
Créer un backend intermédiaire qui fait proxy vers l'API GU :
- Vercel Serverless Functions
- Backend Node.js/Express
- Cloudflare Workers

**Exemple structure :**
```
Navigateur → Votre backend → API Guichet Unique
```

**Avantages :**
- Contourne CORS
- Peut gérer les cookies en backend
- Ajoute une couche de sécurité (credentials stockés côté serveur)

**Inconvénients :**
- Nécessite infrastructure serveur
- Coût supplémentaire
- Complexité accrue

#### Option 2 : Extension de l'API Guichet Unique
Demander à l'INPI d'ajouter votre domaine à leur liste CORS :
- Nécessite une démarche officielle
- Peu probable d'être accepté pour raisons de sécurité

## Configuration actuelle

### Fichiers modifiés

1. **`src/components/guichet-unique/GuichetUniqueButton.tsx`**
   - Détection de l'environnement Tauri
   - Affichage du message d'avertissement en production web
   - Désactivation du bouton si pas dans Tauri

2. **`src/components/guichet-unique/GuichetUniqueButtonEI.tsx`**
   - Même implémentation pour les Entrepreneurs Individuels

3. **`src/services/guichet-unique-api.ts`**
   - Gestion des cookies de session pour Node.js
   - Support du proxy Vite en développement
   - Requêtes directes en production (fonctionne uniquement dans Tauri)

### Variables d'environnement

```env
# Guichet Unique INPI
VITE_GU_API_URL=https://guichet-unique-demo.inpi.fr
VITE_GU_USERNAME=your_username
VITE_GU_PASSWORD=your_password
VITE_GU_API_KEY=  # Optionnel
```

## Recommandations

### Pour les utilisateurs

1. **Utilisez l'application desktop Tauri** pour bénéficier de l'intégration complète au Guichet Unique
2. Si vous utilisez la version web, créez vos formalités manuellement sur [procedures.inpi.fr](https://procedures.inpi.fr)

### Pour les développeurs

1. **Développement local** : Le proxy Vite fonctionne, vous pouvez tester l'intégration
2. **Tests de production** : Utilisez l'application Tauri buildée
3. **Déploiement** : La version web affichera le message d'avertissement automatiquement

## Tests

### Tester en local (avec proxy)
```bash
npm run dev
# L'intégration fonctionne via le proxy Vite
```

### Tester en Tauri
```bash
npm run tauri:dev
# L'intégration fonctionne sans proxy
```

### Tester en production web
```bash
npm run build
npm run preview
# Le bouton sera désactivé avec un message d'avertissement
```

## Support

Pour toute question concernant l'API Guichet Unique :
- Documentation : https://guichet-unique.inpi.fr/api/swagger_ui/mandataire/
- Support INPI : https://procedures.inpi.fr/contact

