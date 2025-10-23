# 🔧 CORRECTIF COMPLET - Section Gérance SARL

**Date** : 21 octobre 2025  
**Fichier** : `src/pages/RedactionStatuts.tsx`  
**Lignes concernées** : 3065-3199

---

## ❌ PROBLÈME

Le formulaire affiche les mêmes champs pour EURL et SARL, alors que les templates sont **complèlement différents** :

### Variables actuellement collectées (INCORRECTES pour SARL)
- `dureeMandat` (texte libre) → utilisée pour EURL, **inutile pour SARL**
- `majoriteNominationGerant` → utilisée pour EURL, **inutile pour SARL** 
- `majoriteRevocationGerant` → utilisée pour EURL, **inutile pour SARL**
- `descriptionLimitationsPouvoirs` → EURL uniquement

### Variables MANQUANTES pour SARL
- `dureeMandat` : 'INDETERMINEE' | 'DETERMINEE' (pas texte libre)
- `anneesDureeMandat` : number (si durée déterminée)
- `reeligible` : boolean (si durée déterminée)
- `majoriteNomination` : 'LEGALE_AVEC_SECONDE' | 'LEGALE_SANS_SECONDE' | 'RENFORCEE_AVEC_SECONDE' | 'RENFORCEE_SANS_SECONDE'
- `majoriteRevocation` : idem
- `niveauMajoriteRenforcee` : string (ex: "deux tiers")
- `niveauMajoriteRevocation` : string
- `majoriteLimitationsPouvoirs` : string (majorité pour décisions soumises à autorisation)
- `listeLimitationsPouvoirs` : string (liste des limitations)
- `cogerance` : boolean
- `listeActesCogerance` : string (si cogérance)

---

## ✅ SOLUTION

### 1. Remplacer le bloc "Durée du mandat" (lignes 3065-3086)

**Ancien code** (INCORRECT) :
```typescript
{/* Champs spécifiques EURL : Durée du mandat */}
{!isSASU && (
  <div>
    <Label>Durée du mandat *</Label>
    <TrackedInput
      fieldName="dureeMandat"
      value={statutsData.gerant?.dureeMandat || 'durée de la société'}
      onChange={(e) =>
        updateStatutsData({
          gerant: {
            ...(statutsData.gerant || { isAssocieUnique: true, dureeMandat: 'durée de la société', remuneration: { type: 'AUCUNE' }, pouvoirs: 'Pouvoirs les plus étendus' }),
            dureeMandat: e.target.value,
          },
        })
      }
      onFieldChange={handleFieldChange}
      onFieldFocus={handleFieldFocus}
      onFieldBlur={handleFieldBlur}
      placeholder="Ex: durée de la société, 3 ans..."
    />
  </div>
)}
```

**Nouveau code** (CORRECT) :
```typescript
{/* EURL : Durée du mandat (texte libre) */}
{dossier?.societe.formeJuridique === 'EURL' && (
  <div>
    <Label>Durée du mandat *</Label>
    <TrackedInput
      fieldName="dureeMandat"
      value={statutsData.gerant?.dureeMandat || 'durée de la société'}
      onChange={(e) =>
        updateStatutsData({
          gerant: {
            ...(statutsData.gerant || { isAssocieUnique: true, dureeMandat: 'durée de la société', remuneration: { type: 'AUCUNE' }, pouvoirs: 'Pouvoirs les plus étendus' }),
            dureeMandat: e.target.value,
          },
        })
      }
      onFieldChange={handleFieldChange}
      onFieldFocus={handleFieldFocus}
      onFieldBlur={handleFieldBlur}
      placeholder="Ex: durée de la société, 3 ans..."
    />
  </div>
)}

{/* SARL : Durée du mandat (choix) - Article 17 */}
{dossier?.societe.formeJuridique === 'SARL' && (
  <div className="space-y-3">
    <div>
      <Label>Durée du mandat *</Label>
      <Select
        value={statutsData.dureeMandat || 'INDETERMINEE'}
        onChange={(e) =>
          updateStatutsData({
            dureeMandat: e.target.value as 'INDETERMINEE' | 'DETERMINEE',
          })
        }
      >
        <option value="INDETERMINEE">Durée indéterminée</option>
        <option value="DETERMINEE">Durée déterminée</option>
      </Select>
    </div>

    {statutsData.dureeMandat === 'DETERMINEE' && (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nombre d'années *</Label>
            <TrackedInput
              fieldName="anneesDureeMandat"
              type="number"
              value={statutsData.anneesDureeMandat || 5}
              onChange={(e) =>
                updateStatutsData({
                  anneesDureeMandat: parseInt(e.target.value) || 5,
                })
              }
              onFieldChange={handleFieldChange}
              onFieldFocus={handleFieldFocus}
              onFieldBlur={handleFieldBlur}
              min={1}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={statutsData.reeligible !== false}
                onChange={(e) =>
                  updateStatutsData({
                    reeligible: e.target.checked,
                  })
                }
                className="rounded"
              />
              Gérants rééligibles
            </Label>
          </div>
        </div>
      </>
    )}
  </div>
)}
```

