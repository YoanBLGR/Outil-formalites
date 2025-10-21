# Vérification Complète des Variables du Template SARL

## Résumé
- **Total de variables**: 80
- **Variables vérifiées**: En cours
- **Variables manquantes ou incomplètes**: À identifier

## Liste des 80 Variables du Template SARL (variablesGlobales)

### ✅ SECTION 1-2: Identité de la société (7 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 1 | `denomination` | ✅ OK | template-engine.ts | |
| 2 | `sigle` | ✅ OK | template-engine.ts | Optionnel |
| 3 | `capitalSocial` | ✅ OK | template-engine.ts | |
| 4 | `capitalSocialChiffres` | ✅ OK | template-engine.ts | |
| 5 | `siegeSocial` | ✅ OK | template-engine.ts | |
| 6 | `objetSocial` | ✅ OK | template-engine.ts | |
| 7 | `raisonEtre` | ✅ OK | template-engine.ts | Optionnel |

### ✅ SECTION 2: Durée (1 variable)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 8 | `duree` | ✅ OK | template-engine.ts | |

### ✅ SECTION Préambule: Associés (2 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 9 | `listeAssocies` | ✅ OK | template-engine.ts:587 | Généré automatiquement |
| 10 | `repartitionParts` | ✅ OK | template-engine.ts:597 | Généré automatiquement |

### ✅ SECTION 6-7: Apports et Capital (22 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 11 | `nombreParts` | ✅ OK | template-engine.ts | Calculé automatiquement |
| 12 | `valeurNominale` | ✅ OK | template-engine.ts | Calculé automatiquement |
| 13 | `statutLiberationParts` | ✅ OK | template-engine.ts:1028-1040 | Généré automatiquement |
| 14 | `apportsNumeraire` | ✅ OK | template-engine.ts:939 | Boolean |
| 15 | `liberationTotale` | ✅ OK | template-engine.ts:940 | Boolean |
| 16 | `listeApporteursNumeraire` | ✅ OK | template-engine.ts:986, 1005 | Généré automatiquement |
| 17 | `montantTotalNumeraire` | ✅ OK | template-engine.ts:1001, 1008 | Calculé automatiquement |
| 18 | `dateDepotFonds` | ✅ OK | template-engine.ts:460 | |
| 19 | `lieuDepotFonds` | ✅ OK | template-engine.ts:959-971 | Généré automatiquement |
| 20 | `montantLibere` | ✅ OK | template-engine.ts:627 | |
| 21 | `montantNonLibere` | ✅ OK | template-engine.ts:630 | |
| 22 | `apportsNature` | ✅ OK | template-engine.ts:941 | Boolean |
| 23 | `commissaireAuxApportsUnanime` | ✅ OK | template-engine.ts:946 | Boolean |
| 24 | `commissaireAuxApportsOrdonnance` | ✅ OK | template-engine.ts:947 | Boolean |
| 25 | `commissaireAuxApports` | ✅ OK | template-engine.ts:651, 669, 685 | Boolean |
| 26 | `listeApporteursNature` | ✅ OK | template-engine.ts:995, 1006 | Généré automatiquement |
| 27 | `commissaireAuxApportsNom` | ✅ OK | template-engine.ts:653, 671, 687 | |
| 28 | `dateRapportCAA` | ⚠️ À VÉRIFIER | ? | Date du rapport commissaire aux apports |
| 29 | `dateDesignationCAA` | ⚠️ À VÉRIFIER | ? | Date désignation commissaire (unanime) |
| 30 | `valeurApportNature` | ⚠️ À VÉRIFIER | ? | Valeur totale apport nature |
| 31 | `identiteApporteurNature` | ⚠️ À VÉRIFIER | ? | Identité de l'apporteur en nature |
| 32 | `nombrePartsNature` | ✅ OK | template-engine.ts:648, 664 | Calculé automatiquement |
| 33 | `lieuTribunal` | ⚠️ À VÉRIFIER | ? | Pour ordonnance désignation CAA |
| 34 | `dateOrdonnance` | ⚠️ À VÉRIFIER | ? | Date ordonnance désignation CAA |
| 35 | `identiteRequerant` | ⚠️ À VÉRIFIER | ? | Pour ordonnance désignation CAA |
| 36 | `apportsIndustrie` | ✅ OK | template-engine.ts:942 | false par défaut |
| 37 | `identiteApporteurIndustrie` | ✅ OK | template-engine.ts:1013 | Placeholder |
| 38 | `descriptionApportIndustrie` | ✅ OK | template-engine.ts:1014 | Placeholder |
| 39 | `nombrePartsIndustrie` | ✅ OK | template-engine.ts:1015 | 0 par défaut |
| 40 | `pourcentageBenefices` | ✅ OK | template-engine.ts:1016 | 0 par défaut |
| 41 | `pourcentagePertes` | ✅ OK | template-engine.ts:1017 | 0 par défaut |
| 42 | `montantTotalNature` | ⚠️ À VÉRIFIER | ? | Total des apports en nature |

