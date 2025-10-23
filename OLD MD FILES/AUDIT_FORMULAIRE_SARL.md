# Rapport d'Audit - Formulaire SARL

**Date**: 20 octobre 2025  
**Fichier audité**: `src/pages/RedactionStatuts.tsx`  
**Portée**: Formulaire SARL (multi-associés) - Sections 0 à 12

## Résumé Exécutif

Cet audit a identifié **5 incohérences critiques** et **2 incohérences importantes** dans le formulaire SARL qui nécessitent des corrections pour assurer la cohérence entre le formulaire et le template.

### Statistiques
- **Incohérences Critiques**: 5
- **Incohérences Importantes**: 2
- **Incohérences Mineures**: 0
- **Total**: 7 problèmes identifiés

---

## Incohérences Identifiées

### 1. ❌ CRITIQUE - Section 6: Gérance - Label "associé unique" pour SARL

**Ligne**: 2766  
**Fichier**: `src/pages/RedactionStatuts.tsx`

**Problème**:
```tsx
<Label htmlFor="dirigeant-associe">Le {labels.dirigeant} est l'associé unique</Label>
```

Le label affiche "Le gérant est l'associé unique" pour toutes les formes juridiques, y compris SARL qui a plusieurs associés.

**Impact**: Confusion majeure pour l'utilisateur - le formulaire suggère qu'il y a un associé unique alors que c'est une SARL multi-associés.

**Variable concernée**: `gerant.isAssocieUnique`

**Correction suggérée**:
```tsx
<Label htmlFor="dirigeant-associe">
  Le {labels.dirigeant} est {
    dossier?.societe.formeJuridique === 'SARL' || dossier?.societe.formeJuridique === 'SAS'
      ? "un des associés"
      : "l'associé unique"
  }
</Label>
```

**Priorité**: 🔴 CRITIQUE

---

### 2. ❌ CRITIQUE - Section 10: Options fiscales affichées pour SARL

**Ligne**: 3604  
**Fichier**: `src/pages/RedactionStatuts.tsx`

**Problème**:
```tsx
{!isSASU && shouldShowSection('section-10') && (
```

La condition `!isSASU` signifie que cette section s'affiche pour EURL **ET** SARL. Or, les options fiscales (notamment l'option IS/IR) ne concernent que l'EURL, pas la SARL.

**Impact**: La SARL voit des options fiscales qui ne la concernent pas. Une SARL est obligatoirement à l'IS.

**Variable concernée**: `statutsData.optionFiscale`

**Correction suggérée**:
```tsx
{dossier?.societe.formeJuridique === 'EURL' && shouldShowSection('section-10') && (
```

**Priorité**: 🔴 CRITIQUE

---

### 3. ❌ CRITIQUE - Section 12: Nomination - Label "associé unique" pour SARL

**Ligne**: 3813  
**Fichier**: `src/pages/RedactionStatuts.tsx`

**Problème**:
```tsx
Le gérant est l'associé unique
```

Même problème que dans la Section 6. Le label suggère l'existence d'un associé unique pour une SARL multi-associés.

**Impact**: Confusion dans le formulaire de nomination du premier gérant.

**Variable concernée**: `nominationGerant.gerantEstAssocie`

**Correction suggérée**:
```tsx
<Label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={statutsData.nominationGerant?.gerantEstAssocie !== false}
    onChange={(e) =>
      updateStatutsData({
        nominationGerant: {
          ...statutsData.nominationGerant!,
          gerantEstAssocie: e.target.checked,
        },
      })
    }
  />
  {dossier?.societe.formeJuridique === 'SARL' || dossier?.societe.formeJuridique === 'SAS'
    ? "Le gérant est un des associés"
    : "Le gérant est l'associé unique"}
</Label>
```

**Priorité**: 🔴 CRITIQUE

---

### 4. ⚠️ IMPORTANT - Section 6: Variable `isAssocieUnique` pour SARL

**Lignes**: 2735, 2754-2755  
**Fichier**: `src/pages/RedactionStatuts.tsx`

