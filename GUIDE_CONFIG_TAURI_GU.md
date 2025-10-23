# Configuration Tauri pour le Guichet Unique

## 🔒 Sécurité Tauri

Tauri v2 utilise un système de permissions strict pour protéger l'application. Par défaut, **aucune requête HTTP externe n'est autorisée**.

## ⚙️ Configuration des permissions HTTP

### Fichier de configuration

Les permissions HTTP sont définies dans :
```
src-tauri/capabilities/default.json
```

### Domaines autorisés pour le Guichet Unique

Les domaines suivants ont été ajoutés :

```json
{
  "identifier": "http:default",
  "allow": [
    {
      "url": "https://guichet-unique-demo.inpi.fr/*"
    },
    {
      "url": "https://api.guichet-unique.inpi.fr/*"
    },
    {
      "url": "https://procedures.inpi.fr/*"
    }
  ]
}
```

### Domaines couverts

1. **`guichet-unique-demo.inpi.fr`** : Environnement de démonstration/staging
2. **`api.guichet-unique.inpi.fr`** : API de production
3. **`procedures.inpi.fr`** : Portail de procédures (alternatif)

## 🔧 Ajouter un nouveau domaine

Si vous devez autoriser un autre domaine :

1. **Éditez** `src-tauri/capabilities/default.json`

2. **Ajoutez** l'URL dans la section `allow` :
   ```json
   {
     "url": "https://nouveau-domaine.fr/*"
   }
   ```

3. **Rebuild** l'application :
   ```bash
   npm run tauri:build
   ```

## ⚠️ Erreur "url not allowed on the configured scope"

### Symptôme

```
Error: url not allowed on the configured scope: https://example.com/api/endpoint
```

### Cause

L'URL que vous essayez d'appeler n'est pas autorisée dans les permissions Tauri.

### Solution

1. Identifiez le domaine exact de l'URL
2. Ajoutez-le dans `src-tauri/capabilities/default.json`
3. Rebuild l'application

### Exemple

Si vous obtenez :
```
url not allowed: https://api.example.com/user/login
```

Ajoutez :
```json
{
  "url": "https://api.example.com/*"
}
```

## 🔍 Wildcard (*) dans les URLs

- `https://example.com/*` : Autorise **toutes** les requêtes vers ce domaine
- `https://example.com/api/*` : Autorise uniquement les requêtes vers `/api/`
- `https://*.example.com/*` : Autorise tous les sous-domaines

## 📝 Variables d'environnement

Assurez-vous que votre `.env` contient l'URL correcte :

```env
# Environnement de démo
VITE_GU_API_URL=https://guichet-unique-demo.inpi.fr

# OU environnement de production
VITE_GU_API_URL=https://api.guichet-unique.inpi.fr
```

**Important** : L'URL dans `.env` doit correspondre à un domaine autorisé dans `default.json`.

## 🚀 Rebuild après modification

Après toute modification de `default.json` ou `.env`, vous **devez** rebuilder :

```bash
npm run tauri:build
```

Les configurations sont compilées dans l'application au moment du build.

## 🔐 Bonnes pratiques de sécurité

1. **N'autorisez que les domaines nécessaires** - Ne pas ajouter `https://*/*`
2. **Utilisez des domaines spécifiques** - Évitez les wildcards trop larges
3. **Testez en dev avant prod** - Vérifiez que tout fonctionne en développement
4. **Documentez vos ajouts** - Notez pourquoi chaque domaine est autorisé

## 📚 Documentation officielle

- [Tauri v2 Permissions](https://v2.tauri.app/learn/security/capabilities/)
- [Plugin HTTP](https://v2.tauri.app/plugin/http/)
- [Security Best Practices](https://v2.tauri.app/learn/security/)

## 🐛 Débogage

Pour voir quelle URL est bloquée, consultez les logs de débogage GU dans l'application. L'erreur affichera l'URL exacte qui doit être autorisée.