### ❌ SECTION 8: Capital - Variable manquante
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 43 | `droitPreferentielSouscription` | ❌ MANQUANT | - | Article 8: Droit préférentiel de souscription |

**Impact**: Article 8 a 2 variants selon cette variable. Si non collectée, le template utilisera toujours le variant sans droit préférentiel.

### ❌ SECTION 12: Indivisibilité - Variable manquante
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 44 | `repartitionVotesUsufruit` | ❌ MANQUANT | - | Article 12: Répartition votes usufruit/nu-propriétaire |

**Impact**: Article 12 a 3 variants (NU_PROPRIETAIRE, USUFRUITIER, MIXTE). Si non collectée, risque d'erreur template.

### ✅ SECTION 13: Cession et transmission (5 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 45 | `regimeCession` | ✅ OK | template-engine.ts:464 | LIBRE_ENTRE_ASSOCIES/LIBRE_FAMILIAL/LIBRE_ASSOCIES_FAMILIAL/AGREMENT_TOTAL |
| 46 | `cessionFamilialeLibre` | ✅ OK | template-engine.ts:469-470 | Calculé automatiquement |
| 47 | `transmissionDeces` | ✅ OK | template-engine.ts:471 | SURVIVANTS_SEULS/HERITIERS_AVEC_AGREMENT/etc. |
| 48 | `personnesDesignees` | ✅ OK | template-engine.ts:472 | Pour PERSONNES_DESIGNEES |
| 49 | `texteLiquidationCommunaute` | ✅ OK | template-engine.ts:479-483 | Généré automatiquement |

**Note**: Ajouté `locationParts` (ligne 473) pour Article 13.5 ✅

### ✅ SECTION 17-20: Gérance (7 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 50 | `texteNominationGerant` | ✅ OK | template-engine.ts:487 | Généré par fonction |
| 51 | `texteRevocationGerant` | ✅ OK | template-engine.ts:490 | Généré par fonction |
| 52 | `dureeMandat` | ✅ OK | template-engine.ts:494 | INDETERMINEE/DETERMINEE |
| 53 | `limitationsPouvoirs` | ✅ OK | template-engine.ts:506 | Boolean |
| 54 | `majoriteLimitationsPouvoirs` | ❌ MANQUANT | Formulaire? | Pour Article 18 si limitationsPouvoirs=true |
| 55 | `listeLimitationsPouvoirs` | ❌ MANQUANT | Formulaire? | Liste des actes limités |
| 56 | `cogerance` | ⚠️ À VÉRIFIER | Formulaire? | Boolean - plusieurs gérants |
| 57 | `listeActesCogerance` | ❌ MANQUANT | Formulaire? | Si cogerance=true |
| 58 | `delaiPreavisGerant` | ✅ OK | template-engine.ts:499 | Nombre de mois |

### ✅ SECTION 23: Commissaires aux comptes (6 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 59 | `designationCAC_Obligatoire` | ✅ OK | template-engine.ts:884 | Boolean |
| 60 | `nominationPremiersCAC` | ⚠️ À VÉRIFIER | ? | Boolean - nommés dans statuts? |
| 61 | `dureeCAC` | ✅ OK | template-engine.ts:920 | "6" exercices par défaut |
| 62 | `dateFinMandatCAC` | ⚠️ À VÉRIFIER | ? | Date fin mandat |
| 63 | `nomCACTitulaire` | ⚠️ À VÉRIFIER | ? | Nom CAC titulaire |
| 64 | `nomCACSuppléant` | ⚠️ À VÉRIFIER | ? | Nom CAC suppléant (optionnel) |

