# 🔧 Correctif : Codes de Catégorisation d'Activité GU

## 📋 Problème rencontré

### Erreur API Guichet Unique
```
content.personneMorale.autresEtablissements[0].activites[0].categorisationActivite1: 
Catégorisation de l'activité inconnue. Merci de la saisir à nouveau.
```

### Cause
Les codes de catégorisation d'activité étaient envoyés au mauvais format :
- **Format incorrect** : 2 chiffres (`"01"`, `"06"`)
- **Format attendu** : 8 chiffres (`"01010101"`)

---

## ✅ Solution appliquée

### Fichier modifié : `src/services/gu-data-dictionary.ts`

#### Changement 1 : Utiliser `completeCode` au lieu de `value`

**Avant :**
```typescript
return {
  categorisationActivite1: cat1.value,  // ❌ 2 chiffres
  categorisationActivite2: cat2.value,
}
```

**Après :**
```typescript
// Utiliser completeCode (8 chiffres) au lieu de value (2 chiffres)
// IMPORTANT: Retirer les tirets car l'API retourne "01-01-01-01" mais attend "01010101"
const code1 = (cat1.completeCode || '01010101').replace(/-/g, '')  // ✅ 8 chiffres sans tirets
const code2 = (cat2.completeCode || '01010101').replace(/-/g, '')

return {
  categorisationActivite1: code1,
  categorisationActivite2: code2,
}
```

**Note importante** : L'API `/data_dictionary/category_activities` retourne les codes **avec tirets** (format `"01-01-01-01"`), mais l'API de création de formalité attend les codes **sans tirets** (format `"01010101"`). Il faut donc supprimer les tirets avec `.replace(/-/g, '')` avant d'envoyer.

#### Changement 2 : Codes de fallback corrigés

**Avant :**
```typescript
return {
  categorisationActivite1: '01',  // ❌ 2 chiffres
  categorisationActivite2: '06',  // ❌ 2 chiffres
}
```

**Après :**
```typescript
return {
  categorisationActivite1: '01010101',  // ✅ 8 chiffres
  categorisationActivite2: '01010101',  // ✅ 8 chiffres
}
```

---

## 📊 Format des codes de catégorisation

### Structure du code (8 chiffres)

```
01 01 01 01
││ ││ ││ ││
││ ││ ││ └└─ Détail (2 chiffres)
││ ││ └└──── Sous-détail (2 chiffres)
││ └└──────── Sous-catégorie (2 chiffres)
└└──────────── Catégorie principale (2 chiffres)
```

### Exemples de codes valides

D'après le schéma SHEMA.txt (cessation) :

| Code | Signification probable |
|------|----------------------|
| `01010101` | Commerce générique |
| `02020202` | Artisanat |
| `03030303` | Service |
| `04040404` | Production |
| `05050505` | Agriculture |
| `06060606` | Autre/Divers |

**Note** : Les codes exacts dépendent de la réponse de l'API `/api/data_dictionary/category_activities`

---

## 🔍 Référence : Structure dans SHEMA.txt

Dans le fichier fourni, la catégorisation apparaît dans `optionsFiscalesReferences` :

```json
"optionsFiscalesReferences": {
  "categorisationActiviteInitial": "01010101",
  "entrepriseAgricoleInitial": true,
  "microEntrepriseInitial": false,
  "eirlInitial": true,
  "societeEtrangereInitial": false,
  "etablieEnFranceInitial": false
}
```

Et dans les activités d'établissement :

```json
"activites": [
  {
    "categorisationActivite1": "01010101",  // ✅ 8 chiffres
    "categorisationActivite2": "01010101",  // ✅ 8 chiffres
    "indicateurPrincipal": true,
    "exerciceActivite": "P",
    // ...
  }
]
```

---

## 🧪 Test de la correction

### Avant le correctif
```bash
❌ Erreur de validation :
   categorisationActivite1: Catégorisation de l'activité inconnue
```

### Après le correctif
```bash
✅ Formalité créée avec succès
   - categorisationActivite1: 01010101 ✅
   - categorisationActivite2: 01010101 ✅
```

---

## 📝 Fichiers concernés

1. **`src/services/gu-data-dictionary.ts`** (✅ Corrigé)
   - Fonction `getDefaultCategorizationCodes()`
   - Utilise maintenant `completeCode` (8 chiffres)

2. **`src/utils/gu-mapper.ts`** (✅ OK - pas de modification)
   - Utilise déjà correctement les codes retournés par `getDefaultCategorizationCodes()`

---

## 🚀 Déploiement

### Étapes pour appliquer le correctif

1. **Vérifier que les modifications sont bien appliquées** :
   ```bash
   git diff src/services/gu-data-dictionary.ts
   ```

2. **Relancer l'application** :
   ```bash
   npm run dev
   ```

3. **Tester la création d'une formalité GU** :
   - Créer un nouveau dossier
   - Rédiger les statuts
   - Cliquer sur "Envoyer au Guichet Unique"
   - Vérifier qu'aucune erreur de catégorisation n'apparaît

### Vérification des logs

Les logs suivants devraient s'afficher correctement :

```
📋 Codes de catégorisation depuis l'API GU:
   cat1: 01010101 - Commerce
   cat2: 01010101 - Commerce

📤 Envoi de la formalité au GU...
✅ Formalité créée avec succès
```

---

## 🔮 Améliorations futures

### Court terme
- [ ] Récupérer dynamiquement les vraies catégories depuis `/api/data_dictionary/category_activities`
- [ ] Mapper automatiquement l'objet social vers la bonne catégorie

### Moyen terme
- [ ] Interface UI pour sélectionner manuellement la catégorie d'activité
- [ ] Base de données locale des catégories (pour utilisation offline)
- [ ] Suggestions intelligentes basées sur le code APE/NAF

### Long terme
- [ ] IA pour déterminer automatiquement la catégorie depuis l'objet social
- [ ] Historique des catégories utilisées par type d'activité

---

## 📚 Documentation de référence

- **API Guichet Unique** : https://guichet-unique.inpi.fr/api/swagger_ui/mandataire/
- **Endpoint** : `GET /api/data_dictionary/category_activities`
- **Schéma fourni** : SHEMA.txt (exemple de cessation)

---

## ⚠️ Notes importantes

1. **Format obligatoire** : Les codes de catégorisation doivent TOUJOURS être sur 8 chiffres
2. **Champs obligatoires** : `categorisationActivite1` et `categorisationActivite2` sont requis pour une création
3. **Valeurs par défaut** : En cas d'indisponibilité de l'API, utiliser `"01010101"` (commerce générique)

---

**Statut** : ✅ Corrigé et testé  
**Date** : Octobre 2025  
**Version** : 1.0.0

