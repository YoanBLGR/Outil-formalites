# 🔍 ANALYSE - Gérance SARL vs EURL

**Date** : 21 octobre 2025  
**Problème** : Le formulaire SARL collecte des variables du template EURL

---

## ❌ PROBLÈME ACTUEL

Le formulaire collecte ces variables **pour EURL ET SARL** :
1. `dureeMandat` (ligne 3065-3078)
2. `majoriteNominationGerant` (ligne 3140-3150)
3. `majoriteRevocationGerant` (ligne 3152-3162)
4. `delaiPreavisGerant` (ligne 3164+)
5. `limitationsPouvoirs` (ligne 3180+)

---

## 📊 COMPARAISON DES TEMPLATES

### TEMPLATE EURL (Articles 14-17)

| Article | Titre | Variables |
|---------|-------|-----------|
| **14** | Nomination des gérants | `majoriteNominationGerant` ✅ |
| **15** | Cessation des fonctions | `majoriteRevocationGerant` ✅, `delaiPreavisGerant` ✅ |
| **16** | Pouvoirs | `limitationsPouvoirs` ✅, `descriptionLimitationsPouvoirs` ✅ |
| **17** | Rémunération | FIXE (pas de variables) |

**Contenu Article 14** :
```
"Le ou les gérants sont désignés par l'associé unique ou, en cas de pluralité 
d'associés, par décision des associés représentant plus de {{majoriteNominationGerant}} 
des parts sociales."
```

**Contenu Article 15** :
```
"Le ou les gérants sont révocables par décision de l'associé unique ou, en cas de 
pluralité d'associés, par décision des associés représentant plus de 
{{majoriteRevocationGerant}} des parts sociales.
...
Le gérant peut résilier ses fonctions moyennant un préavis de {{delaiPreavisGerant}} 
mois notifié à chaque associé par lettre recommandée avec AR."
```

---

### TEMPLATE SARL (Articles 17-21)

| Article | Titre | Variables |
|---------|-------|-----------|
| **17** | Gérance | `texteNominationGerant` (généré automatiquement) |
| **18** | Pouvoirs de la Gérance | `limitationsPouvoirs`, `cogerance`, `majoriteLimitationsPouvoirs`, `listeLimitationsPouvoirs`, `listeActesCogerance` |
| **19** | Rémunération | FIXE (pas de variables) |
| **20** | Cessation des fonctions | `texteRevocationGerant` (généré), `delaiPreavisGerant` ✅ |
| **21** | Responsabilité | FIXE (pas de variables) |

**Contenu Article 17** :
```json
{
  "contenu": "{{texteNominationGerant}}",
  "variables": ["texteNominationGerant"]
}
```

**Contenu Article 20** :
```
"{{texteRevocationGerant}}

Si la révocation est décidée sans juste motif, elle peut donner lieu à des dommages 
et intérêts. En outre, tout Gérant est révocable par les tribunaux pour cause légitime 
à la demande de tout associé.

Tout Gérant a le droit de démissionner de ses fonctions, à charge pour ce dernier 
d'informer les associés de sa décision au moins {{delaiPreavisGerant}} mois à l'avance, 
par lettre recommandée avec demande d'avis de réception."
```

**Contenu Article 18 (variants)** :
```
Variant 1 (!limitationsPouvoirs && !cogerance):
  - Aucune variable

Variant 2 (limitationsPouvoirs && !cogerance):
  - majoriteLimitationsPouvoirs
  - listeLimitationsPouvoirs

Variant 3 (cogerance):
  - limitationsPouvoirs
  - majoriteLimitationsPouvoirs
  - listeLimitationsPouvoirs
  - listeActesCogerance
```

---

## 🔑 DIFFÉRENCES CLÉS

### 1. Nomination du gérant

| Aspect | EURL | SARL |
|--------|------|------|
| **Article** | 14 | 17 |
| **Variable majorité** | `majoriteNominationGerant` ✅ | ❌ NON (texte généré automatiquement) |
| **Comment généré** | Template fixe avec variable | `texteNominationGerant` généré par template-engine |
| **Durée du mandat** | Mentionné dans l'article ("avec ou sans limitation de durée") | ❌ PAS dans les statuts |

**EURL** : La majorité pour nommer le gérant est **paramétrable** dans les statuts.

**SARL** : La nomination est gérée par une **génération automatique** de texte (probablement dans `template-engine.ts`). Les modalités de nomination ne sont pas dans les statuts mais régies par la loi (majorité ordinaire = plus de la moitié).

### 2. Révocation du gérant

| Aspect | EURL | SARL |
|--------|------|------|
| **Article** | 15 | 20 |
| **Variable majorité** | `majoriteRevocationGerant` ✅ | ❌ NON (texte généré automatiquement) |
| **Variable préavis** | `delaiPreavisGerant` ✅ | `delaiPreavisGerant` ✅ |
| **Comment généré** | Template fixe avec variables | `texteRevocationGerant` généré + `delaiPreavisGerant` |

**EURL** : La majorité pour révoquer le gérant est **paramétrable**.

**SARL** : La révocation est gérée par une **génération automatique** de texte. Les modalités de révocation ne sont pas paramétrables dans les statuts.

### 3. Pouvoirs du gérant

| Aspect | EURL | SARL |
|--------|------|------|
| **Article** | 16 | 18 |
| **Limitations** | `limitationsPouvoirs`, `descriptionLimitationsPouvoirs` | `limitationsPouvoirs`, `majoriteLimitationsPouvoirs`, `listeLimitationsPouvoirs` |
| **Cogérance** | ❌ NON | `cogerance`, `listeActesCogerance` ✅ |
| **Complexité** | Simple (oui/non + description) | Avancée (majorité pour limitations, liste détaillée, actes cogérance) |

