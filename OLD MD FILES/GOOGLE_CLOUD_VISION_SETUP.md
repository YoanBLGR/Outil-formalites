# 🚀 Configuration Google Cloud Vision API

## 📋 Vue d'ensemble

Google Cloud Vision offre une précision d'OCR de **95%+** sur les documents d'identité français (CNI, passeports, permis de conduire), bien supérieure à Tesseract.js (75-85%).

### Avantages
✅ Précision excellente (95%+)
✅ Support CNI + Passeports + Permis
✅ Pas de prétraitement nécessaire
✅ Rapide (< 2 secondes)
✅ 1000 requêtes **gratuites**/mois

### Tarification
- **0-1000 requêtes/mois** : GRATUIT 🎉
- **1001-5000000 requêtes** : $1.50 / 1000 requêtes
- **5000001+ requêtes** : $0.60 / 1000 requêtes

👉 Pour un usage CCI typique (50-200 dossiers/mois), **c'est totalement gratuit!**

---

## 🛠️ Configuration (5 minutes)

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Sélectionner un projet"** en haut
4. Cliquez sur **"Nouveau projet"**
5. Nommez votre projet : `formalyse-ocr` (ou autre nom)
6. Cliquez sur **"Créer"**

### Étape 2 : Activer l'API Cloud Vision

1. Dans le menu ☰ (hamburger), allez dans **"API et services" > "Bibliothèque"**
2. Recherchez `Cloud Vision API`
3. Cliquez sur **"Cloud Vision API"**
4. Cliquez sur **"ACTIVER"** (le bouton bleu)
5. Attendez quelques secondes ⏳

### Étape 3 : Créer une clé API

1. Dans le menu ☰, allez dans **"API et services" > "Identifiants"**
2. Cliquez sur **"+ CRÉER DES IDENTIFIANTS"** en haut
3. Sélectionnez **"Clé API"**
4. Une clé API est générée ! 🎉

   Exemple : `AIzaSyD...abc123xyz`

5. **IMPORTANT** : Cliquez sur **"RESTREINDRE LA CLÉ"** pour sécuriser

### Étape 4 : Restreindre la clé (SÉCURITÉ)

Pour éviter les abus, restreignez votre clé :

**Option A : Restrictions d'application (Recommandé pour dev)**
- Sélectionnez : **"Référents HTTP (sites Web)"**
- Ajoutez : `http://localhost:*/*`
- Ajoutez : `http://127.0.0.1:*/*`
- Pour production, ajoutez votre domaine : `https://votredomaine.com/*`

**Option B : Restrictions d'API (Encore plus sécurisé)**
- Sélectionnez : **"Restreindre la clé"**
- Cochez uniquement : **"Cloud Vision API"**

Cliquez sur **"ENREGISTRER"**

### Étape 5 : Configurer Formalyse

1. Copiez votre clé API
2. Dans votre projet Formalyse, créez un fichier `.env` :

```bash
# Copiez .env.example vers .env
cp .env.example .env
```

3. Ouvrez `.env` et collez votre clé :

```bash
VITE_GOOGLE_CLOUD_VISION_API_KEY=AIzaSyD...votre_cle_ici
```

4. **Relancez l'application** :

```bash
npm run dev
```

5. ✅ **C'est prêt !** L'application utilisera automatiquement Google Vision

---

## ✅ Vérification

Pour vérifier que Google Vision est actif :

1. Ouvrez l'application
2. Allez dans **"Nouveau dossier"**
3. À côté du titre "Scannez votre CNI", vous devriez voir un badge :
   - ✨ **"Google Cloud Vision (95%+)"** = Configuré ✅
   - ⚡ **"Tesseract.js (75-85%)"** = Non configuré ❌

4. Uploadez une CNI de test
5. Regardez la console du navigateur (F12) :
   - Vous devriez voir : `🚀 Utilisation de Google Cloud Vision (haute précision)`

---

## 🔍 Dépannage

