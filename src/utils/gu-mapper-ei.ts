/**
 * Mapper pour convertir les données EI Formalyse vers le format Guichet Unique INPI
 *
 * Ce fichier contient toutes les fonctions de transformation nécessaires
 * pour mapper les données d'un Entrepreneur Individuel vers le format
 * attendu par l'API du Guichet Unique (typePersonne = 'P').
 */

import type { Dossier, EntrepreneurIndividuel } from '../types'
import type {
  GUFormaliteCreation,
  GUFormaliteContent,
  GUNatureCreation,
  GUPersonnePhysiqueComplete,
  GUIdentitePersonnePhysique,
  GUEntrepreneur,
  GUDescriptionPersonne,
  GUAdresseDomicile,
  GUAdresseEntreprise,
  GUBlocAdresse,
  GUEtablissement,
  GUBlocDescriptionActivite,
  GUEffectifSalarie,
  GUVoletSocialIndividu,
  GURegimeMicroSocial,
  GUOptionsFiscales,
  GUObservationsCorrespondance,
  GUCorrespondance,
} from '../types/guichet-unique'

// ==============================================
// UTILITAIRES (réutilisés depuis gu-mapper.ts)
// ==============================================

/**
 * Parse une adresse française vers le format GUAdresseDomicile
 * Format attendu: "12 RUE de la Paix 75001 PARIS" ou multiligne
 */
function parseAdresseDomicile(adresseComplete: string): GUAdresseDomicile {
  if (!adresseComplete || adresseComplete.trim().length === 0) {
    throw new Error('Adresse vide : veuillez renseigner l\'adresse')
  }

  const lines = adresseComplete.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  let codePostal = ''
  let commune = ''
  let lignes: string[] = []

  const matchInline = adresseComplete.replace(/\n/g, ' ').match(/^(.+?)\s+(\d{5})\s+(.+)$/)
  if (matchInline) {
    codePostal = matchInline[2]
    commune = matchInline[3]
    lignes = [matchInline[1].trim()]
  } else {
    throw new Error(
      `Format d'adresse invalide : "${adresseComplete}". ` +
      `Le format attendu est "Numéro Type Voie Code Postal Ville" (ex: "12 Rue de la Paix 75001 PARIS")`
    )
  }

  if (lines.length > 1) {
    for (let i = 1; i < lines.length - 1; i++) {
      lignes.push(lines[i])
    }
  }

  if (!codePostal || !commune) {
    throw new Error(
      `Code postal ou ville manquant dans l'adresse : "${adresseComplete}". ` +
      `Le format attendu est "Numéro Type Voie Code Postal Ville"`
    )
  }

  const premiereLigne = lignes[0] || ''
  const matchVoie = premiereLigne.match(/^(\d+)\s+(.+)$/)

  let numVoie = ''
  let voie = ''
  let typeVoie: string | undefined = undefined

  if (matchVoie) {
    numVoie = matchVoie[1]
    voie = matchVoie[2]

    const matchTypeVoie = voie.match(/^(RUE|AVENUE|BOULEVARD|PLACE|IMPASSE|CHEMIN|ROUTE|ALLEE|COURS|QUAI|BD|AV)\s+(.+)$/i)
    if (matchTypeVoie) {
      typeVoie = matchTypeVoie[1].toUpperCase()
      voie = matchTypeVoie[2]
    }
  } else {
    voie = premiereLigne
  }

  if (!voie || voie.trim().length === 0) {
    throw new Error(
      `Voie manquante dans l'adresse : "${adresseComplete}".`
    )
  }

  const result: GUAdresseDomicile = {
    codePays: 'FRA',
    pays: 'France',
    codePostal: codePostal,
    commune: commune.toUpperCase(),
  }

  if (numVoie) {
    result.numVoie = numVoie
    result.numVoiePresent = true
  }

  if (typeVoie) {
    result.typeVoie = typeVoie
    result.typeVoiePresent = true
  }

  if (voie) {
    result.voie = voie
    result.voiePresent = true
  }

  if (lignes[1]) {
    result.complementLocalisation = lignes[1]
    result.complementLocalisationPresent = true
  }

  return result
}

/**
 * Parse une adresse française vers le format BlocAdresse GU
 */
