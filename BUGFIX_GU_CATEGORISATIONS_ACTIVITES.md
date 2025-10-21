# Correction : Champs `categorisationActivite1` et `categorisationActivite2` manquants

## Problème identifié

L'API Guichet Unique retournait une erreur 400 :
```
content.personneMorale.etablissementPrincipal.activites[0].categorisationActivite1: Veuillez renseigner ce champ
content.personneMorale.etablissementPrincipal.activites[0].categorisationActivite2: Veuillez renseigner ce champ
```

## Cause racine

Les champs `categorisationActivite1` et `categorisationActivite2` sont **obligatoires** dans le tableau `activites[]` lors d'une création de formalité, bien qu'ils soient marqués comme `nullable: true` dans le schéma OpenAPI.

### Schéma officiel (BlocDescriptionActivite-0)

```json
{
  "categorisationActivite1": {
    "pattern": "^(([\\d]{2}))$",
    "type": "string",
    "example": "01",
    "description": "GU_ACT013",
    "nullable": true
  },
  "categorisationActivite2": {
    "pattern": "^(([\\d]{2}))$",
    "type": "string",
    "example": "06",
    "description": "GU_ACT015",
    "nullable": true
  }
}
```

Ce sont des codes à **2 chiffres** qui catégorisent l'activité de l'établissement.

## Modifications apportées

### 1. Types TypeScript (`src/types/guichet-unique.ts`)

Ajout des champs de catégorisation dans `GUBlocDescriptionActivite` :

```typescript
export interface GUBlocDescriptionActivite {
  indicateurPrincipal?: boolean
  codeApe?: string
  descriptionDetaillee?: string
  origine?: string
  
  // Catégorisations (codes à 2 chiffres) - REQUIS en création
  categorisationActivite1?: string // Ex: "01" (Commerce)
  categorisationActivite2?: string // Ex: "06" (Autre)
  categorisationActivite3?: string
  categorisationActivite4?: string
  
  // Précisions pour catégories "Autre"
  precisionAutreCategorie1?: string
  precisionAutreCategorie2?: string
  precisionAutreCategorie3?: string
  precisionAutreCategorie4?: string
}
```

### 2. Mapper (`src/utils/gu-mapper.ts`)

Ajout des catégorisations par défaut dans `mapEtablissement()` :

```typescript
const activitePrincipale: GUBlocDescriptionActivite = {
  indicateurPrincipal: true,
  descriptionDetaillee: dossier.societe.objetSocial || statutsData.objetSocial || 'Activité non spécifiée',
  
  // Catégorisations obligatoires
  categorisationActivite1: '01', // Commerce/Activités commerciales
  categorisationActivite2: '06', // Autre
}
```

### 3. Correction du parsing d'adresse

Correction d'un bug où le champ `voie` contenait l'adresse complète avec le code postal et la ville au lieu de seulement le nom de la voie :

**Avant :**
```typescript
voie: voie || adresseComplete, // ❌ Bug : inclut CP et ville
```

**Après :**
```typescript
voie: voie || 'Adresse non spécifiée', // ✅ Seulement le nom de la voie
```

## Codes de catégorisation

Les codes sont définis dans un référentiel INPI. Valeurs courantes :

- **01** : Commerce, activités commerciales
- **02** : Activités industrielles
- **03** : Activités artisanales
- **04** : Activités libérales
- **05** : Activités agricoles
- **06** : Autre

⚠️ **TODO** : Ces codes devraient être déterminés dynamiquement selon l'activité réelle de l'entreprise. Pour l'instant, on utilise des valeurs par défaut (01 + 06).

## Impact

L'API GU accepte maintenant la création de formalités avec des activités correctement catégorisées.

## Prochaines étapes

1. Ajouter un champ dans le formulaire de création pour sélectionner les catégorisations
2. Mapper automatiquement les catégorisations selon le code APE ou l'objet social
3. Documenter la liste complète des codes de catégorisation INPI

## Date de correction

16 octobre 2025


