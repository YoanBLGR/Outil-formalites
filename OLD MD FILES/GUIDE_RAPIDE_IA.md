# 🚀 Guide Rapide - Activation IA

## ⚠️ **Erreur Actuelle**
```
OpenAIError: Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.
```

## ✅ **Solution en 3 Étapes**

### 1️⃣ **Obtenez votre clé API**
- Allez sur [OpenAI Platform](https://platform.openai.com/api-keys)
- Créez un compte ou connectez-vous
- Cliquez sur "Create new secret key"
- Copiez la clé (commence par `sk-...`)

### 2️⃣ **Configurez la clé**
Éditez le fichier `.env.local` et remplacez :
```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
```
Par :
```bash
VITE_OPENAI_API_KEY=sk-votre_vraie_cle_api_ici
```

### 3️⃣ **Redémarrez**
```bash
npm run dev
```

## 🎯 **Fonctionnalités Débloquées**

✅ **Chat Assistant** - Bouton 💬 en bas à droite  
✅ **Suggestions IA** - Bouton ✨ Suggérer sur l'objet social  
✅ **Validation Automatique** - Vérification en temps réel  
✅ **Analyse Intelligente** - Score de conformité  

## 🔧 **Dépannage**

- **Clé invalide** : Vérifiez que votre clé commence par `sk-`
- **Pas de réponse** : Vérifiez vos crédits OpenAI
- **Erreur réseau** : Vérifiez votre connexion internet

---

**💡 Conseil** : Gardez votre clé API privée et ne la partagez jamais !
