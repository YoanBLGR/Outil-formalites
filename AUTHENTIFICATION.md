# 🔐 Système d'Authentification - Formalyse

## 📋 Vue d'ensemble

Un système d'authentification **simple et épuré** pour l'application Formalyse, conçu pour un usage interne avec un niveau de sécurité basique.

### Caractéristiques
- ✅ **Connexion par identifiant uniquement** (pas de mot de passe)
- ✅ **Interface minimaliste** et moderne
- ✅ **Liste d'utilisateurs facilement modifiable**
- ✅ **Session persistante** (localStorage)
- ✅ **Protection de toutes les routes**
- ✅ **Déconnexion simple**

---

## 🚀 Utilisation

### Connexion
1. Accédez à l'application : l'écran de login s'affiche automatiquement
2. Saisissez votre identifiant
3. Cliquez sur "Se connecter"
4. Vous êtes redirigé vers le dashboard

### Déconnexion
- Cliquez sur le bouton **"Déconnexion"** en haut à droite de l'application
- Vous serez automatiquement redirigé vers l'écran de connexion

---

## 👥 Gestion des Utilisateurs

### Ajouter un utilisateur autorisé

Éditez le fichier : `src/config/authorized-users.ts`

```typescript
export const AUTHORIZED_USERS: string[] = [
  'admin',
  'yoan',
  'demo',
  'formalyse',
  'nouvel.utilisateur', // ← Ajoutez simplement l'identifiant ici
]
```

### Retirer un utilisateur

Supprimez simplement la ligne correspondante dans le même fichier :

```typescript
export const AUTHORIZED_USERS: string[] = [
  'admin',
  'yoan',
  // 'demo', // ← Commenté ou supprimé
  'formalyse',
]
```

### Notes importantes
- Les identifiants sont **insensibles à la casse** (admin = Admin = ADMIN)
- Les espaces sont **automatiquement supprimés**
- Format recommandé : `prenom.nom` ou `identifiant_court`

---

## 🏗️ Architecture Technique

### Fichiers créés

```
src/
├── config/
│   └── authorized-users.ts       # Liste des utilisateurs autorisés
├── contexts/
│   └── AuthContext.tsx           # Contexte React d'authentification
├── pages/
│   └── Login.tsx                 # Page de connexion
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx   # Composant de protection des routes
│   └── layout/
│       └── Header.tsx            # Header mis à jour (avec déconnexion)
└── App.tsx                        # Routes configurées
```

### Flux d'authentification

```
┌─────────────┐
│   Accès     │
│ Application │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Utilisateur │
│  connecté?  │
└──────┬──────┘
       │
       ├─── NON ──→ Redirection vers /login
       │
       └─── OUI ──→ Accès autorisé
                    │
                    ▼
              ┌────────────┐
              │ Dashboard  │
              │  & Routes  │
              └────────────┘
```

### Stockage de la session

- **Mécanisme** : `localStorage`
- **Clé** : `formalyse_auth_user`
- **Données** : Identifiant de l'utilisateur (normalisé en minuscules)
- **Persistance** : La session reste active jusqu'à déconnexion ou suppression manuelle

### Vérification des autorisations

```typescript
// Vérification à chaque chargement de page
useEffect(() => {
  const savedUser = localStorage.getItem(AUTH_STORAGE_KEY)
  if (savedUser && isAuthorizedUser(savedUser)) {
    setUser(savedUser)
  } else if (savedUser) {
    // L'utilisateur était connecté mais n'est plus autorisé
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}, [])
```

---

## 🎨 Interface

### Page de connexion

<img src="..." alt="Page de login" />

**Éléments visuels** :
- Logo Formalyse avec icône Building2
- Titre et description
- Champ de saisie identifiant
- Message d'erreur (si identifiant non autorisé)
- Design responsive et moderne

### Header avec utilisateur connecté