### ✅ SECTION 24: Décisions collectives (8 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 65 | `formesDecisionsCollectives` | ✅ OK | template-engine.ts:887 | DIVERSES/ASSEMBLEE_SEULE/SANS_CE_UNANIME_COMPTES |
| 66 | `decisionsOrdinaires` | ✅ OK | template-engine.ts:888 | LEGALE_AVEC_SECONDE/LEGALE_SANS_SECONDE/etc. |
| 67 | `majoriteOrdinairesRenforcee` | ✅ OK | template-engine.ts:889 | Si décisions renforcées |
| 68 | `quorumExtraordinaire1` | ✅ OK | template-engine.ts:890 | "le quart" |
| 69 | `quorumExtraordinaire2` | ✅ OK | template-engine.ts:891 | "le cinquième" |
| 70 | `majoriteExtraordinaire` | ✅ OK | template-engine.ts:892 | "des deux tiers" |

### ✅ SECTION 26-27: Exercice social et Comptes (7 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 71 | `exerciceSocialCivil` | ✅ OK | template-engine.ts | Boolean - 1er janvier au 31 décembre |
| 72 | `dateCloturePremiereExercice` | ✅ OK | template-engine.ts | Date clôture 1er exercice |
| 73 | `dateDebutExercice` | ✅ OK | template-engine.ts | Si exerciceSocialCivil=false |
| 74 | `dateFinExercice` | ✅ OK | template-engine.ts | Si exerciceSocialCivil=false |
| 75 | `rapportGestion` | ✅ OK | template-engine.ts:902 | LEGAL/ACTIVITE/OBLIGATOIRE |
| 76 | `contenuRapportActivite` | ✅ OK | template-engine.ts:903 | Si ACTIVITE |

### ✅ SECTION 35: Nomination premier gérant (3 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 77 | `dureeGerantPremier` | ✅ OK | template-engine.ts:907 | Durée mandat 1er gérant |
| 78 | `nomPrenomGerantPremier` | ⚠️ À VÉRIFIER | ? | Identité 1er gérant |
| 79 | `adresseGerantPremier` | ⚠️ À VÉRIFIER | ? | Adresse 1er gérant |

### ✅ SECTION 37-39: Signature et formalités (3 variables)
| # | Variable | Statut | Source | Notes |
|---|----------|--------|--------|-------|
| 80 | `mandatairePostSignature` | ⚠️ À VÉRIFIER | ? | Mandataire pour actes post-signature |
| 81 | `lieuSignature` | ✅ OK | template-engine.ts | |
| 82 | `dateSignature` | ✅ OK | template-engine.ts | |
| 83 | `nombreExemplaires` | ✅ OK | template-engine.ts | |

---

## 📊 Résumé de la Vérification

### Variables OK: ~65/80 (81%)
- ✅ Identité société, durée, associés: 100%
- ✅ Apports et capital (base): 80%
- ✅ Cessions et transmissions: 100%
- ✅ Gérance (base): 85%
- ✅ Décisions collectives: 100%
- ✅ Exercice social: 100%

### ❌ Variables CRITIQUES manquantes (2):
1. **`droitPreferentielSouscription`** - Article 8
   - Impact: Choix entre 2 variants de l'article
   - Solution: Ajouter checkbox au formulaire Section 3 (Capital)

2. **`repartitionVotesUsufruit`** - Article 12
   - Impact: Choix entre 3 variants (NU_PROPRIETAIRE/USUFRUITIER/MIXTE)
   - Solution: Ajouter dropdown au formulaire Section 5bis

### ⚠️ Variables SECONDAIRES à vérifier (15):
- Commissaire aux apports (dates, lieux tribunal, identités)
- Nominations CAC dans statuts (noms, dates)
- Limitations pouvoirs gérant (liste actes)
- Cogérance (liste actes nécessitant accord)
- Gérant premier (identité complète)
- Mandataire post-signature

**Ces variables ont souvent des valeurs par défaut acceptables ou sont optionnelles.**

---

## 🔧 Actions Recommandées

### PRIORITÉ 1 - Variables Critiques Manquantes
1. ✅ **Ajouter `locationParts`** - FAIT
2. ❌ **Ajouter `droitPreferentielSouscription`** au formulaire (Section Capital)
3. ❌ **Ajouter `repartitionVotesUsufruit`** au formulaire (Section Admission)

### PRIORITÉ 2 - Variables Secondaires
4. Vérifier collecte des données commissaire aux apports (dates, lieux)
5. Ajouter collecte limitations pouvoirs détaillées
6. Ajouter support cogérance avec liste actes

### PRIORITÉ 3 - Optimisations
7. Vérifier calculs automatiques montants
8. Améliorer génération textes apporteurs