**Problème**:
```tsx
checked={isSASU ? statutsData.president?.isAssocieUnique !== false : statutsData.gerant?.isAssocieUnique !== false}
```

La propriété `isAssocieUnique` est utilisée pour SARL, ce qui est sémantiquement incorrect. Elle devrait être renommée `isAssocie` ou `estAssocie` pour SARL/SAS.

**Impact**: Confusion dans le code et incohérence sémantique. Le template peut mal interpréter cette variable.

**Variable concernée**: `gerant.isAssocieUnique` (devrait être `gerant.estAssocie` pour SARL)

**Correction suggérée**:
Ajouter une propriété distincte dans le type `Gerant`:
- `isAssocieUnique?: boolean` (pour EURL)
- `estAssocie?: boolean` (pour SARL)

Ou utiliser une logique conditionnelle dans `buildVariables()` pour interpréter correctement selon la forme juridique.

**Priorité**: 🟡 IMPORTANT

---

### 5. ❌ CRITIQUE - Section 0: Variable pourcentageCapital manquante dans initialisation

**Lignes**: 880-888  
**Fichier**: `src/pages/RedactionStatuts.tsx`

**Problème**:
```tsx
updateStatutsData({
  associeUnique: {
    type: 'PERSONNE_PHYSIQUE',
    civilite: dossier?.client.civilite || 'M',
    nom: dossier?.client.nom || '',
    prenom: dossier?.client.prenom || '',
    dateNaissance: '',
    lieuNaissance: '',
    nationalite: 'française',
    adresse: '',
    // MANQUE: pourcentageCapital: 100
  },
})
```

Pour EURL, l'associé unique devrait avoir `pourcentageCapital: 100` initialisé automatiquement.

**Impact**: Le template ne peut pas calculer correctement les parts si le champ manque.

**Variable concernée**: `associeUnique.pourcentageCapital`

**Correction suggérée**:
```tsx
updateStatutsData({
  associeUnique: {
    type: 'PERSONNE_PHYSIQUE',
    // ... autres champs
    pourcentageCapital: 100, // Ajout
  },
})
```

**Priorité**: 🔴 CRITIQUE

---

### 6. ⚠️ IMPORTANT - Section 3bis: Variable dateDepotFonds vs date

**Lignes**: 2422, 460 (template-engine.ts)  
**Fichiers**: `src/pages/RedactionStatuts.tsx`, `src/utils/template-engine.ts`

**Problème**:
Le formulaire stocke `depotFonds.date` mais le template utilise `dateDepotFonds` (format court).

```tsx
// Formulaire
value={statutsData.depotFonds?.date || ''}

// Template
dateDepotFonds: statutsData.depotFonds?.date ? formaterDateCourte(statutsData.depotFonds.date) : '[Date de dépôt]'
```

**Impact**: La correspondance existe mais pourrait être plus claire. Le formatage est fait dans `buildVariables()`.

**Variable concernée**: `depotFonds.date` → `dateDepotFonds`

**Correction suggérée**:
Aucune correction nécessaire, mais documenter clairement dans les types que `depotFonds.date` sera transformé en `dateDepotFonds` (format court) dans le template.

**Priorité**: 🟡 IMPORTANT (Documentation)

---

### 7. ❌ CRITIQUE - Section 6bis: Affichage pour SAS

**Ligne**: 3118  
**Fichier**: `src/pages/RedactionStatuts.tsx`

**Problème**:
```tsx
{!isSASU && shouldShowSection('section-6bis') && (
```

La condition `!isSASU` signifie que la section "Comptes courants" s'affiche pour EURL **ET** SARL **ET** SAS. Il faut vérifier si cette section concerne aussi les SAS ou seulement EURL/SARL.

**Impact**: Potentiellement, affichage incorrect pour SAS.

**Variable concernée**: `compteCourant`