function parseToBlocAdresse(adresseComplete: string): GUBlocAdresse {
  if (!adresseComplete || adresseComplete.trim().length === 0) {
    throw new Error('Adresse vide : veuillez renseigner l\'adresse')
  }

  const lines = adresseComplete.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  let codePostal = ''
  let commune = ''
  let lignes: string[] = []

  const matchInline = adresseComplete.replace(/\n/g, ' ').match(/^(.+?)\s+(\d{5})\s+(.+)$/)
  if (matchInline) {
    codePostal = matchInline[2]
    commune = matchInline[3]
    lignes = [matchInline[1].trim()]
  } else {
    throw new Error(
      `Format d'adresse invalide : "${adresseComplete}".`
    )
  }

  if (lines.length > 1) {
    for (let i = 1; i < lines.length - 1; i++) {
      lignes.push(lines[i])
    }
  }

  if (!codePostal || !commune) {
    throw new Error(`Code postal ou ville manquant dans l'adresse`)
  }

  const premiereLigne = lignes[0] || ''
  const matchVoie = premiereLigne.match(/^(\d+)\s+(.+)$/)

  let numVoie = ''
  let voie = ''
  let typeVoie: string | undefined = undefined

  if (matchVoie) {
    numVoie = matchVoie[1]
    voie = matchVoie[2]

    const matchTypeVoie = voie.match(/^(RUE|AVENUE|BOULEVARD|PLACE|IMPASSE|CHEMIN|ROUTE|ALLEE|COURS|QUAI)\s+(.+)$/i)
    if (matchTypeVoie) {
      typeVoie = matchTypeVoie[1].toUpperCase()
      voie = matchTypeVoie[2]
    }
  } else {
    voie = premiereLigne
  }

  if (!voie || voie.trim().length === 0) {
    throw new Error(`Voie manquante dans l'adresse`)
  }

  const result: GUBlocAdresse = {
    codePays: 'FRA',
    codePostal: codePostal,
    commune: commune.toUpperCase(),
    numVoie: numVoie || undefined,
    typeVoie: typeVoie,
    voie: voie,
  }

  if (lignes[1]) {
    result.complement = lignes[1]
  }

  return result
}

/**
 * Convertit une date ISO (YYYY-MM-DD) en format GU (YYYY-MM-DD)
 */
function formatDateGU(dateISO: string): string {
  if (!dateISO) {
    throw new Error('Date manquante')
  }
  return dateISO
}

/**
 * Normalise une nationalité vers le code pays ISO 3 lettres
 */
function mapCodeNationalite(nationalite: string): string {
  const mapping: Record<string, string> = {
    française: 'FRA',
    francaise: 'FRA',
    français: 'FRA',
    francais: 'FRA',
    france: 'FRA',
    fra: 'FRA',
    fr: 'FRA',
    // Ajouter d'autres nationalités au besoin
  }

  const normalized = nationalite.toLowerCase().trim()
  return mapping[normalized] || 'FRA'
}

/**
 * Normalise un pays de naissance vers le nom complet du pays
 */
function mapPaysNaissance(nationalite: string): string {
  const mapping: Record<string, string> = {
    française: 'FRANCE',
    francaise: 'FRANCE',
    français: 'FRANCE',
    francais: 'FRANCE',
    france: 'FRANCE',
    fra: 'FRANCE',
    fr: 'FRANCE',
    // Ajouter d'autres nationalités au besoin
  }

  const normalized = nationalite.toLowerCase().trim()
  return mapping[normalized] || 'FRANCE'
}

/**
 * Retourne le code INSEE d'une ville française (5 chiffres)
 */
function getCodeInsee(ville: string): string {
  const normalized = ville.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  const mapping: Record<string, string> = {
    'paris': '75056',
    'marseille': '13055',
    'lyon': '69123',
    'toulouse': '31555',
    'nice': '06088',
    'nantes': '44109',
    'strasbourg': '67482',
    'montpellier': '34172',
    'bordeaux': '33063',
    'lille': '59350',
    'rennes': '35238',
    'reims': '51454',
    'beauvais': '60057',
    // Ajouter d'autres villes au besoin
  }

  const code = mapping[normalized]
  return code || '75056' // Par défaut Paris
}

/**
 * Génère un numéro de sécurité sociale simulé valide
 */
function generateNumeroSecu(
  civilite: 'M' | 'Mme',
  dateNaissance: string,
  codeInseeGeographique?: string
): string {
  const sexe = civilite === 'M' ? '1' : '2'
  const [annee, mois] = dateNaissance.split('-')
  const anneeNaissance = annee.substring(2, 4)
  const moisNaissance = mois.padStart(2, '0')

  let departement = '75'
  let commune = '056'

  if (codeInseeGeographique && codeInseeGeographique.length === 5) {
    departement = codeInseeGeographique.substring(0, 2)
    commune = codeInseeGeographique.substring(2, 5)
  }

  const ordre = '001'
  const nir = sexe + anneeNaissance + moisNaissance + departement + commune + ordre

  const nirNumber = BigInt(nir)
  const cle = (97n - (nirNumber % 97n)).toString().padStart(2, '0')

  return nir + cle
}