### Problème : "Clé API invalide"

**Causes possibles :**
- Clé mal copiée (espaces, caractères manquants)
- API Cloud Vision pas activée
- Restrictions trop strictes

**Solutions :**
1. Vérifiez que la clé est complète (commence par `AIza`)
2. Retournez sur Google Cloud Console
3. Vérifiez que Cloud Vision API est **ACTIVÉE**
4. Dans Identifiants, testez de désactiver temporairement les restrictions

### Problème : "Quota dépassé"

**Cause :** Vous avez dépassé 1000 requêtes/mois

**Solutions :**
- Attendez le mois prochain (quota reset)
- OU configurez la facturation sur Google Cloud (payant après 1000)
- OU désactivez temporairement Google Vision (retour à Tesseract)

Pour désactiver Google Vision :
```bash
# Dans .env, commentez la ligne :
# VITE_GOOGLE_CLOUD_VISION_API_KEY=...
```

### Problème : "CORS error"

**Cause :** Restrictions de sécurité du navigateur

**Solution :**
1. Vérifiez que vous avez bien ajouté `http://localhost:*/*` dans les restrictions HTTP
2. Redémarrez l'application (`npm run dev`)
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Problème : Badge affiche "Tesseract.js"

**Causes :**
- Fichier `.env` pas créé
- Variable mal nommée
- Application pas relancée

**Solutions :**
1. Vérifiez que `.env` existe à la racine du projet
2. Vérifiez le nom exact : `VITE_GOOGLE_CLOUD_VISION_API_KEY`
3. Relancez : `npm run dev`
4. Rechargez la page (F5)

---

## 🎯 Test de fonctionnement

### Test 1 : CNI française

1. Prenez une photo nette de votre CNI
2. Uploadez dans "Nouveau dossier"
3. Attendez 2-3 secondes
4. **Résultat attendu** :
   - ✅ Confiance : 90%+
   - ✅ Nom, prénom extraits correctement
   - ✅ Civilité détectée
   - ✅ Date de naissance formatée

### Test 2 : Passeport français

1. Photographiez un passeport (page identité)
2. Uploadez
3. **Résultat attendu** :
   - ✅ Confiance : 85%+
   - ✅ Données principales extraites
   - ⚠️ Mise en page plus complexe, peut nécessiter vérification

### Test 3 : Photo floue

1. Prenez une photo volontairement floue
2. Uploadez
3. **Résultat attendu** :
   - ⚠️ Confiance : 50-70%
   - ⚠️ Données partielles
   - 💡 Message suggérant de reprendre la photo

---

## 📊 Monitoring de l'utilisation

### Voir votre consommation

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Menu ☰ > **"API et services" > "Tableau de bord"**
3. Sélectionnez **"Cloud Vision API"**
4. Vous verrez un graphique avec :
   - Nombre de requêtes utilisées
   - Quota restant (sur 1000)
   - Taux d'erreur

### Alertes quota

Pour recevoir une alerte avant d'atteindre 1000 requêtes :

1. Menu ☰ > **"Facturation" > "Budgets et alertes"**
2. Cliquez sur **"CRÉER UN BUDGET"**
3. Configurez :
   - Budget : 0 $ (gratuit)
   - Alerte : 90% du quota
   - Email : votre email
4. Vous recevrez un email à 900 requêtes

---

## 💰 Optimisation des coûts

### Conseils pour rester dans le gratuit

✅ **N'uploadez que les documents nécessaires**
- Évitez les tests répétés sur la même CNI
- Utilisez le mode "édition manuelle" pour les corrections

✅ **Utilisez le cache navigateur**
- Les données extraites sont mémorisées
- Pas de re-scan si vous retournez en arrière

✅ **Mode hybride** (déjà implémenté)
- Google Vision pour CNI/passeports complexes
- Tesseract pour documents simples

### Si vous dépassez 1000 requêtes/mois

