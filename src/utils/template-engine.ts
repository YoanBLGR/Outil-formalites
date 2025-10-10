import type { StatutsData } from '../types/statuts'
import type { Dossier } from '../types'
import templateEURLV3 from '../templates/statuts-eurl-conforme-v3.json'
import templateSASUV1 from '../templates/statuts-sasu-conforme-v1.json'
import { nombreEnLettres, montantAvecLettres, accorderGenre, formaterDateFrancais, formaterNombreFrancais } from './text-helpers'

// Template types for v2
export interface TemplateVariant {
  condition: string
  contenu?: string
  texte?: string
  variables?: string[]
  observations?: string
}

export interface TemplateArticle {
  numero: number | string
  titre: string
  contenu?: string
  variants?: TemplateVariant[]
  variables?: string[]
  obligatoire: boolean
  observations?: string
}

export interface TemplatePreambule {
  variants: TemplateVariant[]
}

export interface TemplateConclusion {
  texte: string
  variables: string[]
}

export interface StatutsTemplate {
  formeJuridique: string
  titre: string
  preambule: TemplatePreambule | string
  articles: TemplateArticle[]
  conclusion: TemplateConclusion | string
  variablesConcl?: string[]
  variablesGlobales?: string[]
}

// Fonction pour charger le template selon la forme juridique
export function getTemplate(formeJuridique: string): StatutsTemplate {
  switch (formeJuridique) {
    case 'EURL':
      return templateEURLV3 as StatutsTemplate
    case 'SARL':
      // TODO: Implémenter template SARL
      return templateEURLV3 as StatutsTemplate
    case 'SASU':
      return templateSASUV1 as StatutsTemplate
    case 'SAS':
      // TODO: Implémenter template SAS (utilise SASU pour l'instant)
      return templateSASUV1 as StatutsTemplate
    default:
      return templateEURLV3 as StatutsTemplate
  }
}

// Évaluer une condition simple
function evaluateCondition(condition: string, variables: Record<string, any>): boolean {
  // Simple condition evaluation: "variableName === 'VALUE'" or "variableName === true/false"
  try {
    // Handle simple equality checks
    const match = condition.match(/(\w+)\s*===\s*['"]?(\w+)['"]?/)
    if (match) {
      const [, varName, value] = match
      const varValue = variables[varName]

      // Compare as strings
      if (value === 'true' || value === 'false') {
        return varValue === (value === 'true')
      }
      return String(varValue) === value
    }

    return false
  } catch {
    return false
  }
}

// Traiter les blocs conditionnels {{#if}}...{{/if}}
function processConditionals(texte: string, variables: Record<string, any>): string {
  let result = texte

  // Process {{#if variable}} ... {{/if}} blocks
  const ifPattern = /\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs

  result = result.replace(ifPattern, (_match, variable, content) => {
    const value = variables[variable]
    // If variable is truthy, include the content, otherwise remove the block
    if (value) {
      return content
    }
    return ''
  })

  return result
}

// Fonction pour remplacer les variables dans un texte
export function replaceVariables(
  texte: string,
  variables: Record<string, string | number | boolean>
): string {
  // First process conditionals
  let result = processConditionals(texte, variables)

  // Then replace simple variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, String(value))
  })

  // Clean up any remaining unreplaced variables
  result = result.replace(/\{\{\w+\}\}/g, '[À compléter]')

  return result
}

// Sélectionner le variant approprié d'un article
function selectArticleVariant(
  article: TemplateArticle,
  variables: Record<string, any>
): string {
  // If article has direct content, use it
  if (article.contenu) {
    return article.contenu
  }

  // If article has variants, evaluate conditions
  if (article.variants) {
    for (const variant of article.variants) {
      if (evaluateCondition(variant.condition, variables)) {
        return variant.contenu || variant.texte || ''
      }
    }
  }

  return '[Article non disponible pour cette configuration]'
}