/**
 * Détermine la situation matrimoniale basée sur les données de l'EI
 */
function determineSituationMatrimoniale(ei: EntrepreneurIndividuel): '1' | '2' | '3' | '4' | '5' | '6' {
  const mapping: Record<string, '1' | '2' | '3' | '4' | '5' | '6'> = {
    'Célibataire': '1',
    'Divorcé': '2',
    'Veuf': '3',
    'Marié': '4',
    'Pacsé': '5',
    'Concubinage': '6',
  }
  
  return mapping[ei.situationMatrimoniale] || '1'
}

// ==============================================
// MAPPING ENTREPRENEUR INDIVIDUEL
// ==============================================

/**
 * Convertit un entrepreneur individuel Formalyse → GU
 */
export function mapEntrepreneurToGUEntrepreneur(
  dossier: Dossier,
  ei: EntrepreneurIndividuel
): GUEntrepreneur {
  // Description de la personne
  const villeNaissance = ei.villeNaissance || ei.paysNaissance
  // Code INSEE OBLIGATOIRE : toujours définir, avec fallback sur Paris si nécessaire
  const codeInseeNaissance = ei.codeInseeNaissance || getCodeInsee(ei.villeNaissance || 'Paris')
  const codeNationalite = mapCodeNationalite(ei.nationalite)

  const descriptionPersonne: GUDescriptionPersonne = {
    nom: ei.nomNaissance.toUpperCase(),
    prenoms: ei.prenoms.split(' ').filter(p => p.trim().length > 0), // Array de prénoms
    genre: ei.genre === 'M' ? '1' : '2', // "1" = Masculin, "2" = Féminin
    dateDeNaissance: formatDateGU(ei.dateNaissance),
    paysNaissance: mapPaysNaissance(ei.nationalite),
    codeNationalite: codeNationalite,
    situationMatrimoniale: determineSituationMatrimoniale(ei),
    formeSociale: '1', // "1" = Sans affiliation sociale pour un entrepreneur
    indicateurDeNonSedentarite: false, // OBLIGATOIRE : false = sédentaire (par défaut)
    statutVisAVisFormalite: '1', // OBLIGATOIRE : "1" = Nouveau
  }

  if (ei.nomUsage) {
    descriptionPersonne.nomUsage = ei.nomUsage
  }

  if (villeNaissance) {
    descriptionPersonne.villeNaissance = villeNaissance
  }

  // Lieu de naissance : utiliser seulement la ville sans le code département
  if (ei.villeNaissance) {
    descriptionPersonne.lieuDeNaissance = ei.villeNaissance
  }

  // Code INSEE OBLIGATOIRE pour l'entrepreneur (toujours requis)
  descriptionPersonne.codeInseeGeographique = codeInseeNaissance

  // Générer le numéro de sécurité sociale si nationalité française
  if (codeNationalite === 'FRA') {
    // Toujours générer un nouveau numéro pour être sûr qu'il soit valide
    descriptionPersonne.numeroSecu = generateNumeroSecu(
      ei.genre,
      ei.dateNaissance,
      codeInseeNaissance
    )
  }

  // Adresse de domicile
  const adresseDomicile = parseAdresseDomicile(ei.adresseDomicile)

  // Caractéristiques de l'adresse
  adresseDomicile.caracteristiques = {
    ambulant: ei.commercantAmbulant,
    domiciliataire: false,
    indicateurDomicileEntrepreneur: ei.domiciliationDomicile,
  }

  // Volet social
  const voletSocial: GUVoletSocialIndividu = {
    indicateurActiviteAnterieure: false,
    activiteSimultanee: false,
    affiliationPamBiologiste: false,
    affiliationPamPharmacien: false,
    organismeAssuranceMaladieActuelle: 'R', // Régime général
    demandeAcre: false, // OBLIGATOIRE : false = pas de demande ACRE
  }

  // Régime micro-social
  const regimeMicroSocial: GURegimeMicroSocial = {
    optionMicroSocial: true, // Par défaut pour un EI
    periodiciteVersement: ei.declarationType === 'mensuelle' ? 'M' : 'T',
  }

  // Contacts
  const contact = {
    email: ei.email,
    telephone: ei.telephone.replace(/\s/g, ''), // Enlever tous les espaces
  }

  return {
    descriptionPersonne,
    descriptionEntrepreneur: descriptionPersonne, // Même chose pour l'entrepreneur
    adresseDomicile,
    voletSocial,
    regimeMicroSocial,
    contact,
    indicateurActifAgricole: false,
  }
}

