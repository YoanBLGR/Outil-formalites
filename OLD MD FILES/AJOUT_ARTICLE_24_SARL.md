# Ajout de l'Article 24 (Décisions collectives) pour SARL

## 📋 Résumé

Ajout de la section **Article 24 - Décisions collectives** dans le formulaire de rédaction des statuts SARL. Cette section permet de paramétrer les modalités de consultation et de vote des associés, conformément au template `statuts-sarl-conforme-v1.json`.

## 🎯 Problème identifié

L'Article 24 du template SARL contient **8 variables paramétrables** importantes qui n'étaient **pas collectées** dans le formulaire :

1. `formesDecisionsCollectives` (24.1)
2. `decisionsOrdinaires` (24.2)
3. `majoriteOrdinairesRenforcee` (24.2)
4. `quorumExtraordinaire1` (24.3)
5. `quorumExtraordinaire2` (24.3)
6. `majoriteExtraordinaire` (24.3)

Ces variables existaient dans :
- ✅ Le type `StatutsData` (`src/types/statuts.ts`)
- ✅ Le générateur de template (`src/utils/template-engine.ts`)
- ❌ **MAIS PAS dans le formulaire** (`src/pages/RedactionStatuts.tsx`)

## ✅ Modifications apportées

### 1. Configuration des étapes (`src/config/redaction-steps.tsx`)

#### Ajout de la section `section-9bis`

```typescript
// Étape 3 : Modalités
'section-9': 3,      // Conventions réglementées
'section-9bis': 3,   // Décisions collectives (SARL) ← NOUVEAU
'section-10': 3,     // Options (fiscale, arbitrage)
'section-11': 3,     // Actes en formation
```

#### Mise à jour des sections par étape

```typescript
3: ['section-9', 'section-9bis', 'section-10', 'section-11'],
```

#### Titre de la section

```typescript
'section-9bis': "Décisions collectives (SARL)",
```

#### Validation de l'étape Modalités (step 3)

Ajout de la validation spécifique pour SARL :

```typescript
case 3: // Modalités
  if (isSASU) {
    return !!data.conventionsReglementees
  } else if (isSARL) {
    // Pour SARL : vérifier les décisions collectives (Article 24)
    return !!(
      data.formesDecisionsCollectives &&
      data.decisionsOrdinaires &&
      data.quorumExtraordinaire1 &&
      data.quorumExtraordinaire2 &&
      data.majoriteExtraordinaire
    )
  } else {
    // Pour EURL : vérifier l'option fiscale
    return !!(
      data.conventionsReglementees &&
      data.optionFiscale
    )
  }
```

### 2. Formulaire de rédaction (`src/pages/RedactionStatuts.tsx`)

#### a) Mapping section → article

```typescript
'section-9': 'article-22',      // Conventions réglementées (SARL)
'section-9bis': 'article-24',   // Décisions collectives (SARL) ← NOUVEAU
'section-10': 'article-25',
```

#### b) Nouvelle section du formulaire

Ajout d'une section complète avec 3 sous-sections :

**Section 9bis : Décisions collectives (Article 24)**
- Affichée uniquement pour les SARL
- Positionnée entre section 9 (Conventions) et section 10 (Options)

**24.1 Forme des décisions collectives**
- `formesDecisionsCollectives` : 
  - DIVERSES (assemblée, consultation écrite ou consentement unanime)
  - ASSEMBLEE_SEULE
  - SANS_CE_UNANIME_COMPTES

**24.2 Décisions ordinaires**
- `decisionsOrdinaires` :
  - LEGALE_AVEC_SECONDE (majorité > 50% + seconde consultation)
  - LEGALE_SANS_SECONDE
  - RENFORCEE_AVEC_SECONDE
  - RENFORCEE_SANS_SECONDE
- `majoriteOrdinairesRenforcee` (si majorité renforcée choisie) : ex. "deux tiers"