// Sélectionner le variant du préambule
function selectPreambuleVariant(
  preambule: TemplatePreambule | string,
  variables: Record<string, any>
): string {
  if (typeof preambule === 'string') {
    return preambule
  }

  // Evaluate conditions for variants
  for (const variant of preambule.variants) {
    if (evaluateCondition(variant.condition, variables)) {
      return variant.texte || ''
    }
  }

  return '[Préambule non disponible]'
}

// Fonction pour construire les variables depuis les données du dossier et du formulaire
export function buildVariables(dossier: Dossier, statutsData: Partial<StatutsData>): Record<string, any> {
  const variables: Record<string, any> = {
    // Identité de la société
    denomination: statutsData.denomination || dossier.societe.denomination,
    sigle: statutsData.sigle || '',
    objetSocial: statutsData.objetSocial || dossier.societe.objetSocial || '[À compléter]',
    siegeSocial: statutsData.siegeSocial || dossier.societe.siege,

    // Durée
    duree: statutsData.duree || 99,

    // Capital (avec version en lettres)
    capitalSocial: montantAvecLettres(statutsData.capitalSocial || dossier.societe.capitalSocial || 0),
    capitalSocialChiffres: formaterNombreFrancais(statutsData.capitalSocial || dossier.societe.capitalSocial || 0),
    // Pour EURL/SARL
    nombreParts: statutsData.nombreParts || 100,
    nombrePartsLettres: nombreEnLettres(statutsData.nombreParts || 100),
    // Pour SASU/SAS
    nombreActions: statutsData.nombreActions || statutsData.nombreParts || 100,
    nombreActionsLettres: nombreEnLettres(statutsData.nombreActions || statutsData.nombreParts || 100),
    // Valeur nominale (commun)
    valeurNominale: statutsData.valeurNominale || ((dossier.societe.capitalSocial || 1000) / 100).toFixed(2),
    valeurNominaleLettres: nombreEnLettres(Math.round((statutsData.valeurNominale || ((dossier.societe.capitalSocial || 1000) / 100)))),

    // Type d'associé (for condition evaluation)
    associeType: statutsData.associeUnique?.type || 'PERSONNE_PHYSIQUE',

    // Exercice social
    exerciceDebut: statutsData.exerciceSocial?.dateDebut || '1er janvier',
    exerciceFin: statutsData.exerciceSocial?.dateFin || '31 décembre',
    premierExerciceFin: statutsData.exerciceSocial?.premierExerciceFin || `31 décembre ${new Date().getFullYear()}`,

    // Dates de signature
    dateSignature: statutsData.dateSignature || new Date().toLocaleDateString('fr-FR'),
    lieuSignature: statutsData.lieuSignature || dossier.societe.siege.split(',')[0],
    nombreExemplaires: statutsData.nombreExemplaires || 3,

    // Dépôt de fonds
    dateDepotFonds: statutsData.depotFonds?.date || '[Date de dépôt]',
    etablissementDepot: statutsData.depotFonds?.etablissement || '[Établissement]',

    // Article 11: Admission de nouveaux associés
    regimeCession: statutsData.admissionAssocies?.regimeCession || 'LIBRE_FAMILIAL_AGREMENT_TIERS',
    majoriteCessionTiers: statutsData.admissionAssocies?.majoriteCessionTiers || 'la moitié',
    majoriteMutation: statutsData.admissionAssocies?.majoriteMutation || 'la moitié',
    modalitesPrixRachat: statutsData.admissionAssocies?.modalitesPrixRachat || '[Modalités à définir]',
    agrementDeces: statutsData.admissionAssocies?.agrementDeces || false,
    beneficiairesContinuation: statutsData.admissionAssocies?.beneficiairesContinuation || '[Bénéficiaires]',
    modalitesValeurDroits: statutsData.admissionAssocies?.modalitesValeurDroits || '[Modalités de valorisation]',

    // Article 14-15: Gérance (majorités et délais)
    majoriteNominationGerant: statutsData.majoriteNominationGerant || 'la moitié',
    majoriteRevocationGerant: statutsData.majoriteRevocationGerant || 'la moitié',
    delaiPreavisGerant: statutsData.delaiPreavisGerant || 3,

    // Article 16: Limitations de pouvoirs
    limitationsPouvoirs: statutsData.limitationsPouvoirs || false,
    descriptionLimitationsPouvoirs: statutsData.descriptionLimitationsPouvoirs || '',

    // Article 21: Comptes courants
    seuilCompteCourant: statutsData.compteCourant?.seuilMinimum || 5,

    // Article 27 bis: Clause compromissoire
    delaiArbitrage: statutsData.delaiArbitrage || 6,
  }

  // Associé unique - Personne physique
  if (statutsData.associeUnique?.type === 'PERSONNE_PHYSIQUE') {
    const associe = statutsData.associeUnique
    variables.associePrenom = associe.prenom
    variables.associeNom = associe.nom
    variables.associeDesignation = `${associe.prenom} ${associe.nom}`
    variables.associeCivilite = associe.civilite
    variables.civiliteAssocie = associe.civilite // Pour l'accord de genre
    variables.associeDateNaissance = associe.dateNaissance ? formaterDateFrancais(associe.dateNaissance) : '[Date de naissance]'
    variables.associeLieuNaissance = associe.lieuNaissance || '[Lieu de naissance]'
    variables.associeNationalite = associe.nationalite || 'française'
    variables.associeAdresse = associe.adresse || '[Adresse]'
    variables.associeRegimeMatrimonial = associe.regimeMatrimonial || ''
    variables.associePacs = associe.pacs || false
    variables.nomAssocieSignature = `${associe.prenom} ${associe.nom}`

    // Informations conjoint si bien commun
    if (associe.conjointNom && associe.conjointPrenom) {
      variables.conjointCivilite = associe.civilite === 'M' ? 'Mme' : 'M'
      variables.conjointPrenom = associe.conjointPrenom
      variables.conjointNom = associe.conjointNom
    }
  }
  // Associé unique - Personne morale
  else if (statutsData.associeUnique?.type === 'PERSONNE_MORALE') {
    const associe = statutsData.associeUnique
    variables.associeSocieteNom = associe.societeNom || '[Dénomination sociale]'
    variables.associeDesignation = associe.societeNom || '[Dénomination sociale]'
    variables.associeSocieteFormeJuridique = associe.societeFormeJuridique || '[Forme juridique]'
    variables.associeSocieteCapital = associe.societeCapital?.toLocaleString('fr-FR') || '0'
    variables.associeSocieteRCS = associe.societeRCS || '[RCS]'
    variables.associeSocieteNumeroRCS = associe.societeNumeroRCS || '[Numéro]'
    variables.associeSocieteSiege = associe.societeSiege || '[Siège social]'
    variables.associeRepresentantPrenom = associe.representantPrenom || '[Prénom]'
    variables.associeRepresentantNom = associe.representantNom || '[Nom]'
    variables.associeRepresentantQualite = associe.representantQualite || '[Qualité]'
    variables.nomAssocieSignature = variables.associeSocieteNom
    variables.civiliteAssocie = 'M' // Par défaut pour personne morale (neutre)
  }
  // Fallback: use dossier client data
  else {
    variables.associePrenom = dossier.client.prenom
    variables.associeNom = dossier.client.nom
    variables.associeDesignation = `${dossier.client.prenom} ${dossier.client.nom}`
    variables.associeCivilite = dossier.client.civilite
    variables.civiliteAssocie = dossier.client.civilite
    variables.associeNationalite = 'française'
    variables.associeAdresse = '[Adresse]'
    variables.nomAssocieSignature = `${dossier.client.prenom} ${dossier.client.nom}`
  }

  // Apports détaillés (for condition evaluation and variables)
  if (statutsData.apportDetaille) {
    const apport = statutsData.apportDetaille
    variables.typeApport = apport.type

    // Build variant-specific variables based on apport type
    switch (apport.type) {
      case 'NUMERAIRE_TOTAL':
        variables.montantApportNumeraire = montantAvecLettres(apport.montant)
        variables.nombrePartsNumeraire = apport.nombreParts
        variables.nombrePartsNumeraireLettres = nombreEnLettres(apport.nombreParts)
        // Pour SASU/SAS
        variables.nombreActionsNumeraire = apport.nombreActions || apport.nombreParts
        variables.nombreActionsNumeraireLettres = nombreEnLettres(apport.nombreActions || apport.nombreParts)
        variables.liberationPartielle = false
        break

      case 'NUMERAIRE_PARTIEL':
        variables.montantApportNumeraire = montantAvecLettres(apport.montant)
        variables.montantLibere = montantAvecLettres(apport.montantLibere)
        variables.pourcentageLibere = apport.pourcentageLibere
        variables.montantRestant = montantAvecLettres(apport.montantRestant)
        variables.nombrePartsNumeraire = apport.nombreParts
        variables.nombrePartsNumeraireLettres = nombreEnLettres(apport.nombreParts)
        // Pour SASU/SAS
        variables.nombreActionsNumeraire = apport.nombreActions || apport.nombreParts
        variables.nombreActionsNumeraireLettres = nombreEnLettres(apport.nombreActions || apport.nombreParts)
        variables.liberationPartielle = true
        // Fraction de libération (cinquième, quart, moitié)
        const pct = apport.pourcentageLibere
        if (pct === 20) variables.fractionLiberation = 'cinquième'
        else if (pct === 25) variables.fractionLiberation = 'quart'
        else if (pct === 50) variables.fractionLiberation = 'moitié'
        else variables.fractionLiberation = `${pct}%`
        break

      case 'NATURE_SEUL':
        variables.descriptionBiensNature = apport.description || '[Description des biens]'
        variables.valeurApportNature = montantAvecLettres(apport.valeur)
        variables.nombrePartsNature = apport.nombreParts
        variables.nombrePartsNatureLettres = nombreEnLettres(apport.nombreParts)
        variables.dateContratApport = '[Date du contrat]'
        variables.commissaireAuxApports = apport.commissaireAuxApports.requis
        if (apport.commissaireAuxApports.requis) {
          variables.commissaireAuxApportsNom = `${apport.commissaireAuxApports.prenom || ''} ${apport.commissaireAuxApports.nom || ''}`.trim() || '[Nom du commissaire]'
        }
        break

      case 'MIXTE_NUMERAIRE_NATURE':
        variables.montantApportNumeraire = montantAvecLettres(apport.numeraire.montant)
        variables.descriptionBiensNature = apport.nature.description || '[Description]'
        variables.valeurApportNature = montantAvecLettres(apport.nature.valeur)
        variables.nombreParts = apport.nombreParts
        variables.apportMixte = true
        variables.nombrePartsNumeraire = Math.round(apport.nombreParts * (apport.numeraire.montant / (apport.numeraire.montant + apport.nature.valeur)))
        variables.nombrePartsNature = apport.nombreParts - variables.nombrePartsNumeraire
        variables.nombrePartsNumeraireLettres = nombreEnLettres(variables.nombrePartsNumeraire)
        variables.nombrePartsNatureLettres = nombreEnLettres(variables.nombrePartsNature)
        variables.montantTotalApports = montantAvecLettres(apport.numeraire.montant + apport.nature.valeur)
        variables.dateContratApport = '[Date du contrat]'
        variables.commissaireAuxApports = apport.commissaireAuxApports.requis
        if (apport.commissaireAuxApports.requis) {
          variables.commissaireAuxApportsNom = `${apport.commissaireAuxApports.prenom || ''} ${apport.commissaireAuxApports.nom || ''}`.trim() || '[Nom du commissaire]'
        }
        break

      case 'FONDS_COMMERCE':
        variables.natureFondsCommerce = apport.nature || '[Nature du fonds]'
        variables.adresseFondsCommerce = apport.adresse || '[Adresse]'
        variables.numeroIdentificationFonds = '[Numéro SIREN]'
        variables.valeurElementsIncorporels = montantAvecLettres(apport.elementsIncorporels)
        variables.valeurMateriel = montantAvecLettres(apport.materiel)
        variables.valeurMarchandises = montantAvecLettres(apport.marchandises || 0)
        variables.valeurFondsCommerce = montantAvecLettres(apport.valeurTotale)
        variables.nombrePartsFonds = apport.nombreParts
        variables.nombrePartsFondsLettres = nombreEnLettres(apport.nombreParts)
        variables.commissaireAuxApports = apport.commissaireAuxApports.requis
        if (apport.commissaireAuxApports.requis) {
          variables.commissaireAuxApportsNom = `${apport.commissaireAuxApports.prenom || ''} ${apport.commissaireAuxApports.nom || ''}`.trim() || '[Nom du commissaire]'
        }
        break

      case 'BIEN_COMMUN':
        variables.descriptionBienCommun = apport.description || '[Description]'
        variables.valeurBienCommun = montantAvecLettres(apport.valeur)
        variables.regimeMatrimonial = apport.regimeMatrimonial
        variables.conjointPrenom = apport.conjointPrenom || '[Prénom]'
        variables.conjointNom = apport.conjointNom || '[Nom]'
        variables.dateAvertissementConjoint = '[Date]'
        variables.conjointInterventionStatuts = false
        variables.consentementArticle1424 = false
        variables.conjointRenonciationCourrier = true
        variables.dateRenonciationConjoint = '[Date]'
        variables.nombrePartsBienCommun = apport.nombreParts
        variables.nombrePartsBienCommunLettres = nombreEnLettres(apport.nombreParts)
        // Générer le texte de l'apport principal selon le type
        variables.apportPrincipal = '[Description de l\'apport principal]'
        break

      case 'PACS_INDIVISION':
        variables.descriptionBienIndivis = apport.description || '[Description]'
        variables.valeurBienIndivis = montantAvecLettres(apport.valeur)
        variables.partenaireNom = `${apport.partenairePrenom || ''} ${apport.partenaireNom || ''}`.trim() || '[Partenaire]'
        variables.nombrePartsBienIndivis = apport.nombreParts
        variables.nombrePartsBienIndivisLettres = nombreEnLettres(apport.nombreParts)
        // Générer le texte de l'apport principal
        variables.apportPrincipal = '[Description de l\'apport principal]'
        break
    }
  }

  // Gérant (pour article 30 - Nomination du premier gérant)
  if (statutsData.nominationGerant) {
    const nomination = statutsData.nominationGerant
    variables.gerantDansStatuts = nomination.gerantDansStatuts
    variables.gerantEstAssocie = nomination.gerantEstAssocie
    variables.dureeNominationGerant = nomination.dureeNomination || 'indéterminée'
    variables.remunerationGerant = nomination.remunerationFixee || false
    variables.descriptionRemunerationGerant = nomination.descriptionRemuneration || '[À définir]'
    
    if (nomination.gerantEstAssocie) {
      // Le gérant est l'associé unique
      variables.gerantPrenom = variables.associePrenom
      variables.gerantNom = variables.associeNom
      variables.gerantAdresse = variables.associeAdresse
    } else if (statutsData.gerant) {
      // Gérant tiers
      const gerant = statutsData.gerant
      variables.gerantPrenom = gerant.prenom || '[Prénom]'
      variables.gerantNom = gerant.nom || '[Nom]'
      variables.gerantAdresse = gerant.adresse || '[Adresse]'
      variables.gerantCivilite = gerant.civilite || 'M'
      variables.gerantDateNaissance = gerant.dateNaissance || '[Date]'
      variables.gerantLieuNaissance = gerant.lieuNaissance || '[Lieu]'
      variables.gerantNationalite = gerant.nationalite || 'française'
    }
  } else if (statutsData.gerant) {
    // Fallback pour compatibilité
    const gerant = statutsData.gerant
    variables.gerantDansStatuts = true
    variables.gerantEstAssocie = gerant.isAssocieUnique
    variables.dureeNominationGerant = gerant.dureeMandat || 'la durée de la société'
    
    if (gerant.nom) {
      variables.gerantPrenom = gerant.prenom || '[Prénom]'
      variables.gerantNom = gerant.nom
      variables.gerantAdresse = gerant.adresse || '[Adresse]'
      variables.gerantCivilite = gerant.civilite || 'M'
      variables.gerantDateNaissance = gerant.dateNaissance || '[Date]'
      variables.gerantLieuNaissance = gerant.lieuNaissance || '[Lieu]'
      variables.gerantNationalite = gerant.nationalite || 'française'
    }
  }

  // Président (pour SASU/SAS - Article 13)
  if (statutsData.nominationPresident) {
    const nomination = statutsData.nominationPresident
    variables.presidentDansStatuts = nomination.presidentDansStatuts
    variables.presidentEstAssocie = nomination.presidentEstAssocie
    variables.dureeNominationPresident = nomination.dureeNomination || 'sans limitation de durée'
    variables.remunerationPresident = nomination.remunerationFixee || false
    variables.descriptionRemunerationPresident = nomination.descriptionRemuneration || '[À définir]'

    if (nomination.presidentEstAssocie) {
      // Le président est l'associé unique
      variables.presidentPrenom = variables.associePrenom
      variables.presidentNom = variables.associeNom
      variables.presidentAdresse = variables.associeAdresse
      variables.presidentDateNaissance = variables.associeDateNaissance
      variables.presidentLieuNaissance = variables.associeLieuNaissance
      variables.presidentNationalite = variables.associeNationalite
    } else if (statutsData.president) {
      // Président tiers
      const president = statutsData.president
      variables.presidentPrenom = president.prenom || '[Prénom]'
      variables.presidentNom = president.nom || '[Nom]'
      variables.presidentAdresse = president.adresse || '[Adresse]'
      variables.presidentCivilite = president.civilite || 'M'
      variables.presidentDateNaissance = president.dateNaissance || '[Date]'
      variables.presidentLieuNaissance = president.lieuNaissance || '[Lieu]'
      variables.presidentNationalite = president.nationalite || 'française'
    }
  } else if (statutsData.president) {
    // Fallback pour compatibilité
    const president = statutsData.president
    variables.presidentDansStatuts = true
    variables.presidentEstAssocie = president.isAssocieUnique
    variables.dureeNominationPresident = 'sans limitation de durée'
    variables.delaiPreavisPresident = president.delaiPreavis || 3
    variables.modeRevocationPresident = president.modeRevocation || 'à tout moment'

    if (president.nom) {
      variables.presidentPrenom = president.prenom || '[Prénom]'
      variables.presidentNom = president.nom
      variables.presidentAdresse = president.adresse || '[Adresse]'
      variables.presidentCivilite = president.civilite || 'M'
      variables.presidentDateNaissance = president.dateNaissance || '[Date]'
      variables.presidentLieuNaissance = president.lieuNaissance || '[Lieu]'
      variables.presidentNationalite = president.nationalite || 'française'
    }
  }

  // Transmission des actions (SASU/SAS - Article 11)
  if (statutsData.transmissionActions) {
    variables.regimeCessionActions = statutsData.transmissionActions.regimeCession
    variables.majoriteAgrement = statutsData.transmissionActions.majoriteAgrement || 'l\'unanimité'
    variables.modalitesPrixRachat = statutsData.transmissionActions.modalitesPrixRachat || '[Modalités à définir]'
  }

  // Décisions collectives (SASU/SAS - Articles 17-18)
  variables.quorumDecisions = statutsData.quorumDecisions || '50%'
  variables.delaiConvocationAssemblee = statutsData.delaiConvocationAssemblee || 15
  variables.delaiConsultationEcrite = statutsData.delaiConsultationEcrite || 15
  variables.signatairePV = statutsData.signatairePV || 'le Président'
  variables.delaiInformationResultat = statutsData.delaiInformationResultat || 15

  // Nantissement
  variables.nantissementAgrement = statutsData.nantissement?.agrementRequis || false

  // Forme actuelle (pour article 19 - quorum et majorité)
  variables.formeActuelle = 'EURL' // TODO: calculer si SARL pluripersonnelle

  // Commissaires aux comptes
  variables.commissaireAuxComptesObligatoire = statutsData.commissairesAuxComptes?.obligatoire || false

  // Clause compromissoire
  variables.clauseCompromissoire = statutsData.clauseCompromissoire?.presente || false
  if (statutsData.clauseCompromissoire?.presente) {
    variables.institutionArbitrage = statutsData.clauseCompromissoire.institutionArbitrage || '[Institution]'
    variables.lieuArbitrage = statutsData.clauseCompromissoire.lieuArbitrage || '[Lieu]'
  }

  // Actes en formation
  variables.actesFormation = statutsData.actesFormation?.presents || false
  if (statutsData.actesFormation?.presents) {
    variables.listeActesFormation = statutsData.actesFormation.liste || '[Liste des actes]'
  } else {
    variables.listeActesFormation = ''
  }

  // Option fiscale (Article 30)
  variables.optionImpotSocietes = statutsData.optionFiscale === 'IMPOT_SOCIETES'
  variables.maintienImpotRevenu = statutsData.optionFiscale === 'IMPOT_REVENU'

  // Clause compromissoire
  variables.clauseCompromissoire = statutsData.clauseCompromissoire?.presente || false

  return variables
}