**Correction suggérée**:
Vérifier dans le template SARL si l'article 21 (Comptes courants) existe pour SAS. Si non:
```tsx
{(dossier?.societe.formeJuridique === 'EURL' || dossier?.societe.formeJuridique === 'SARL') && shouldShowSection('section-6bis') && (
```

**Priorité**: 🔴 CRITIQUE

---

## Sections Conformes ✅

Les sections suivantes ont été auditées et sont conformes au template :

### Section 0: Associés (Préambule) ✅
- ✅ Distinction correcte SARL (multi-associés) vs EURL (associé unique)
- ✅ AssociesListForm reçoit les bonnes props (`capitalSocial`, `nombreTotalParts`)
- ✅ Variables `listeAssocies`, `repartitionParts` correctement générées
- ⚠️ Manque initialisation `pourcentageCapital: 100` pour EURL (voir problème #5)

### Section 1: Identité de la société ✅
- ✅ Champs `denomination`, `objetSocial`, `siegeSocial` présents
- ✅ Correspondance correcte avec variables template

### Section 2: Durée ✅
- ✅ Champ `duree` présent
- ✅ Validation correcte (1-99 ans) dans le formulaire

### Section 3: Capital et apports ✅
- ✅ Champs `capitalSocial`, `nombreParts`, `valeurNominale` présents
- ✅ Recalcul automatique des parts associés implémenté
- ✅ Types d'apport correctement gérés
- ✅ Variables template correctement mappées

### Section 3bis: Dépôt de fonds ✅
- ✅ Champs `depotFonds.date`, `depotFonds.etablissement` présents
- ✅ Variable `lieuDepotFonds` corrigée récemment
- ✅ Condition d'affichage correcte (seulement si apport en numéraire)

### Section 5: Nantissement ✅
- ✅ Label adapté pour SARL (pas "Agrément")
- ✅ Correspondance avec Article 13.4 du template SARL

### Section 5bis: Admission de nouveaux associés ✅
- ✅ Champs spécifiques SARL présents
- ✅ Variables `regimeCession`, `exploitType`, `transmissionDeces` présentes

### Section 7: Exercice social ✅
- ✅ Champs date début/fin présents
- ✅ Article de référence correct (Article 23 pour SARL)

### Section 8: Commissaires aux comptes ✅
- ✅ Articles de référence corrects (15 et 24)
- ✅ Champs commissaires titulaire/suppléant présents

### Section 9: Conventions réglementées ✅
- ✅ Article de référence correct (Article 19 pour SARL)

### Section 11: Actes en formation ✅
- ✅ Article de référence correct (Article 29 pour SARL)
- ✅ Champs et textes conformes

---

## Recommandations

### Priorité Immédiate (Critiques)
1. **Corriger les labels "associé unique" pour SARL** (Problèmes #1, #3)
2. **Restreindre Section 10 (Options) à EURL uniquement** (Problème #2)
3. **Initialiser pourcentageCapital pour EURL** (Problème #5)
4. **Vérifier Section 6bis (Comptes courants) pour SAS** (Problème #7)

### Priorité Secondaire (Importantes)
1. **Revoir la sémantique de isAssocieUnique pour SARL** (Problème #4)
2. **Documenter le mapping date → dateDepotFonds** (Problème #6)

### Améliorations Futures
1. Créer des constantes pour les conditions d'affichage fréquentes (ex: `const isMultiAssocies = formeJuridique === 'SARL' || formeJuridique === 'SAS'`)
2. Extraire les labels dynamiques dans une fonction helper
3. Ajouter des tests unitaires pour valider la correspondance formulaire ↔ template

---

## Conclusion

L'audit a révélé que le formulaire SARL est **largement fonctionnel** mais présente des incohérences critiques liées à la terminologie "associé unique" qui apparaît de manière inappropriée pour les structures multi-associés. La correction de ces 7 problèmes garantira une **conformité parfaite** entre le formulaire et le template SARL.

**Temps estimé pour corrections**: 2-3 heures  
**Complexité**: Moyenne (principalement des conditions et labels à ajuster)

