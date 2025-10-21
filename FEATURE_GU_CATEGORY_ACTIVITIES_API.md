# Feature : Récupération dynamique des catégories d'activités depuis l'API GU

## Problème résolu

Les codes `categorisationActivite1` et `categorisationActivite2` étaient codés en dur, ce qui causait des erreurs de validation :
```
Catégorisation de l'activité inconnue. Merci de la saisir à nouveau.
```

## Solution implémentée

Récupération dynamique des codes valides depuis l'API du Guichet Unique :
```
GET /api/data_dictionary/category_activities
```

## Fichiers créés

### 1. `src/services/gu-data-dictionary.ts`

Nouveau service pour interagir avec le dictionnaire de données du GU :

```typescript
// Récupère toutes les catégories d'activités
const categories = await fetchCategoryActivities()

// Récupère les codes par défaut (2 premiers)
const { categorisationActivite1, categorisationActivite2 } = await getDefaultCategorizationCodes()

// Recherche une catégorie par mot-clé
const category = await findCategoryByKeyword('commerce')
```

**Fonctionnalités** :
- ✅ Cache en mémoire pour éviter les appels répétés
- ✅ Logs de débogage
- ✅ Fallback en cas d'erreur
- ✅ Fonction de recherche par mot-clé (pour mapping intelligent futur)

## Fichiers modifiés

### 1. `src/utils/gu-mapper.ts`

**Avant** :
```typescript
export function mapEtablissement(...): GUEtablissement {
  const activitePrincipale = {
    categorisationActivite1: '10', // ❌ Codé en dur
    categorisationActivite2: '11', // ❌ Codé en dur
  }
}
```

**Après** :
```typescript
export async function mapEtablissement(...): Promise<GUEtablissement> {
  // ✅ Récupération dynamique depuis l'API
  const { categorisationActivite1, categorisationActivite2 } = await getDefaultCategorizationCodes()
  
  const activitePrincipale = {
    categorisationActivite1,
    categorisationActivite2,
  }
}
```

**Changements** :
- ✅ `mapEtablissement()` est maintenant `async`
- ✅ `mapDossierToGUFormality()` est maintenant `async`

### 2. `src/hooks/useGuichetUnique.ts`

Ajout d'`await` pour l'appel async :

```typescript
// Avant
const formalityData = mapDossierToGUFormality(dossier, statutsData)

// Après
const formalityData = await mapDossierToGUFormality(dossier, statutsData)
```

## Structure de l'API category_activities

```typescript
interface GUCategoryActivity {
  completeCode: string           // Code complet (ex: "1001")
  precisionActivite: string | null
  precisionAutre: string | null
  formeExercice: string
  formeExerciceAgricoleApplicable: boolean
  label: string                  // Label lisible (ex: "Commerce de détail")
  value: string                  // Code à 2 chiffres (ex: "10")
  subValues?: GUCategoryActivity[]  // Sous-catégories
}
```

## Flux de données

```
1. Utilisateur clique "Créer formalité GU"
   ↓
2. Hook useGuichetUnique démarre
   ↓
3. mapDossierToGUFormality() appelé
   ↓
4. mapEtablissement() appelé
   ↓
5. getDefaultCategorizationCodes() → fetchCategoryActivities()
   ↓
6. GET /api/data_dictionary/category_activities
   ↓
7. Mise en cache des catégories
   ↓
8. Retour des 2 premiers codes
   ↓
9. Création de la formalité avec codes valides ✅
```

## Avantages

✅ **Codes toujours à jour** : Récupérés depuis l'API INPI  
✅ **Cache** : Une seule requête par session  
✅ **Fallback** : Codes par défaut en cas d'erreur réseau  
✅ **Logs** : Affichage des catégories dans la console pour debug  
✅ **Extensible** : Fonction de recherche par mot-clé prête pour mapping intelligent  

## Améliorations futures (TODO)

1. **Mapping intelligent** : Utiliser `findCategoryByKeyword()` pour déterminer automatiquement les catégories selon l'objet social

   ```typescript
   // Exemple
   const objetSocial = "Conseil en systèmes informatiques"
   const category = await findCategoryByKeyword('informatique')
   // → Retourne la catégorie "Services informatiques"
   ```

2. **Interface utilisateur** : Ajouter un sélecteur de catégories dans le formulaire de création

3. **Validation** : Vérifier que les catégories sélectionnées sont compatibles avec la forme juridique

4. **Sous-catégories** : Utiliser `subValues` pour une catégorisation plus précise

## Test

1. Créer/ouvrir un dossier avec progression 100%
2. Cliquer sur "Créer une formalité sur le Guichet Unique"
3. Vérifier dans la console :
   ```
   📚 Récupération des catégories d'activités depuis le GU...
   ✅ Catégories d'activités récupérées: XX catégories
   📋 Codes de catégorisation par défaut: {...}
   ```
4. La formalité devrait se créer sans erreur de catégorisation ✅

## Date de création

16 octobre 2025