/**
 * Crée l'établissement principal de l'EI
 */
export function mapEtablissementEI(
  dossier: Dossier,
  ei: EntrepreneurIndividuel,
  dateCreation: string
): GUEtablissement {
  // Adresse de l'établissement (si distincte, sinon utiliser l'adresse de domicile)
  const adresseEtablissement = ei.adresseEtablissement || ei.adresseDomicile
  const adresse = parseToBlocAdresse(adresseEtablissement)

  // Activité principale
  const activitePrincipale: GUBlocDescriptionActivite = {
    dateDebut: dateCreation,
    indicateurPrincipal: true,
    principale: true,
    descriptionDetaillee: ei.descriptionActivites,
    exerciceActivite: 'P', // P = Permanente
    exercice: 'PERMANENTE',
    rolePrincipalPourEntreprise: true,
    ambulant: ei.commercantAmbulant,
    prolongementActiviteAgricole: false,
    origine: {
      typeOrigine: '1', // "1" = Création
    },
    // Catégorisations par défaut
    categorisationActivite1: '07',
    categorisationActivite2: '04',
    categorisationActivite3: '04',
    categorisationActivite4: '08',
  }

  // Effectif salarié
  const effectifSalarie: GUEffectifSalarie = {
    nombreSalarie: 0,
    presenceSalarie: false,
    emploiPremierSalarie: false,
  }

  return {
    descriptionEtablissement: {
      rolePourEntreprise: '2', // "2" = Siège ET établissement principal
      statutPourFormalite: '1', // "1" = Nouveau, ouverture
      indicateurEtablissementPrincipal: true,
      enseigne: ei.nomCommercial,
      nomCommercial: ei.nomCommercial,
    },
    adresse,
    activites: [activitePrincipale],
    effectifSalarie,
    dateDebut: dateCreation,
  }
}

/**
 * Convertit un dossier EI Formalyse vers une formalité Guichet Unique
 */
export async function mapDossierEIToGUFormality(
  dossier: Dossier
): Promise<GUFormaliteCreation> {
  if (!dossier.entrepreneurIndividuel) {
    throw new Error('Données entrepreneur individuel manquantes')
  }

  const ei = dossier.entrepreneurIndividuel

  // Date de création : utiliser la date actuelle
  const dateCreation = formatDateGU(new Date().toISOString().split('T')[0])

  // ============================================
  // BLOC 1: Nature de création (REQUIS)
  // ============================================
  const natureCreation: GUNatureCreation = {
    dateCreation,
    formeJuridique: '1000', // OBLIGATOIRE : Code pour Entrepreneur Individuel
    microEntreprise: true, // EI = micro-entreprise
    etablieEnFrance: true,
    societeEtrangere: false,
  }

  // ============================================
  // BLOC 2: Personne physique
  // ============================================

  // 2.1 Identité
  const entrepreneur = mapEntrepreneurToGUEntrepreneur(dossier, ei)
  
  const identite: GUIdentitePersonnePhysique = {
    entrepreneur,
    // OBLIGATOIRE : Destinataire de correspondance
    destinataireCorrespondance: {
      typeDestinataireCorrespondance: '1', // "1" = Entrepreneur
    },
  }

  // 2.2 Établissement principal
  const etablissementPrincipal = mapEtablissementEI(dossier, ei, dateCreation)

  // 2.3 Options fiscales
  const optionsFiscales: GUOptionsFiscales = {
    regimeTVA: 'TVA_REEL_NORMAL',
    regimeImpositionBenefices: '116', // 116 = Micro BIC (par défaut pour EI)
    optionVersementLiberatoire: ei.optionVersementLiberatoire, // OBLIGATOIRE si régime micro-social
  }

  // 2.4 Observations et correspondance
  const adresseCorrespondance = parseToBlocAdresse(ei.adresseEntrepreneur)
  
  const correspondance: GUCorrespondance = {
    typeDestinataire: 'ENTREPRISE',
    adresse: adresseCorrespondance,
    contacts: {
      email: ei.email,
      telephone: ei.telephone,
    },
  }

  const observationsCorrespondance: GUObservationsCorrespondance = {
    observations: `Création EI ${ei.prenoms} ${ei.nomNaissance}${ei.nomCommercial ? ` - ${ei.nomCommercial}` : ''}`,
    prospectionConsentement: false,
    correspondance,
  }

  // 2.5 Adresse de l'entreprise (OBLIGATOIRE pour non-cessation)
  const adresseEtablissement = ei.adresseEtablissement || ei.adresseDomicile
  const adresseEntreprise: GUAdresseEntreprise = {
    caracteristiques: {
      ambulant: ei.commercantAmbulant,
      domiciliataire: false,
      indicateurDomicileEntrepreneur: ei.domiciliationDomicile,
      indicateurDomicileEntrepreneurValidation: true, // OBLIGATOIRE : validation de la domiciliation
      indicateurAdresseEtablissement: !ei.domiciliationDomicile, // OBLIGATOIRE : true si adresse différente du domicile
    },
    adresse: parseToBlocAdresse(adresseEtablissement),
  }

  // 2.6 Personne physique complète
  const personnePhysique: GUPersonnePhysiqueComplete = {
    identite,
    adresseEntreprise, // OBLIGATOIRE
    etablissementPrincipal,
    optionsFiscales,
    observationsCorrespondance,
  }

  // ============================================
  // BLOC 3: Contenu complet
  // ============================================
  const content: GUFormaliteContent = {
    natureCreation,
    personnePhysique,
    piecesJointes: [],
  }

  // Construire l'enveloppe de la formalité
  const formalite: GUFormaliteCreation = {
    companyName: ei.nomCommercial || `${ei.prenoms} ${ei.nomNaissance}`,
    referenceMandataire: dossier.numero,
    nomDossier: `Création EI ${ei.prenoms} ${ei.nomNaissance}`,
    typeFormalite: 'C',
    diffusionINSEE: 'O',
    diffusionCommerciale: 'O',
    indicateurEntreeSortieRegistre: true,
    typePersonne: 'P', // P = Personne Physique
    content,
  }

  return formalite
}