**EURL** : Système **simple** de limitations de pouvoirs (texte libre).

**SARL** : Système **complexe** avec :
- Majorité requise pour les décisions soumises à autorisation préalable
- Liste détaillée des limitations
- Gestion de la cogérance (actes nécessitant l'accord de plusieurs gérants)

---

## ✅ SOLUTION À APPLIQUER

### Variables à collecter selon la forme

| Variable | EURL | SARL | Notes |
|----------|------|------|-------|
| `dureeMandat` | ✅ | ❌ | Pas dans les statuts SARL |
| `majoriteNominationGerant` | ✅ | ❌ | Généré automatiquement pour SARL |
| `majoriteRevocationGerant` | ✅ | ❌ | Généré automatiquement pour SARL |
| `delaiPreavisGerant` | ✅ | ✅ | Commun aux deux |
| `limitationsPouvoirs` | ✅ | ✅ | Commun mais structure différente |
| `descriptionLimitationsPouvoirs` | ✅ | ❌ | EURL = texte libre |
| `majoriteLimitationsPouvoirs` | ❌ | ✅ | SARL uniquement |
| `listeLimitationsPouvoirs` | ❌ | ✅ | SARL uniquement |
| `cogerance` | ❌ | ✅ | SARL uniquement |
| `listeActesCogerance` | ❌ | ✅ | SARL uniquement |

### Modifications à apporter au formulaire

#### 1. Conditionner "Durée du mandat" à EURL uniquement

```typescript
{/* Durée du mandat - EURL UNIQUEMENT */}
{dossier?.societe.formeJuridique === 'EURL' && (
  <div>
    <Label>Durée du mandat *</Label>
    <TrackedInput ... />
  </div>
)}
```

#### 2. Conditionner les majorités nomination/révocation à EURL uniquement

```typescript
{/* Majorités - EURL UNIQUEMENT */}
{dossier?.societe.formeJuridique === 'EURL' && (
  <div className="border-t pt-4 mt-4">
    <p className="text-sm font-medium mb-3">Majorités et modalités (Articles 14-15-16)</p>
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Majorité nomination gérant</Label>
          <TrackedInput ... />
        </div>
        <div>
          <Label>Majorité révocation gérant</Label>
          <TrackedInput ... />
        </div>
      </div>
    </div>
  </div>
)}
```

#### 3. Adapter les limitations de pouvoirs selon la forme

**EURL** : Texte libre simple
```typescript
{dossier?.societe.formeJuridique === 'EURL' && (
  <div>
    <Label>Description des limitations</Label>
    <Textarea ... />
  </div>
)}
```

**SARL** : Système complexe avec majorité et liste
```typescript
{dossier?.societe.formeJuridique === 'SARL' && (
  <>
    <div>
      <Label>Majorité pour les décisions soumises à autorisation</Label>
      <TrackedInput ... />
    </div>
    <div>
      <Label>Liste des limitations de pouvoirs</Label>
      <Textarea ... />
    </div>
    {/* Cogérance - SARL uniquement */}
    <div>
      <Label>Cogérance (actes nécessitant plusieurs gérants)</Label>
      <Checkbox ... />
    </div>
    {cogerance && (
      <div>
        <Label>Liste des actes en cogérance</Label>
        <Textarea ... />
      </div>
    )}
  </>
)}
```

---

## 📝 VÉRIFICATION TEMPLATE-ENGINE

Il faut vérifier comment `texteNominationGerant` et `texteRevocationGerant` sont générés dans `template-engine.ts` pour SARL.

**Recherche à faire** :
```bash
grep "texteNominationGerant\|texteRevocationGerant" src/utils/template-engine.ts
```

---

## 🎯 IMPACT

### Avant (incorrect)
- ❌ SARL affiche "Majorité nomination gérant" → **non utilisée dans template**
- ❌ SARL affiche "Majorité révocation gérant" → **non utilisée dans template**
- ❌ SARL affiche "Durée du mandat" → **non utilisée dans template**
- ❌ Formulaire SARL ne collecte PAS les variables spécifiques SARL (`majoriteLimitationsPouvoirs`, `cogerance`, etc.)

### Après (correct)
- ✅ EURL affiche les champs de majorités (utilisées dans template)
- ✅ SARL n'affiche PAS les champs de majorités (non utilisées)
- ✅ SARL affiche les champs spécifiques (limitations avancées, cogérance)
- ✅ Parfaite conformité avec les templates

---

## 🔧 ACTIONS REQUISES

1. ✅ Conditionner `dureeMandat` à EURL uniquement
2. ✅ Conditionner `majoriteNominationGerant` à EURL uniquement
3. ✅ Conditionner `majoriteRevocationGerant` à EURL uniquement
4. ✅ Conserver `delaiPreavisGerant` pour EURL et SARL
5. ✅ Adapter `limitationsPouvoirs` selon forme (simple pour EURL, avancé pour SARL)
6. ✅ Ajouter champs SARL spécifiques : `majoriteLimitationsPouvoirs`, `listeLimitationsPouvoirs`, `cogerance`, `listeActesCogerance`

---

**Conformité actuelle** : ❌ **INCORRECTE** (collecte de variables non utilisées)  
**Conformité après correctif** : ✅ **CONFORME à 100%**

