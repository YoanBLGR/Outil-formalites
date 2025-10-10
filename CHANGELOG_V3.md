# Changelog - Template Statuts EURL v3

## Vue d'ensemble

Mise à jour complète du template de statuts EURL pour correspondre exactement au modèle de référence fourni. Le template passe de 28 à 30 articles (+1 article optionnel 27 bis).

## Fichiers modifiés

### 1. **src/templates/statuts-eurl-conforme-v3.json** (NOUVEAU)
- **31 articles** au total (30 + article 27 bis optionnel)
- Texte repris **tel quel** du modèle de référence
- Ajout d'un en-tête (dénomination, capital, siège)
- Structure préambule simplifiée (2 variantes : personne physique/morale)

#### Nouveaux articles ajoutés :
- **Article 8** : Augmentation et réduction du capital social
- **Article 12** : Revendication de la qualité d'associé par le conjoint commun en biens
- **Article 20** : Conventions interdites
- **Article 21** : Comptes courants
- **Article 29** : Frais - Pouvoirs
- **Article 30** : Nomination du premier gérant (+ option fiscale)

#### Articles restructurés :
- **Articles 1-3** : Séparés en "Forme", "Objet" et "Dénomination sociale"
- **Article 6** : Apports - 7 variantes détaillées (numéraire total/partiel, nature, mixte, fonds de commerce, bien commun, PACS)
- **Article 9** : Parts sociales (+ indivisibilité, usufruit)
- **Article 11** : Admission de nouveaux associés (2 régimes : libre familial ou agrément total)
- **Article 19** : Conventions réglementées (2 sections : pluripersonnelle + unipersonnelle)
- **Article 24** : Comptes sociaux (+ dispenses micro-entreprise)
- **Article 27 bis** : Contestations / Clause compromissoire (2 variantes)

### 2. **src/types/statuts.ts**
Ajout de nouveaux types et interfaces :

```typescript
// Nouveaux types
export type RegimeCession = 'LIBRE_FAMILIAL_AGREMENT_TIERS' | 'AGREMENT_TOUTES_MUTATIONS'

export interface AdmissionAssocies { ... }
export interface CompteCourant { ... }
export interface NominationGerant { ... }
export interface DepotFonds { ... }
```

Mise à jour de `StatutsData` avec nouveaux champs :
- `sigle` (optionnel)
- `depotFonds`
- `nominationGerant`
- `admissionAssocies`
- `majoriteNominationGerant`, `majoriteRevocationGerant`, `delaiPreavisGerant`
- `limitationsPouvoirs`, `descriptionLimitationsPouvoirs`
- `compteCourant`
- `delaiArbitrage`
- `nombreExemplaires`

### 3. **src/utils/template-engine.ts**
- Import du nouveau template v3
- Mise à jour de `buildVariables()` avec **toutes les nouvelles variables** :
  - Variables pour l'associé (prénom, nom séparés + désignation)
  - Dépôt de fonds (date, établissement)
  - Admission associés (régime, majorités, modalités)
  - Gérance (majorités, délais, limitations)
  - Comptes courants (seuil)
  - Arbitrage (délai)
  - Nomination gérant (dans statuts, associé/tiers, rémunération)
  - Fraction de libération (cinquième, quart, moitié)

- Ajout de la gestion de l'en-tête dans `generateStatuts()`
- Mise à jour de `calculateProgression()` : 15 sections

### 4. **src/pages/RedactionStatuts.tsx**
Initialisation complète avec tous les nouveaux champs.

#### Nouvelles sections ajoutées au formulaire :

1. **Section 3bis : Dépôt de fonds** (conditionnel si apport en numéraire)
   - Date de dépôt
   - Établissement de dépôt

2. **Section 5bis : Admission de nouveaux associés**
   - Régime de cession (2 choix)
   - Majorités pour cessions
   - Modalités de rachat
   - Agrément en cas de décès

3. **Section 6 (étendue) : Gérance**
   - Majorités nomination/révocation
   - Délai de préavis
   - Limitations de pouvoirs (optionnel)

4. **Section 6bis : Comptes courants**
   - Seuil minimum de détention
   - Conditions particulières

5. **Section 10 (étendue) : Options**
   - Délai d'arbitrage (en mois)

6. **Section 12 : Nomination du premier gérant**
   - Nomination dans statuts ou acte séparé
   - Gérant = associé ou tiers
   - Durée de nomination
   - Rémunération fixée ou non
   - **Signatures** (lieu, date, nombre d'exemplaires)

## Variables du template

Le template v3 utilise **95 variables** au total (contre 65 dans v2), permettant une personnalisation fine de chaque article selon le contexte.

### Nouvelles variables clés :
- `sigle`, `associeDesignation`, `associePrenom`, `associeNom`
- `dateDepotFonds`, `etablissementDepot`
- `fractionLiberation` (cinquième/quart/moitié)
- `dateContratApport`, `numeroIdentificationFonds`
- `conjointPrenom`, `conjointNom`, `dateAvertissementConjoint`
- `regimeCession`, `majoriteCessionTiers`, `majoriteMutation`
- `modalitesPrixRachat`, `beneficiairesContinuation`
- `majoriteNominationGerant`, `majoriteRevocationGerant`, `delaiPreavisGerant`
- `limitationsPouvoirs`, `descriptionLimitationsPouvoirs`
- `seuilCompteCourant`
- `delaiArbitrage`
- `gerantDansStatuts`, `gerantEstAssocie`, `dureeNominationGerant`
- `remunerationGerant`, `descriptionRemunerationGerant`
- `nombreExemplaires`

## Conformité au modèle

Le template v3 reprend **textuellement** les formulations du modèle de référence :
- ✅ 30 articles numérotés de 1 à 30 (+ article 27 bis optionnel)
- ✅ Préambule avec variantes personne physique/morale
- ✅ En-tête avec dénomination, capital, RCS
- ✅ Observations incluses pour chaque article
- ✅ Toutes les variantes d'apports détaillées
- ✅ Régimes d'agrément conformes au Code de commerce
- ✅ Dispositions pour EURL unipersonnelle et SARL pluripersonnelle

## Tests

- ✅ Template JSON bien formé (31 articles)
- ✅ Pas d'erreurs de lint TypeScript
- ✅ Formulaire avec toutes les sections
- ✅ Initialisation complète des données

## Migration depuis v2

Pour migrer un dossier existant de v2 vers v3 :
1. Les champs existants sont conservés
2. Nouveaux champs initialisés avec valeurs par défaut
3. L'ancien template v2 reste disponible pour référence

## Prochaines étapes

1. Tester la génération complète avec différents cas d'usage
2. Vérifier l'export DOCX (à implémenter)
3. Valider juridiquement le texte généré
4. Créer templates pour SARL, SASU, SAS