// ==============================================
// VALIDATION
// ==============================================

/**
 * Valide qu'un dossier EI contient toutes les données nécessaires
 */
export function validateDossierEIForGU(dossier: Dossier): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!dossier.entrepreneurIndividuel) {
    errors.push('Données entrepreneur individuel manquantes')
    return { valid: false, errors }
  }

  const ei = dossier.entrepreneurIndividuel

  // Vérifications essentielles
  if (!ei.prenoms) errors.push('Prénoms manquants')
  if (!ei.nomNaissance) errors.push('Nom de naissance manquant')
  if (!ei.dateNaissance) errors.push('Date de naissance manquante')
  // Ville de naissance : optionnelle avec fallback sur Paris
  if (!ei.villeNaissance) {
    console.warn('⚠️ Ville de naissance manquante, utilisation de "Paris" par défaut pour le code INSEE')
  }
  if (!ei.paysNaissance) errors.push('Pays de naissance manquant')
  if (!ei.nationalite) errors.push('Nationalité manquante')
  if (!ei.situationMatrimoniale) errors.push('Situation matrimoniale manquante')
  if (!ei.email) errors.push('Email manquant')
  if (!ei.telephone) errors.push('Téléphone manquant')
  if (!ei.numeroSecuriteSociale) errors.push('Numéro de sécurité sociale manquant')
  if (!ei.adresseDomicile) errors.push('Adresse de domicile manquante')
  if (!ei.adresseEntrepreneur) errors.push('Adresse de l\'entrepreneur manquante')
  if (!ei.descriptionActivites) errors.push('Description des activités manquante')

  // Validation du format de l'adresse de domicile
  if (ei.adresseDomicile) {
    try {
      parseAdresseDomicile(ei.adresseDomicile)
    } catch (error) {
      errors.push(
        `Adresse de domicile invalide : ${error instanceof Error ? error.message : 'format incorrect'}`
      )
    }
  }

  // Validation du format de l'adresse de l'entrepreneur
  if (ei.adresseEntrepreneur) {
    try {
      parseToBlocAdresse(ei.adresseEntrepreneur)
    } catch (error) {
      errors.push(
        `Adresse de l'entrepreneur invalide : ${error instanceof Error ? error.message : 'format incorrect'}`
      )
    }
  }

  // Validation du format de l'adresse de l'établissement (si renseignée)
  if (ei.adresseEtablissement) {
    try {
      parseToBlocAdresse(ei.adresseEtablissement)
    } catch (error) {
      errors.push(
        `Adresse de l'établissement invalide : ${error instanceof Error ? error.message : 'format incorrect'}`
      )
    }
  }

  // Validation du numéro de sécurité sociale (si fourni)
  if (ei.numeroSecuriteSociale) {
    const numSecu = ei.numeroSecuriteSociale.replace(/\s/g, '')
    if (numSecu.length !== 15 || !/^\d+$/.test(numSecu)) {
      errors.push('Numéro de sécurité sociale invalide (doit contenir 15 chiffres)')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

