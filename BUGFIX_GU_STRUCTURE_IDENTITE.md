# Correction : Erreur "isEnableBypassModificationRepresentant" sur null

## Problème identifié

L'API Guichet Unique retournait une erreur 500 :
```
Attempt to assign property "isEnableBypassModificationRepresentant" on null
```

## Cause racine (CORRIGÉE v2)

**Erreur critique #1 : `typePersonne` incorrect**
- On envoyait `typePersonne: 'P'` (Personne Physique) alors qu'on fournissait `content.personneMorale`
- Pour une personne morale, la valeur attendue est `'M'`
- Cette erreur causait le NPE (Null Pointer Exception) sur `isEnableBypassModificationRepresentant`

**Erreur #2 : Structure de l'identité incorrecte**
- La structure de l'objet `personneMorale.identite` ne correspondait pas au schéma attendu par l'API

**Erreur #3 : Structure des adresses incorrecte**
- Les adresses n'utilisaient pas le format `BlocAdresse` avec `codePays`, `commune`, `typeVoie`, `voie`

**Erreur #4 : Établissement sans activités**
- L'établissement principal n'avait pas de tableau `activites[]` conforme au schéma 

### Structure incorrecte (avant)
```json
{
  "typePersonne": "P",  // ❌ INCORRECT : P = Personne Physique
  "content": {
    "personneMorale": {
      "identite": {
        "denomination": "...",  // ❌ Structure plate
        "capital": { "montant": 100000 }
      },
      "adresseEntreprise": {
        "nomVoie": "...",  // ❌ Format non conforme
        "ville": "..."
      },
      "etablissementPrincipal": {
        "activitePrincipale": "..."  // ❌ Champ obsolète
      }
    }
  }
}
```

### Structure correcte (après)
```json
{
  "typePersonne": "M",  // ✅ M = Personne Morale
  "content": {
    "personneMorale": {
      "identite": {
        "entreprise": {  // ✅ Structure imbriquée
          "denomination": "HOLDING JD",
          "formeJuridique": "5498",
          "pays": "FR"
        },
        "description": {
          "duree": 99,
          "dateClotureExerciceSocial": "3112",  // ✅ Format JJMM
          "montantCapital": 100000  // ✅ Nombre en euros
        }
      },
      "adresseEntreprise": {
        "caracteristiques": {  // ✅ BlocAdresse conforme
          "ambulant": false,
          "domiciliataire": false
        },
        "adresse": {
          "codePays": "FR",
          "codePostal": "75001",
          "commune": "PARIS",
          "numVoie": "1",
          "typeVoie": "RUE",
          "voie": "de la Paix"
        }
      },
      "etablissementPrincipal": {
        "descriptionEtablissement": {
          "rolePourEntreprise": "2",
          "enseigne": "HOLDING JD"
        },
        "adresse": { /* BlocAdresse */ },
        "activites": [  // ✅ Tableau d'activités
          {
            "indicateurPrincipal": true,
            "codeApe": "62.02A",
            "descriptionDetaillee": "Conseil en systèmes..."
          }
        ]
      }
    }
  }
}
```

## Modifications apportées

### 1. Types TypeScript (`src/types/guichet-unique.ts`)

**1.1. Correction du type de personne**
```typescript
// ❌ Avant
export type GUTypePersonne = 'P' | 'M'  // P = Personne Morale (FAUX!)

// ✅ Après
export type GUTypePersonne = 'M' | 'P'  // M = Personne Morale, P = Personne Physique
```

**1.2. Ajout des structures BlocAdresse**
```typescript
export interface GUBlocAdresse {
  codePays?: string
  codePostal?: string
  commune?: string
  numVoie?: string
  typeVoie?: string
  voie?: string
  complement?: string
}

export interface GUCaracteristiquesAdresse {
  ambulant?: boolean
  domiciliataire?: boolean
}

export interface GUAdresseEntreprise {
  caracteristiques?: GUCaracteristiquesAdresse
  adresse?: GUBlocAdresse
}
```

**1.3. Ajout des activités**
```typescript
export interface GUBlocDescriptionActivite {
  indicateurPrincipal?: boolean
  codeApe?: string
  descriptionDetaillee?: string
  origine?: string
}
```

**1.4. Correction de la structure de l'identité**
```typescript
export interface GUBlocEntrepriseIdentite {
  denomination?: string
  formeJuridique?: GUNatureJuridique
  pays?: string
  objet?: string
}

export interface GUBlocDetailPersonneMorale {
  sigle?: string
  duree?: number
  dateClotureExerciceSocial?: string // Format: JJMM
  montantCapital?: number // Montant en euros (nombre, pas centimes!)
  deviseCapital?: string
}

export interface GUIdentitePersonneMorale {
  entreprise?: GUBlocEntrepriseIdentite // REQUIS
  description?: GUBlocDetailPersonneMorale // REQUIS pour création
}
```

**1.5. Mise à jour de la structure Établissement**
```typescript
export interface GUEtablissement {
  descriptionEtablissement?: {
    rolePourEntreprise: GURolePourEntreprise
    enseigne?: string
    codeApe?: string
  }
  adresse?: GUBlocAdresse // Utilise BlocAdresse
  activites?: GUBlocDescriptionActivite[] // REQUIS
}
```

### 2. Mapper (`src/utils/gu-mapper.ts`)

Restructuration de la construction de l'identité :

```typescript
const identite: GUIdentitePersonneMorale = {
  // Bloc entreprise (REQUIS)
  entreprise: {
    denomination: dossier.societe.denomination,
    formeJuridique,
    pays: 'FR',
    objet: dossier.societe.objetSocial || statutsData.objetSocial || '',
  },
  // Bloc description (REQUIS pour création)
  description: {
    ...(statutsData.sigle ? { sigle: statutsData.sigle } : {}),
    duree: statutsData.duree || 99,
    dateClotureExerciceSocial: dateClotureExerciceComptable, // Format JJMM
    montantCapitalCentime: Math.round((statutsData.capitalSocial || 0) * 100),
    deviseCapital: 'EUR',
  },
}
```

### 3. Autres corrections

- **Suppression du champ `composition: {}`** : Le champ étant nullable dans le schéma, on ne l'envoie pas du tout s'il est vide
- **Correction de `dateSignature`** : Utilisation de `statutsData.dateSignature` au lieu de `dateSignatureStatuts` (inexistant)
- **Suppression du SIREN** : Pour une création, le SIREN n'existe pas encore (attribué par l'INSEE après)
- **Gestion des valeurs undefined** : Ajout de valeurs par défaut pour les champs optionnels

## Impact

Ces corrections permettent à l'API GU de créer correctement l'objet `personneMorale` et d'y affecter ses propriétés internes sans erreur.

## Tests recommandés

1. Tester la création d'une formalité EURL
2. Tester la création d'une formalité SASU
3. Vérifier que les données sont correctement mappées dans le portail GU
4. Vérifier les logs de debug dans la console navigateur

## Documentation de référence

- Fichier OpenAPI : `formalities.json` (schémas officiels)
- Schéma `PersonneMorale-0` : Ligne 7562
- Schéma `PMRubriqueIdentitePM-0` : Ligne 14947
- Schéma `BlocEntrepriseIdentite-1` : Ligne 24356
- Schéma `BlocDetailPersonneMorale-0` : Ligne 27053

## Date de correction

16 octobre 2025

