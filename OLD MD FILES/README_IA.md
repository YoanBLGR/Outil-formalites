# Formalyse v3 - Intégration IA GPT-5

## 🚀 Fonctionnalités IA Intégrées

### 1. **Assistant Chat Contextuel**
- Chat intelligent spécialisé dans les EURL françaises
- Réponses contextuelles basées sur vos statuts en cours
- Questions suggérées automatiquement
- Interface moderne avec markdown

### 2. **Suggestions Intelligentes**
- Suggestions d'objet social optimisées
- Formulations juridiques améliorées
- Clauses optionnelles pertinentes
- Paramètres recommandés

### 3. **Validation Automatique**
- Vérification de cohérence des statuts
- Détection des clauses obligatoires manquantes
- Validation des champs individuels
- Score de conformité

### 4. **Auto-remplissage Intelligent**
- Pré-remplissage basé sur les documents fournis
- Extraction automatique de données
- Suggestions contextuelles

### 5. **Analyse de Documents**
- Analyse de KBIS, pièces d'identité
- Extraction de données structurées
- Validation de conformité

### 6. **Génération de Documents Annexes**
- Procès-verbaux automatiques
- Déclarations M0
- Checklists personnalisées
- Clauses spécialisées

## ⚙️ Configuration Requise

### 1. Clé API OpenAI
```bash
# Créez un fichier .env à la racine du projet
VITE_OPENAI_API_KEY=votre_cle_api_openai
VITE_AI_ENABLED=true
VITE_AI_DEBUG=false
```

### 2. Obtenir une clé API
1. Rendez-vous sur [OpenAI Platform](https://platform.openai.com/api-keys)
2. Créez un compte ou connectez-vous
3. Générez une nouvelle clé API
4. Copiez-la dans votre fichier `.env`

### 3. Redémarrage
```bash
npm run dev
```

## 🎯 Utilisation

### Chat Assistant
- Cliquez sur le bouton 💬 en bas à droite
- Posez vos questions sur vos statuts
- Recevez des conseils juridiques spécialisés

### Suggestions Inline
- Tapez dans le champ "Objet social"
- Cliquez sur "✨ Suggérer"
- Appliquez les suggestions proposées

### Validation Automatique
- La validation se fait en temps réel
- Consultez les erreurs et avertissements
- Suivez les suggestions d'amélioration

## 🔧 Architecture Technique

### Services IA
- `ai-validation.ts` - Validation et vérification
- `ai-suggestions.ts` - Suggestions intelligentes
- `ai-chat.ts` - Chat contextuel
- `ai-autofill.ts` - Auto-remplissage
- `ai-analysis.ts` - Analyse de documents
- `ai-generation.ts` - Génération de documents

### Composants UI
- `AIChat.tsx` - Interface de chat
- `InlineSuggestions.tsx` - Suggestions inline
- `ValidationPanel.tsx` - Panneau de validation
- `DocumentAnalyzer.tsx` - Analyseur de documents
- `DocumentGenerator.tsx` - Générateur de documents

### Configuration
- `openai.ts` - Client OpenAI avec GPT-5
- `ai-cache.ts` - Système de cache optimisé
- `ai-config.ts` - Configuration et vérification

## 📊 Optimisations

### Cache Intelligent
- Cache des réponses IA pour réduire les coûts
- TTL adaptatif selon le type de requête
- Nettoyage automatique des entrées expirées

### Rate Limiting
- Limitation des requêtes par utilisateur
- Gestion des quotas OpenAI
- Fallback gracieux en cas d'erreur

### Sécurité
- Validation des entrées utilisateur
- Sanitisation des données
- Gestion sécurisée des clés API

## 🚨 Dépannage

### L'IA ne fonctionne pas
1. Vérifiez que votre clé API est correcte
2. Assurez-vous que `VITE_AI_ENABLED=true`
3. Redémarrez l'application
4. Vérifiez la console pour les erreurs

### Suggestions ne s'affichent pas
1. Vérifiez que le champ contient du texte
2. Attendez quelques secondes pour le chargement
3. Vérifiez votre connexion internet

### Chat ne répond pas
1. Vérifiez votre clé API OpenAI
2. Assurez-vous d'avoir des crédits disponibles
3. Vérifiez les logs dans la console

## 💡 Conseils d'Utilisation

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

## 🔮 Roadmap

### Prochaines fonctionnalités
- [ ] Support multi-langues
- [ ] Intégration avec d'autres modèles IA
- [ ] Analyse de documents PDF
- [ ] Génération de contrats
- [ ] Assistant vocal
- [ ] Intégration CRM

---

**Note** : Cette intégration IA utilise GPT-5 d'OpenAI. Assurez-vous de respecter les conditions d'utilisation et les limites de votre compte OpenAI.
