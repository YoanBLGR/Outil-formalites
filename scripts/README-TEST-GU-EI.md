# Script de test - Intégration Guichet Unique pour EI

Ce script permet de tester l'intégration complète avec le Guichet Unique INPI pour les Entrepreneurs Individuels (EI).

## Prérequis

1. Node.js et npm installés
2. Dépendances du projet installées (`npm install`)
3. Pour la création réelle : fichier `.env` configuré avec les credentials GU

## Configuration du fichier .env (optionnel)

Pour tester la création réelle d'une formalité, créez un fichier `.env` à la racine du projet :

```env
VITE_GU_API_URL=https://guichet-unique.inpi.fr
VITE_GU_USERNAME=votre_username
VITE_GU_PASSWORD=votre_password
```

## Utilisation

### Mode 1 : Dry-run (simulation, mode par défaut)

Ce mode valide les données et génère la structure JSON sans créer de formalité :

```bash
npm run test:gu-ei
```

ou

```bash
npx ts-node scripts/test-gu-ei.ts
```

ou

```bash
npx ts-node scripts/test-gu-ei.ts --dry-run
```

### Mode 2 : Création réelle

Ce mode crée réellement une formalité sur le Guichet Unique (nécessite `.env` configuré) :

```bash
npm run test:gu-ei:create
```

ou

```bash
npx ts-node scripts/test-gu-ei.ts --create
```

⚠️ **Attention** : Ce mode crée une vraie formalité sur le GU. À n'utiliser qu'avec un compte de test !

## Fonctionnalités du script

Le script effectue les étapes suivantes :

### 1. Affichage des informations du dossier test

- Affiche toutes les données de l'entrepreneur individuel
- Affiche les informations du client
- Permet de vérifier que les données de test sont correctes

### 2. Validation des données

- Valide que tous les champs obligatoires sont remplis
- Valide le format des adresses
- Valide le format du numéro de sécurité sociale
- Affiche les erreurs de validation détaillées

### 3. Mapping vers le format Guichet Unique

- Convertit les données Formalyse → format GU
- Applique les transformations nécessaires :
  - Calcul du code INSEE
  - Génération/normalisation du numéro de sécurité sociale
  - Mapping des codes (situation matrimoniale, etc.)
  - Parsing des adresses

### 4. Affichage de la structure JSON

- Affiche la structure complète de la formalité générée
- Affiche un résumé des champs clés
- Tronque l'affichage si la structure est trop volumineuse

### 5. Création de la formalité (mode --create uniquement)

- Envoie la formalité au Guichet Unique via l'API
- Affiche la réponse du serveur (ID, statut, URL)
- Gère les erreurs et affiche les messages détaillés

## Exemple de sortie

### Mode dry-run

```
======================================================================
  TEST INTÉGRATION GUICHET UNIQUE - ENTREPRENEUR INDIVIDUEL
======================================================================

Mode: DRY-RUN (simulation)
Date: 22/10/2024 14:30:45

----------------------------------------------------------------------
  ÉTAPE 1 : Informations du dossier test
----------------------------------------------------------------------

Dossier:
  Numéro: TEST-EI-2024-001
  Type: EI

Entrepreneur Individuel:
  Nom complet: Jean Pierre DUPONT
  Nom commercial: JD Conseil
  Date de naissance: 1985-03-15
  Ville de naissance: Paris
  ...

----------------------------------------------------------------------
  ÉTAPE 2 : Validation des données
----------------------------------------------------------------------

✅ Validation réussie : toutes les données sont complètes

----------------------------------------------------------------------
  ÉTAPE 3 : Mapping vers le format Guichet Unique
----------------------------------------------------------------------

✅ Mapping réussi

Résumé de la formalité:
  Nom: JD Conseil
  Type formalité: C (Création)
  Type personne: P (Personne Physique)
  ...

----------------------------------------------------------------------
  ÉTAPE 4 : Structure JSON complète
----------------------------------------------------------------------

Formalité générée:
{
  "companyName": "JD Conseil",
  "typeFormalite": "C",
  "typePersonne": "P",
  ...
}

----------------------------------------------------------------------
  ÉTAPE 5 : Simulation terminée
----------------------------------------------------------------------

✅ Test en mode dry-run terminé avec succès

💡 Pour créer réellement la formalité sur le GU, lancez:
   npx ts-node scripts/test-gu-ei.ts --create
```

### Mode create (avec succès)

```
----------------------------------------------------------------------
  ÉTAPE 5 : Création de la formalité sur le Guichet Unique
----------------------------------------------------------------------

🚀 Création de la formalité en cours...

✅ Formalité créée avec succès !

Réponse du Guichet Unique:
  ID: 12345678-abcd-1234-5678-abcdef123456
  Statut: DRAFT
  Date création: 2024-10-22T14:30:45Z
  URL: https://guichet-unique.inpi.fr/formalities/12345678-abcd-1234-5678-abcdef123456
  Référence: REF-2024-001

======================================================================
  RÉSUMÉ DU TEST
======================================================================

✅ Validation: OK
✅ Mapping: OK
✅ Création: OK

🎉 Test terminé avec succès !
```

## Personnalisation des données de test

Pour tester avec vos propres données, modifiez les constantes dans le fichier `scripts/test-gu-ei.ts` :

- `testClient` : informations du client
- `testEI` : informations de l'entrepreneur individuel
- `testDossier` : informations générales du dossier

## Résolution des problèmes

### Erreur : "Configuration du Guichet Unique manquante"

→ Créez un fichier `.env` avec vos credentials GU (voir section Configuration ci-dessus)

### Erreur : "Validation échouée"

→ Vérifiez que toutes les données obligatoires sont renseignées dans `testEI`
→ Consultez la liste des erreurs affichées par le script

### Erreur : "Format d'adresse invalide"

→ Les adresses doivent suivre le format : "Numéro Type Voie Code Postal Ville"
→ Exemple : "25 Rue de la République 75011 PARIS"

### Erreur d'authentification (401)

→ Vérifiez vos credentials dans le fichier `.env`
→ Assurez-vous que votre compte GU est actif

### Erreur de validation GU (400)

→ Consultez les erreurs détaillées affichées par le script
→ Vérifiez que les données respectent les contraintes de l'API GU

## Notes importantes

1. **Environnement de test** : Utilisez toujours un compte de test GU, jamais un compte de production
2. **Données personnelles** : Les données dans le script sont fictives, n'utilisez jamais de vraies données personnelles
3. **Numéro de sécurité sociale** : Le script génère automatiquement un numéro valide si celui fourni n'est pas au bon format
4. **Codes INSEE** : Le script utilise un mapping limité de villes françaises, vous pouvez l'étendre si nécessaire

## Support

En cas de problème :
1. Vérifiez les logs d'erreur détaillés affichés par le script
2. Consultez la documentation de l'API Guichet Unique
3. Vérifiez le fichier `SHEMA.txt` pour la structure attendue