**Affichage** :
- Avatar avec icône utilisateur
- Nom de l'utilisateur connecté
- Bouton de déconnexion avec icône

---

## 🔒 Sécurité

### Niveau de sécurité

⚠️ **Important** : Ce système est conçu pour un usage interne avec un niveau de sécurité **basique**.

**Pas de protection contre** :
- Modification directe du localStorage
- Inspection du code source
- Partage d'identifiants

**Recommandé pour** :
- Applications internes
- Prototypes
- Environnements de développement
- Petites équipes de confiance

**Non recommandé pour** :
- Applications publiques
- Données sensibles
- Environnements de production critiques

### Amélioration possible de la sécurité

Si vous souhaitez renforcer la sécurité à l'avenir :

1. **Ajouter des mots de passe**
   - Hash avec bcrypt
   - Stockage sécurisé côté serveur

2. **Tokens JWT**
   - Authentification par token
   - Expiration automatique

3. **Backend d'authentification**
   - API d'authentification
   - Base de données utilisateurs

4. **2FA (Authentification à deux facteurs)**
   - Code par email/SMS
   - Application d'authentification

---

## 🧪 Tests

### Tester l'authentification

1. **Test connexion réussie**
   ```
   1. Ouvrir /login
   2. Saisir 'admin'
   3. Cliquer "Se connecter"
   4. Vérifier redirection vers /dashboard
   ```

2. **Test connexion échouée**
   ```
   1. Ouvrir /login
   2. Saisir 'utilisateur_non_autorise'
   3. Cliquer "Se connecter"
   4. Vérifier message d'erreur
   ```

3. **Test protection des routes**
   ```
   1. Se déconnecter
   2. Essayer d'accéder à /dashboard
   3. Vérifier redirection vers /login
   ```

4. **Test persistance**
   ```
   1. Se connecter
   2. Recharger la page (F5)
   3. Vérifier que la session est maintenue
   ```

5. **Test déconnexion**
   ```
   1. Connecté, cliquer "Déconnexion"
   2. Vérifier redirection vers /login
   3. Vérifier impossibilité d'accéder aux routes protégées
   ```

---

## 📝 FAQ

### Comment changer la liste des utilisateurs autorisés ?
Modifiez directement le fichier `src/config/authorized-users.ts` et relancez l'application.

### Les identifiants sont-ils sensibles à la casse ?
Non, "Admin" et "admin" sont considérés comme identiques.

### Combien de temps dure la session ?
La session est persistante jusqu'à déconnexion manuelle ou suppression du localStorage.

### Peut-on ajouter un mot de passe ?
Oui, mais cela nécessiterait de modifier le système actuel. Voir section "Amélioration de la sécurité".

### Que se passe-t-il si un utilisateur est retiré de la liste ?
Lors du prochain chargement de l'application, sa session sera automatiquement invalidée.

---

## 🔄 Modifications futures possibles

### Court terme
- [ ] Liste des utilisateurs dans un fichier `.env` ou config JSON
- [ ] Logging des connexions/déconnexions
- [ ] Durée de session limitée (auto-déconnexion)

### Moyen terme
- [ ] Ajout de rôles (admin, utilisateur, lecture seule)
- [ ] Interface d'administration des utilisateurs
- [ ] Historique des connexions

### Long terme
- [ ] Backend d'authentification complet
- [ ] Système de mots de passe
- [ ] OAuth / SSO

---

## ✅ Checklist de déploiement

Avant de déployer en production :

- [ ] Retirer les identifiants de test (`demo`, `admin`)
- [ ] Ajouter les vrais identifiants des utilisateurs
- [ ] Vérifier que tous les identifiants sont en minuscules
- [ ] Tester la connexion avec chaque identifiant
- [ ] Vérifier que les routes sont bien protégées
- [ ] Documenter la liste des utilisateurs autorisés

---

**Date de création** : 21 octobre 2025  
**Version** : 1.0  
**Auteur** : Assistant IA

