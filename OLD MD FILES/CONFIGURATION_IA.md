# 🔑 Configuration IA - Formalyse v3

## ⚠️ **Erreur Actuelle**
```
OpenAIError: Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.
```

## ✅ **Solution**

### 1. **Obtenez votre clé API OpenAI**
1. Rendez-vous sur [OpenAI Platform](https://platform.openai.com/api-keys)
2. Connectez-vous ou créez un compte
3. Cliquez sur "Create new secret key"
4. Copiez la clé générée (commence par `sk-...`)

### 2. **Configurez votre clé API**
Éditez le fichier `.env.local` et remplacez `your_openai_api_key_here` par votre vraie clé :

```bash
# Configuration IA pour Formalyse v3
VITE_OPENAI_API_KEY=sk-votre_vraie_cle_api_ici
VITE_AI_ENABLED=true
```

### 3. **Redémarrez l'application**
```bash
npm run dev
```

## 🎯 **Fonctionnalités IA Disponibles**

Une fois configuré, vous aurez accès à :

### 🤖 **Chat Assistant**
- Cliquez sur le bouton 💬 en bas à droite
- Posez vos questions sur vos statuts EURL
- Recevez des conseils juridiques spécialisés

### ✨ **Suggestions Intelligentes**
- Tapez dans le champ "Objet social"
- Cliquez sur "✨ Suggérer"
- Appliquez les suggestions proposées

### ✅ **Validation Automatique**
- Vérification de cohérence des statuts
- Détection des clauses obligatoires manquantes
- Score de conformité (0-100)

## 🔧 **Dépannage**

### L'IA ne fonctionne toujours pas ?
1. Vérifiez que votre clé API est correcte
2. Assurez-vous que `VITE_AI_ENABLED=true`
3. Redémarrez complètement l'application
4. Vérifiez la console pour les erreurs

### Suggestions ne s'affichent pas ?
1. Vérifiez que le champ contient du texte
2. Attendez quelques secondes pour le chargement
3. Vérifiez votre connexion internet

### Chat ne répond pas ?
1. Vérifiez votre clé API OpenAI
2. Assurez-vous d'avoir des crédits disponibles
3. Vérifiez les logs dans la console

## 💡 **Conseils d'Utilisation**

### Pour de meilleurs résultats
- Soyez précis dans vos questions
- Utilisez le contexte de vos statuts
- Appliquez les suggestions proposées
- Validez régulièrement vos modifications

### Optimisation des coûts
- Le cache réduit les appels API
- Les suggestions sont mises en cache
- La validation est optimisée
- Le chat utilise le contexte efficacement

## 🚨 **Sécurité**

⚠️ **Important** : Ne partagez jamais votre clé API OpenAI publiquement !

- Gardez votre fichier `.env.local` privé
- Ne commitez jamais ce fichier dans Git
- Utilisez des clés API différentes pour dev/prod

---

**Note** : Cette intégration IA utilise GPT-5 d'OpenAI. Assurez-vous de respecter les conditions d'utilisation et les limites de votre compte OpenAI.
