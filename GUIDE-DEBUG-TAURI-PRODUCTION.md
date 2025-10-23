# Guide de diagnostic : Guichet Unique en production Tauri

## Problème : "Erreur de connexion au Guichet Unique : failed to fetch"

Ce guide vous aide à diagnostiquer et résoudre l'erreur en production Tauri.

---

## 🔍 ÉTAPE 1 : Vérifier les variables d'environnement

### Problème le plus fréquent
Les variables d'environnement du fichier `.env` **ne sont pas automatiquement disponibles** dans un build Tauri. Elles doivent être présentes **au moment du build** et sont compilées dans le JavaScript.

### Solution

#### A. Vérifiez que `.env` existe à la racine du projet

```bash
# Doit contenir :
VITE_GU_API_URL=https://guichet-unique-demo.inpi.fr
VITE_GU_USERNAME=votre_username_ici
VITE_GU_PASSWORD=votre_password_ici
VITE_GU_API_KEY=
```

#### B. Rebuilder APRÈS avoir créé/modifié `.env`

```bash
# 1. Assurez-vous que .env est présent
cat .env  # Ou type .env sur Windows

# 2. Synchronisez les versions
npm run sync-versions

# 3. Rebuild l'application
npm run tauri:build
```

**⚠️ IMPORTANT** : Toute modification du `.env` nécessite un rebuild complet !

---

## 🔍 ÉTAPE 2 : Activer la console de développement

Pour voir les erreurs détaillées dans Tauri :

### Sur Windows
1. Lancez votre application Tauri
2. Appuyez sur `F12` ou `Ctrl+Shift+I`
3. Regardez l'onglet "Console"

### Sur macOS
1. Lancez votre application Tauri
2. Appuyez sur `Cmd+Option+I`
3. Regardez l'onglet "Console"

### Que chercher ?

Recherchez des messages comme :
- ❌ `Cannot read properties of undefined` → Variables d'environnement manquantes
- ❌ `Configuration du Guichet Unique manquante` → `.env` non présent au build
- ❌ `401` → Identifiants incorrects
- ❌ `ETIMEDOUT` / `ECONNREFUSED` → Problème réseau

---

## 🔍 ÉTAPE 3 : Ajouter le composant de diagnostic (temporaire)

Pour voir exactement quelles variables sont chargées :

### 1. Ouvrez `src/pages/Dashboard.tsx`

### 2. Ajoutez l'import au début du fichier :

```typescript
import { GUConfigDebug } from '../components/guichet-unique/GUConfigDebug'
```

### 3. Ajoutez le composant dans le render (après les cartes de statistiques) :

```typescript
// Après la section des statistiques, ajoutez :
<GUConfigDebug />
```

### 4. Rebuild et relancez :

```bash
npm run tauri:dev
```

### 5. Regardez le Dashboard

Vous verrez une carte avec :
- ✅ ou ❌ pour chaque variable
- Les valeurs (masquées par défaut)
- Des instructions de correction

### 6. SUPPRIMEZ le composant une fois le diagnostic fait

---

## 🔍 ÉTAPE 4 : Tester la connexion

Dans la console du navigateur (F12), tapez :

```javascript
// Vérifier les variables
console.log('API URL:', import.meta.env.VITE_GU_API_URL)
console.log('Username défini:', !!import.meta.env.VITE_GU_USERNAME)
console.log('Password défini:', !!import.meta.env.VITE_GU_PASSWORD)
```

---

## 🔧 Solutions courantes

### Solution 1 : Rebuild avec les bonnes variables

```bash
# 1. Créez/vérifiez .env à la racine
echo "VITE_GU_API_URL=https://guichet-unique-demo.inpi.fr" > .env
echo "VITE_GU_USERNAME=votre_username" >> .env
echo "VITE_GU_PASSWORD=votre_password" >> .env

# 2. Rebuild
npm run tauri:build

# 3. Lancez l'app buildée
# Windows : .\src-tauri\target\release\formalyse-app.exe
# Le fichier .exe se trouve dans src-tauri/target/release/
```

### Solution 2 : Vérifier l'URL de l'API

Assurez-vous d'utiliser la bonne URL :

- **Démo/Test** : `https://guichet-unique-demo.inpi.fr`
- **Production** : `https://guichet-unique.inpi.fr`

### Solution 3 : Vérifier les identifiants

1. Testez vos identifiants sur le site web directement : https://guichet-unique-demo.inpi.fr
2. Si ça ne fonctionne pas, contactez l'INPI pour réinitialiser

### Solution 4 : Problème de certificat SSL (rare)

Si vous voyez une erreur de certificat, essayez :

```bash
# En dev seulement (pas en production !)
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
npm run tauri:dev
```

---

## 📋 Checklist de vérification

Cochez au fur et à mesure :

- [ ] Le fichier `.env` existe à la racine du projet
- [ ] Le `.env` contient `VITE_GU_API_URL`
- [ ] Le `.env` contient `VITE_GU_USERNAME`
- [ ] Le `.env` contient `VITE_GU_PASSWORD`
- [ ] J'ai rebuild APRÈS avoir créé/modifié `.env`
- [ ] La console (F12) ne montre pas d'erreur "Configuration manquante"
- [ ] Je peux me connecter manuellement sur le site GU avec mes identifiants
- [ ] Mon ordinateur a accès à internet

---

## 🆘 Si rien ne fonctionne

### Créez un dossier de test minimal

```bash
# 1. Vérifiez que le script de test fonctionne
npm run test:gu-ei

# Si ça fonctionne, le problème est dans l'UI
# Si ça ne fonctionne pas, le problème est dans la config ou les credentials
```

### Logs détaillés

Ouvrez `src/services/guichet-unique-api.ts` et ajoutez temporairement des logs :

```typescript
// Dans la fonction getConfigFromEnv()
console.log('🔍 DEBUG Config:', {
  hasApiUrl: !!apiUrl,
  hasUsername: !!username,
  hasPassword: !!password,
  apiUrl: apiUrl?.substring(0, 20) + '...',
})
```

Puis rebuild et vérifiez la console.

---

## 📞 Support

Si le problème persiste après avoir suivi tous ces steps :

1. **Partagez** :
   - Les logs de la console (F12)
   - Le résultat du composant `GUConfigDebug`
   - La version de votre app (visible dans le Dashboard)

2. **Vérifiez** que vous utilisez bien :
   - L'application Tauri (pas la version web)
   - Un build récent (après modification du `.env`)

---

## ✅ Une fois résolu

1. Supprimez le composant `GUConfigDebug` du Dashboard
2. Testez la création d'une formalité EI
3. Vérifiez sur https://guichet-unique-demo.inpi.fr que la formalité apparaît

---

## 🔐 Sécurité

**Important** : Ne commitez JAMAIS le fichier `.env` avec vos vrais identifiants !

Ajoutez dans `.gitignore` :
```
.env
.env.local
.env.production
```

Utilisez `.env.example` comme modèle sans credentials.

