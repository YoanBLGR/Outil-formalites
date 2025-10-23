# Guide rapide - Test Guichet Unique pour EI

## 🎯 Objectif

Ce guide vous explique comment tester l'intégration complète avec le Guichet Unique INPI pour les Entrepreneurs Individuels (EI).

## 📋 Prérequis

1. **Installation des dépendances**
   ```bash
   npm install
   ```

2. **Configuration du Guichet Unique** (optionnel pour le dry-run)
   
   Copiez le fichier `env.example` vers `.env` :
   ```bash
   cp env.example .env
   ```
   
   Éditez `.env` et ajoutez vos credentials GU :
   ```env
   VITE_GU_API_URL=https://guichet-unique.inpi.fr
   VITE_GU_USERNAME=votre_username_test
   VITE_GU_PASSWORD=votre_password_test
   ```
   
   ⚠️ **Important** : Utilisez UNIQUEMENT un compte de TEST !

## 🚀 Utilisation

### Option 1 : Mode Dry-run (Simulation - Recommandé)

Ce mode valide et affiche la structure JSON sans créer de formalité :

```bash
npm run test:gu-ei
```

**Résultat** : 
- ✅ Validation des données
- ✅ Génération de la structure JSON
- ✅ Affichage du résumé
- ❌ Pas de création réelle

### Option 2 : Mode Création réelle

Ce mode crée une vraie formalité sur le GU (nécessite `.env` configuré) :

```bash
npm run test:gu-ei:create
```

**Résultat** :
- ✅ Validation des données
- ✅ Génération de la structure JSON
- ✅ Affichage du résumé
- ✅ **Création réelle sur le GU**
- ✅ Retour de l'ID et de l'URL de la formalité

## 📊 Exemple de sortie

### Mode Dry-run

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
  Nationalité: Française
  Situation matrimoniale: Marié
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
  Référence mandataire: TEST-EI-2024-001
  Diffusion INSEE: O
  Diffusion commerciale: O

Entrepreneur:
  Nom: DUPONT
  Prénoms: Jean, Pierre
  Genre: Masculin
  Date naissance: 1985-03-15
  Ville naissance: Paris
  Pays naissance: FRANCE
  Nationalité: FRA
  Situation matrimoniale: 4
  Numéro sécu: 185037505600123
  Régime micro-social: Oui
  Périodicité: Mensuelle

Établissement principal:
  Rôle: 2
  Enseigne: JD Conseil
  Établissement principal: Oui
  Adresse: 25 Rue de la République
  Code postal: 75011
  Commune: PARIS
  Activité: Conseil en stratégie et organisation d'entreprise

----------------------------------------------------------------------
  ÉTAPE 4 : Structure JSON complète
----------------------------------------------------------------------

Formalité générée:
{
  "companyName": "JD Conseil",
  "referenceMandataire": "TEST-EI-2024-001",
  "nomDossier": "Création EI Jean Pierre DUPONT",
  "typeFormalite": "C",
  "diffusionINSEE": "O",
  "diffusionCommerciale": "O",
  "indicateurEntreeSortieRegistre": true,
  "typePersonne": "P",
  "content": {
    "natureCreation": {
      "dateCreation": "2024-10-22",
      "microEntreprise": true,
      "etablieEnFrance": true,
      "societeEtrangere": false
    },
    "personnePhysique": {
      ...
    }
  }
}

======================================================================
  RÉSUMÉ DU TEST
======================================================================

✅ Validation: OK
✅ Mapping: OK
⏭️  Création: Non effectuée (mode dry-run)

🎉 Test terminé avec succès !
```

## 🔧 Personnalisation

Pour tester avec vos propres données, éditez `scripts/test-gu-ei.ts` :

```typescript
const testEI: EntrepreneurIndividuel = {
  genre: 'M',
  prenoms: 'Votre Prénom',
  nomNaissance: 'VOTRE NOM',
  dateNaissance: '1990-01-01',
  villeNaissance: 'Votre Ville',
  // ... modifiez selon vos besoins
}
```

## ❓ Dépannage

### Erreur : "Configuration du Guichet Unique manquante"

**Solution** : Créez un fichier `.env` avec vos credentials (voir section Prérequis)

### Erreur : "Validation échouée"

**Solution** : Vérifiez que toutes les données obligatoires sont renseignées. Le script affiche la liste des erreurs.

### Erreur : "Format d'adresse invalide"

**Solution** : Les adresses doivent être au format : `"25 Rue de la République 75011 PARIS"`

### Erreur 401 : "Échec de l'authentification"

**Solution** : Vérifiez vos identifiants dans `.env`

### Erreur 400 : "Erreur de validation GU"

**Solution** : Consultez les erreurs détaillées affichées. Le format des données ne correspond pas aux attentes du GU.

## 📚 Documentation

- **README détaillé** : `scripts/README-TEST-GU-EI.md`
- **Structure attendue** : `SHEMA.txt` (lignes 37-334 pour les EI)
- **Mapper EI** : `src/utils/gu-mapper-ei.ts`
- **Types GU** : `src/types/guichet-unique.ts`

## ✅ Checklist avant le test

- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env` créé (pour mode `--create` uniquement)
- [ ] Credentials GU ajoutés (compte de TEST uniquement)
- [ ] Script exécuté en mode dry-run d'abord
- [ ] Structure JSON vérifiée
- [ ] Prêt pour la création réelle

## 🎯 Prochaines étapes

Après un test réussi :

1. **Vérifier la formalité créée** sur le portail GU (URL affichée)
2. **Tester avec différents profils** (marié, pacsé, célibataire, etc.)
3. **Tester les cas d'erreur** (données manquantes, formats invalides)
4. **Intégrer dans l'application** : utiliser le bouton "Saisir au Guichet Unique" dans un dossier EI

---

💡 **Astuce** : Commencez toujours par le mode dry-run pour vérifier la structure avant de créer réellement !