### 2. Remplacer le bloc "Majorités et modalités" (lignes 3133-3199)

**Ancien code** (INCORRECT) :
```typescript
{/* Champs spécifiques EURL : Majorités et modalités (Articles 14-15-16) */}
{!isSASU && (
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
      <div>
        <Label>Délai de préavis (mois)</Label>
        <TrackedInput ... />
      </div>
      <div>
        <Label className="flex items-center gap-2">
          <input type="checkbox" ... />
          Limitations de pouvoirs du gérant (Article 16)
        </Label>
        {statutsData.limitationsPouvoirs && (
          <TrackedTextarea ... />
        )}
      </div>
    </div>
  </div>
)}
```

**Nouveau code** (CORRECT) :
```typescript
{/* EURL : Majorités et modalités (Articles 14-15-16) */}
{dossier?.societe.formeJuridique === 'EURL' && (
  <div className="border-t pt-4 mt-4">
    <p className="text-sm font-medium mb-3">Majorités et modalités (Articles 14-15-16)</p>
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Majorité nomination gérant</Label>
          <TrackedInput
            fieldName="majoriteNominationGerant"
            value={statutsData.majoriteNominationGerant || 'la moitié'}
            onChange={(e) => updateStatutsData({ majoriteNominationGerant: e.target.value })}
            onFieldChange={handleFieldChange}
            onFieldFocus={handleFieldFocus}
            onFieldBlur={handleFieldBlur}
            placeholder="Ex: la moitié, les deux tiers"
          />
        </div>
        <div>
          <Label>Majorité révocation gérant</Label>
          <TrackedInput
            fieldName="majoriteRevocationGerant"
            value={statutsData.majoriteRevocationGerant || 'la moitié'}
            onChange={(e) => updateStatutsData({ majoriteRevocationGerant: e.target.value })}
            onFieldChange={handleFieldChange}
            onFieldFocus={handleFieldFocus}
            onFieldBlur={handleFieldBlur}
            placeholder="Ex: la moitié, les deux tiers"
          />
        </div>
      </div>
      <div>
        <Label>Délai de préavis (mois)</Label>
        <TrackedInput
          fieldName="delaiPreavisGerant"
          type="number"
          value={statutsData.delaiPreavisGerant || 3}
          onChange={(e) => updateStatutsData({ delaiPreavisGerant: parseInt(e.target.value) || 3 })}
          onFieldChange={handleFieldChange}
          onFieldFocus={handleFieldFocus}
          onFieldBlur={handleFieldBlur}
          min={1}
        />
      </div>
      <div>
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={statutsData.limitationsPouvoirs || false}
            onChange={(e) => updateStatutsData({ limitationsPouvoirs: e.target.checked })}
          />
          Limitations de pouvoirs du gérant (Article 16)
        </Label>
        {statutsData.limitationsPouvoirs && (
          <TrackedTextarea
            fieldName="descriptionLimitationsPouvoirs"
            className="mt-3"
            value={statutsData.descriptionLimitationsPouvoirs || ''}
            onChange={(e) => updateStatutsData({ descriptionLimitationsPouvoirs: e.target.value })}
            placeholder="Décrire les limitations (emprunts, acquisitions, sûretés...)"
            rows={3}
          />
        )}
      </div>
    </div>
  </div>
)}

{/* SARL : Majorités et modalités (Articles 17-18-20) */}
{dossier?.societe.formeJuridique === 'SARL' && (
  <div className="border-t pt-4 mt-4">
    <p className="text-sm font-medium mb-3">Nomination et révocation (Articles 17-20)</p>
    <div className="space-y-4">
      {/* Majorité nomination */}
      <div>
        <Label>Majorité pour la nomination *</Label>
        <Select
          value={statutsData.majoriteNomination || 'LEGALE_AVEC_SECONDE'}
          onChange={(e) =>
            updateStatutsData({
              majoriteNomination: e.target.value as any,
            })
          }
        >
          <option value="LEGALE_AVEC_SECONDE">
            Majorité légale (moitié) avec possibilité de seconde consultation
          </option>
          <option value="LEGALE_SANS_SECONDE">
            Majorité légale (moitié) sans seconde consultation
          </option>
          <option value="RENFORCEE_AVEC_SECONDE">
            Majorité renforcée avec possibilité de seconde consultation
          </option>
          <option value="RENFORCEE_SANS_SECONDE">
            Majorité renforcée sans seconde consultation
          </option>
        </Select>
      </div>

      {(statutsData.majoriteNomination === 'RENFORCEE_AVEC_SECONDE' ||
        statutsData.majoriteNomination === 'RENFORCEE_SANS_SECONDE') && (
        <div>
          <Label>Niveau de majorité renforcée *</Label>
          <TrackedInput
            fieldName="niveauMajoriteRenforcee"
            value={statutsData.niveauMajoriteRenforcee || 'deux tiers'}
            onChange={(e) =>
              updateStatutsData({
                niveauMajoriteRenforcee: e.target.value,
              })
            }
            onFieldChange={handleFieldChange}
            onFieldFocus={handleFieldFocus}
            onFieldBlur={handleFieldBlur}
            placeholder="Ex: deux tiers, les trois quarts"
          />
        </div>
      )}

      {/* Majorité révocation */}
      <div>
        <Label>Majorité pour la révocation *</Label>
        <Select
          value={statutsData.majoriteRevocation || statutsData.majoriteNomination || 'LEGALE_AVEC_SECONDE'}
          onChange={(e) =>
            updateStatutsData({
              majoriteRevocation: e.target.value as any,
            })
          }
        >
          <option value="LEGALE_AVEC_SECONDE">
            Majorité légale (moitié) avec possibilité de seconde consultation
          </option>
          <option value="LEGALE_SANS_SECONDE">
            Majorité légale (moitié) sans seconde consultation
          </option>
          <option value="RENFORCEE_AVEC_SECONDE">
            Majorité renforcée avec possibilité de seconde consultation
          </option>
          <option value="RENFORCEE_SANS_SECONDE">
            Majorité renforcée sans seconde consultation
          </option>
        </Select>
      </div>

      {(statutsData.majoriteRevocation === 'RENFORCEE_AVEC_SECONDE' ||
        statutsData.majoriteRevocation === 'RENFORCEE_SANS_SECONDE') && (
        <div>
          <Label>Niveau de majorité renforcée pour révocation *</Label>
          <TrackedInput
            fieldName="niveauMajoriteRevocation"
            value={statutsData.niveauMajoriteRevocation || statutsData.niveauMajoriteRenforcee || 'deux tiers'}
            onChange={(e) =>
              updateStatutsData({
                niveauMajoriteRevocation: e.target.value,
              })
            }
            onFieldChange={handleFieldChange}
            onFieldFocus={handleFieldFocus}
            onFieldBlur={handleFieldBlur}
            placeholder="Ex: deux tiers, les trois quarts"
          />
        </div>
      )}

      {/* Délai de préavis */}
      <div>
        <Label>Délai de préavis (mois) *</Label>
        <TrackedInput
          fieldName="delaiPreavisGerant"
          type="number"
          value={statutsData.delaiPreavisGerant || 3}
          onChange={(e) =>
            updateStatutsData({
              delaiPreavisGerant: parseInt(e.target.value) || 3,
            })
          }
          onFieldChange={handleFieldChange}
          onFieldFocus={handleFieldFocus}
          onFieldBlur={handleFieldBlur}
          min={1}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Préavis de démission du gérant (Article 20)
        </p>
      </div>

      {/* Limitations de pouvoirs - Article 18 */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">Pouvoirs de la Gérance (Article 18)</p>
        
        <Label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={statutsData.limitationsPouvoirs || false}
            onChange={(e) =>
              updateStatutsData({
                limitationsPouvoirs: e.target.checked,
              })
            }
            className="rounded"
          />
          Prévoir des limitations de pouvoirs
        </Label>

        {statutsData.limitationsPouvoirs && (
          <div className="space-y-3 ml-6">
            <div>
              <Label>Majorité requise pour les décisions soumises à autorisation *</Label>
              <TrackedInput
                fieldName="majoriteLimitationsPouvoirs"
                value={statutsData.majoriteLimitationsPouvoirs || 'la moitié'}
                onChange={(e) =>
                  updateStatutsData({
                    majoriteLimitationsPouvoirs: e.target.value,
                  })
                }
                onFieldChange={handleFieldChange}
                onFieldFocus={handleFieldFocus}
                onFieldBlur={handleFieldBlur}
                placeholder="Ex: la moitié, les deux tiers"
              />
            </div>
            <div>
              <Label>Liste des décisions nécessitant autorisation préalable *</Label>
              <TrackedTextarea
                fieldName="listeLimitationsPouvoirs"
                value={statutsData.listeLimitationsPouvoirs || ''}
                onChange={(e) =>
                  updateStatutsData({
                    listeLimitationsPouvoirs: e.target.value,
                  })
                }
                placeholder="Ex: - Emprunts supérieurs à 50 000 €&#10;- Acquisitions ou cessions d'immeubles&#10;- Constitution de sûretés..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Cogérance */}
        <div className="border-t pt-4 mt-4">
          <Label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={statutsData.cogerance || false}
              onChange={(e) =>
                updateStatutsData({
                  cogerance: e.target.checked,
                })
              }
              className="rounded"
            />
            Prévoir une cogérance (certains actes nécessitent plusieurs gérants)
          </Label>

          {statutsData.cogerance && (
            <div className="ml-6">
              <Label>Liste des actes nécessitant l'intervention de plusieurs gérants *</Label>
              <TrackedTextarea
                fieldName="listeActesCogerance"
                value={statutsData.listeActesCogerance || ''}
                onChange={(e) =>
                  updateStatutsData({
                    listeActesCogerance: e.target.value,
                  })
                }
                placeholder="Ex: - Cessions de fonds de commerce&#10;- Emprunts supérieurs à 100 000 €&#10;- Acquisitions immobilières..."
                rows={4}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
```