**24.3 Décisions extraordinaires**
- `quorumExtraordinaire1` : Quorum 1ère convocation (ex: "le quart")
- `quorumExtraordinaire2` : Quorum 2ème convocation (ex: "le cinquième")
- `majoriteExtraordinaire` : Majorité requise (ex: "des deux tiers")

#### c) Valeurs par défaut

Ajout dans `getDefaultStatutsData()` pour SARL/EURL :

```typescript
// Article 24: Décisions collectives (SARL uniquement)
formesDecisionsCollectives: 'DIVERSES',
decisionsOrdinaires: 'LEGALE_AVEC_SECONDE',
majoriteOrdinairesRenforcee: 'deux tiers',
quorumExtraordinaire1: 'le quart',
quorumExtraordinaire2: 'le cinquième',
majoriteExtraordinaire: 'des deux tiers',
```

## 📊 Structure du formulaire SARL - Étape Modalités

Avant :
```
Étape 3 : Modalités
├─ Section 9 : Conventions réglementées ✓
├─ Section 10 : Options fiscales (EURL uniquement)
└─ Section 11 : Actes en formation
```

Après :
```
Étape 3 : Modalités
├─ Section 9 : Conventions réglementées ✓
├─ Section 9bis : Décisions collectives (SARL) ← NOUVEAU
│   ├─ 24.1 Forme des décisions
│   ├─ 24.2 Décisions ordinaires
│   └─ 24.3 Décisions extraordinaires
├─ Section 10 : Options fiscales (EURL uniquement)
└─ Section 11 : Actes en formation
```

## 🎨 Interface utilisateur

La nouvelle section comprend :
- ✅ **Titre** : "9bis. Décisions collectives (Article 24)"
- ✅ **Sous-titre** : "Modalités de consultation et de vote des associés"
- ✅ **3 sous-sections visuellement séparées** (avec `border rounded-lg p-4 bg-slate-50`)
- ✅ **Champs de saisie avec aide contextuelle** (texte explicatif sous chaque champ)
- ✅ **Validation** : tous les champs sont obligatoires (*)
- ✅ **Indicateur de complétion** : la section est validée quand tous les champs sont remplis
- ✅ **Affichage conditionnel** : champ `majoriteOrdinairesRenforcee` visible seulement si majorité renforcée choisie

## 🧪 Tests à effectuer

1. **Créer un nouveau dossier SARL**
   - Vérifier que la section 9bis apparaît dans l'étape Modalités
   - Vérifier que les valeurs par défaut sont bien initialisées

2. **Remplir le formulaire**
   - Tester les différentes options de `formesDecisionsCollectives`
   - Tester les différentes options de `decisionsOrdinaires`
   - Vérifier l'affichage conditionnel du champ `majoriteOrdinairesRenforcee`

3. **Prévisualisation**
   - Vérifier que l'Article 24 est bien généré dans les statuts
   - Vérifier que les variants corrects sont sélectionnés selon les choix
   - Vérifier que toutes les variables sont correctement substituées

4. **Navigation**
   - Vérifier que le clic sur la section 9bis dans la prévisualisation scroll vers le bon article
   - Vérifier que la validation de l'étape Modalités fonctionne

## 📝 Fichiers modifiés

1. ✅ `src/config/redaction-steps.tsx` - Configuration des étapes et validation
2. ✅ `src/pages/RedactionStatuts.tsx` - Ajout de la section du formulaire et valeurs par défaut
3. ✅ `AJOUT_ARTICLE_24_SARL.md` - Ce document (documentation)

## 🔗 Références

- Template SARL : `src/templates/statuts-sarl-conforme-v1.json`
- Article 24 (lignes 440-503)
- Types : `src/types/statuts.ts` (lignes 572-578)
- Template engine : `src/utils/template-engine.ts` (lignes 893-898)

## ✅ Conformité

La section Modalités pour la SARL est maintenant **conforme au template** `statuts-sarl-conforme-v1.json` et permet de paramétrer toutes les variables de l'Article 24.

---

**Date** : 21 octobre 2025  
**Auteur** : Assistant IA  
**Version** : 1.0