// Fonction pour générer le document complet
export function generateStatuts(dossier: Dossier, statutsData: Partial<StatutsData>): string {
  const template = getTemplate(dossier.societe.formeJuridique) as any
  const variables = buildVariables(dossier, statutsData)
  
  // Récupérer la civilité pour l'accord de genre
  const civilite = (variables.civiliteAssocie || 'M') as 'M' | 'Mme'

  let document = ''

  // En-tête (nouveau dans v3)
  if (template.enTete) {
    const enTeteVariant = template.enTete.variants[0]
    document += `${replaceVariables(enTeteVariant.texte, variables)}\n\n`
  }

  // Le soussigné / Préambule
  const preambuleText = selectPreambuleVariant(template.preambule, variables)
  document += `${accorderGenre(replaceVariables(preambuleText, variables), civilite)}\n\n`

  // Titre
  document += `${template.titre}\n\n`

  // Articles - avec numérotation dynamique
  let articleCounter = 1
  template.articles.forEach((article: any) => {
    const articleContent = selectArticleVariant(article, variables)

    // Only include if content is not empty or error message
    if (articleContent && !articleContent.includes('[Article non disponible]')) {
      document += `\nARTICLE ${articleCounter} - ${article.titre}\n\n`
      // Appliquer l'accord de genre sur le contenu de l'article
      document += accorderGenre(replaceVariables(articleContent, variables), civilite)
      document += '\n'
      articleCounter++ // Incrémenter le compteur uniquement quand un article est ajouté
    }
  })

  // Conclusion
  document += '\n\n'
  const conclusionText = typeof template.conclusion === 'string'
    ? template.conclusion
    : template.conclusion.texte
  document += accorderGenre(replaceVariables(conclusionText, variables), civilite)

  return document
}

// Fonction pour calculer la progression du formulaire
export function calculateProgression(statutsData: Partial<StatutsData>): number {
  let completedFields = 0
  const totalFields = 15 // Sections pour v3

  // Sections principales
  if (statutsData.associeUnique) completedFields++
  if (statutsData.denomination) completedFields++
  if (statutsData.objetSocial) completedFields++
  if (statutsData.siegeSocial) completedFields++
  if (statutsData.duree) completedFields++
  if (statutsData.capitalSocial && statutsData.apportDetaille) completedFields++
  if (statutsData.partsSociales) completedFields++
  if (statutsData.admissionAssocies) completedFields++
  if (statutsData.nantissement) completedFields++
  if (statutsData.nominationGerant || statutsData.gerant) completedFields++
  if (statutsData.exerciceSocial) completedFields++
  if (statutsData.commissairesAuxComptes) completedFields++
  if (statutsData.compteCourant) completedFields++
  if (statutsData.optionFiscale) completedFields++
  if (statutsData.dateSignature && statutsData.lieuSignature) completedFields++

  return Math.round((completedFields / totalFields) * 100)
}