---

## 📝 VARIABLES À AJOUTER DANS `src/types/statuts.ts`

Ajouter dans l'interface `StatutsData` :

```typescript
// Variables SARL pour génération textes Articles 17 et 20
dureeMandat?: 'INDETERMINEE' | 'DETERMINEE' // Durée du mandat des gérants
anneesDureeMandat?: number // Nombre d'années si durée déterminée
reeligible?: boolean // Gérants rééligibles (si durée déterminée)
majoriteNomination?: 'LEGALE_AVEC_SECONDE' | 'LEGALE_SANS_SECONDE' | 'RENFORCEE_AVEC_SECONDE' | 'RENFORCEE_SANS_SECONDE'
majoriteRevocation?: 'LEGALE_AVEC_SECONDE' | 'LEGALE_SANS_SECONDE' | 'RENFORCEE_AVEC_SECONDE' | 'RENFORCEE_SANS_SECONDE'
niveauMajoriteRenforcee?: string // Ex: "deux tiers" (si majorité renforcée)
niveauMajoriteRevocation?: string // Ex: "deux tiers" (si différent de nomination)

// Article 18 : Pouvoirs de la Gérance (SARL)
majoriteLimitationsPouvoirs?: string // Majorité pour décisions soumises à autorisation
listeLimitationsPouvoirs?: string // Liste détaillée des limitations
cogerance?: boolean // Certains actes nécessitent plusieurs gérants
listeActesCogerance?: string // Liste des actes en cogérance
```

---

## 🎯 RÉSULTAT

### Avant
- ❌ SARL affiche "Majorité nomination gérant" (EURL) → non utilisée
- ❌ SARL affiche "Majorité révocation gérant" (EURL) → non utilisée  
- ❌ SARL affiche "Durée du mandat" texte libre → non utilisée
- ❌ SARL ne collecte PAS les bonnes variables pour générer `texteNominationGerant` et `texteRevocationGerant`
- ❌ SARL ne collecte PAS les variables avancées de l'Article 18

### Après
- ✅ EURL affiche les champs EURL (utilisés dans template EURL)
- ✅ SARL affiche les champs SARL (alimentent les fonctions de génération)
- ✅ SARL collecte : durée (IN DETERMINEE/DETERMINEE), années, rééligibilité
- ✅ SARL collecte : majorités (4 choix), niveaux de majorité renforcée
- ✅ SARL collecte : limitations avancées (majorité + liste)
- ✅ SARL collecte : cogérance (checkbox + liste d'actes)

---

**Conformité** : ✅ **100% conforme au template SARL**