**Option 1 : Activer la facturation**
- Coût après 1000 : $1.50 / 1000 requêtes
- Pour 100 dossiers/mois supplémentaires = ~$0.15/mois

**Option 2 : Retour à Tesseract**
- Commentez `VITE_GOOGLE_CLOUD_VISION_API_KEY`
- Moins précis mais gratuit illimité

---

## 🔒 Sécurité

### ⚠️ IMPORTANT

**NE JAMAIS :**
- ❌ Commiter le fichier `.env` dans Git
- ❌ Partager votre clé API publiquement
- ❌ Exposer la clé dans le code source
- ❌ Utiliser la même clé pour plusieurs apps

**TOUJOURS :**
- ✅ Utiliser `.env` (déjà dans `.gitignore`)
- ✅ Restreindre la clé API (HTTP referrers)
- ✅ Régénérer la clé si compromise
- ✅ Monitorer l'usage anormal

### Que faire si votre clé est compromise ?

1. Allez dans Google Cloud Console
2. **"API et services" > "Identifiants"**
3. Cliquez sur votre clé API
4. Cliquez sur **"RÉGÉNÉRER LA CLÉ"**
5. Mettez à jour le `.env` avec la nouvelle clé

---

## 📚 Ressources

### Documentation officielle
- [Google Cloud Vision Docs](https://cloud.google.com/vision/docs)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [API Reference](https://cloud.google.com/vision/docs/reference/rest)

### Tutoriels vidéo
- [Getting Started with Cloud Vision](https://www.youtube.com/watch?v=eve8DkkVdhI)
- [Create and Restrict API Keys](https://www.youtube.com/watch?v=yKTHx6UQmVY)

### Support
- [Stack Overflow - google-cloud-vision](https://stackoverflow.com/questions/tagged/google-cloud-vision-api)
- [Google Cloud Support](https://cloud.google.com/support)

---

## ❓ FAQ

**Q : C'est vraiment gratuit ?**
R : Oui ! 1000 requêtes/mois gratuites. Pour usage CCI typique, c'est largement suffisant.

**Q : Mes données CNI sont-elles stockées par Google ?**
R : Non. Google Vision analyse l'image et retourne le texte, mais ne stocke pas vos documents.

**Q : Puis-je utiliser sans carte bancaire ?**
R : Oui ! Aucune carte bancaire requise pour rester sous 1000 requêtes/mois.

**Q : Quelle est la différence avec Tesseract ?**
R :
- Google Vision : 95%+ précision, rapide, cloud, 1000 gratuits/mois
- Tesseract : 75-85% précision, lent, local, illimité gratuit

**Q : Puis-je basculer entre les deux ?**
R : Oui ! Le système bascule automatiquement :
- Google Vision si configuré
- Tesseract sinon

**Q : Comment désactiver Google Vision temporairement ?**
R : Commentez la ligne dans `.env` :
```bash
# VITE_GOOGLE_CLOUD_VISION_API_KEY=...
```

**Q : Ça marche aussi pour les passeports ?**
R : Oui ! Google Vision supporte :
- CNI française (ancienne et nouvelle génération)
- Passeports français
- Permis de conduire français
- Autres documents d'identité

---

## ✅ Checklist finale

Avant de commencer à utiliser Google Vision :

- [ ] Projet Google Cloud créé
- [ ] Cloud Vision API activée
- [ ] Clé API générée
- [ ] Clé API restreinte (HTTP referrers + API)
- [ ] Fichier `.env` créé avec la clé
- [ ] Application relancée (`npm run dev`)
- [ ] Badge "Google Cloud Vision" visible
- [ ] Test avec une CNI réussie
- [ ] Monitoring configuré (optionnel)

---

**🎉 Vous êtes prêt !** Profitez d'une extraction OCR de haute qualité pour vos documents d'identité.

Pour toute question, consultez la documentation ou contactez l'équipe technique.

---

**Dernière mise à jour** : Octobre 2025
**Version** : 1.0.0
**Statut** : Production Ready ✅
