/**
 * Mapper pour convertir les données Formalyse vers le format Guichet Unique INPI
 *
 * Ce fichier contient toutes les fonctions de transformation nécessaires
 * pour mapper les données de Formalyse (Dossier + StatutsData) vers le format
 * attendu par l'API du Guichet Unique.
 *
 * ⚠️ IMPORTANT : Les mappings doivent être ajustés en fonction du dictionnaire
 * de données exact du Guichet Unique.
 */

import type { Dossier } from '../types'
import type { StatutsData, AssociePersonnePhysique, AssociePersonneMorale, Gerant, President } from '../types/statuts'
import type {
  GUFormaliteCreation,
  GUFormaliteContent,
  GUNatureCreation,
  GUPersonneMoraleComplete,
  GUIdentitePersonneMorale,
  GUAdresseEntreprise,
  GUBlocAdresse,
  GUAdresse,
  GUAdresseDomicile,
  GUPersonnePhysique,
  GUPersonneMorale,
  GUDirigeant,
  GUCapital,
  GUEtablissement,
  GUBlocDescriptionActivite,
  GUNatureJuridique,
  GUCivilite,
  GURolePourEntreprise,
  GUComposition,
  GUPouvoir,
  GUStructure,
  GUOptionsFiscales,
  GUObservationsCorrespondance,
  GUBeneficiaireEffectif,
  GUBlocVoletSocial,
  GUVoletSocialIndividu,
} from '../types/guichet-unique'
import { FORME_JURIDIQUE_TO_GU } from '../types/guichet-unique'
import { getDefaultCategorizationCodes } from '../services/gu-data-dictionary'

// ==============================================
// UTILITAIRES
// ==============================================

/**
 * Parse une adresse française en ses composants
 *
 * @throws Error si l'adresse est vide
 */
function parseAdresse(adresseComplete: string): GUAdresse {
  // Validation : l'adresse ne doit pas être vide
  if (!adresseComplete || adresseComplete.trim().length === 0) {
    throw new Error('Adresse vide : veuillez renseigner l\'adresse')
  }

  // Extraction simplifiée - à améliorer selon les besoins
  const lines = adresseComplete.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  // Chercher le code postal et la ville dans la dernière ligne
  const derniereLigne = lines[lines.length - 1] || ''
  const matchCPVille = derniereLigne.match(/(\d{5})\s+(.+)/)

  let codePostal = ''
  let ville = ''
  let lignes: string[] = []

  if (matchCPVille) {
    codePostal = matchCPVille[1]
    ville = matchCPVille[2]
    lignes = lines.slice(0, -1)
  } else {
    // Essayer de trouver CP et ville dans une seule ligne
    const matchInline = adresseComplete.match(/^(.+?)\s+(\d{5})\s+(.+)$/)
    if (matchInline) {
      codePostal = matchInline[2]
      ville = matchInline[3]
      lignes = [matchInline[1]]
    } else {
      // Si pas de CP/ville trouvés, utiliser l'adresse telle quelle
      // (pour compatibilité avec les anciennes données)
      lignes = lines
    }
  }

  return {
    ligne1: lignes[0] || adresseComplete,
    ligne2: lignes[1],
    ligne3: lignes[2],
    codePostal: codePostal || '00000',
    ville: ville ? ville.toUpperCase() : 'NON SPECIFIE',
    pays: 'FR',
  }
}

/**
 * Parse une adresse française vers le format GUAdresseDomicile
 * Format attendu: "12 RUE de la Paix 75001 PARIS" ou multiligne
 *
 * @param adresseComplete Adresse complète au format texte
 * @returns Objet GUAdresseDomicile structuré
 * @throws Error si l'adresse est vide ou invalide
 */
function parseAdresseDomicile(adresseComplete: string): GUAdresseDomicile {
  // Validation : l'adresse ne doit pas être vide
  if (!adresseComplete || adresseComplete.trim().length === 0) {
    throw new Error('Adresse vide : veuillez renseigner l\'adresse')
  }

  // Extraction simplifiée
  const lines = adresseComplete.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  let codePostal = ''
  let commune = ''
  let lignes: string[] = []

  // Essayer de trouver CP et ville dans une seule ligne (ex: "12 rue de la Paix 75001 PARIS")
  const matchInline = adresseComplete.replace(/\n/g, ' ').match(/^(.+?)\s+(\d{5})\s+(.+)$/)
  if (matchInline) {
    codePostal = matchInline[2]
    commune = matchInline[3]
    lignes = [matchInline[1].trim()] // La partie avant le code postal
  } else {
    // Si on ne trouve pas de code postal, l'adresse est invalide
    throw new Error(
      `Format d'adresse invalide : "${adresseComplete}". ` +
      `Le format attendu est "Numéro Type Voie Code Postal Ville" (ex: "12 Rue de la Paix 75001 PARIS")`
    )
  }

  // Si multiligne, récupérer les lignes supplémentaires (complément)
  if (lines.length > 1) {
    // Extraire les lignes intermédiaires (entre la première et la dernière qui contient CP/ville)
    for (let i = 1; i < lines.length - 1; i++) {
      lignes.push(lines[i])
    }
  }

  // Validation : le code postal et la commune doivent être présents
  if (!codePostal || !commune) {
    throw new Error(
      `Code postal ou ville manquant dans l'adresse : "${adresseComplete}". ` +
      `Le format attendu est "Numéro Type Voie Code Postal Ville" (ex: "12 Rue de la Paix 75001 PARIS")`
    )
  }

  // Parse la première ligne pour extraire numéro et voie
  const premiereLigne = lignes[0] || ''
  const matchVoie = premiereLigne.match(/^(\d+)\s+(.+)$/)

  let numVoie = ''
  let voie = ''
  let typeVoie: string | undefined = undefined

  if (matchVoie) {
    numVoie = matchVoie[1]
    voie = matchVoie[2]

    // Essayer d'extraire le type de voie (RUE, AVENUE, BOULEVARD, etc.)
    const matchTypeVoie = voie.match(/^(RUE|AVENUE|BOULEVARD|PLACE|IMPASSE|CHEMIN|ROUTE|ALLEE|COURS|QUAI|BD|AV)\s+(.+)$/i)
    if (matchTypeVoie) {
      typeVoie = matchTypeVoie[1].toUpperCase()
      voie = matchTypeVoie[2]
    }
  } else {
    // Si pas de numéro, toute la ligne est la voie
    voie = premiereLigne
  }

  // Validation : la voie ne doit pas être vide
  if (!voie || voie.trim().length === 0) {
    throw new Error(
      `Voie manquante dans l'adresse : "${adresseComplete}". ` +
      `Le format attendu est "Numéro Type Voie Code Postal Ville" (ex: "12 Rue de la Paix 75001 PARIS")`
    )
  }

  const result: GUAdresseDomicile = {
    codePays: 'FRA', // Code ISO 3 lettres
    pays: 'France', // Nom complet du pays
    codePostal: codePostal,
    commune: commune.toUpperCase(), // Normaliser en majuscules
  }

  // Ajouter les champs optionnels s'ils sont renseignés
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

  // Ajouter complément si présent
  if (lignes[1]) {
    result.complementLocalisation = lignes[1]
    result.complementLocalisationPresent = true
  }

  return result
}

/**
 * Parse une adresse française vers le format BlocAdresse GU
 * Format attendu: "1 RUE de la Paix 75001 PARIS" ou multiligne
 *
 * @throws Error si l'adresse est vide ou invalide
 */
function parseToBlocAdresse(adresseComplete: string): GUBlocAdresse {
  // Validation : l'adresse ne doit pas être vide
  if (!adresseComplete || adresseComplete.trim().length === 0) {
    throw new Error('Adresse vide : veuillez renseigner l\'adresse du siège social dans les informations du dossier')
  }

  // Extraction simplifiée
  const lines = adresseComplete.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  let codePostal = ''
  let commune = ''
  let lignes: string[] = []

  // Essayer de trouver CP et ville dans une seule ligne (ex: "1 rue de la Paix 75001 PARIS")
  const matchInline = adresseComplete.replace(/\n/g, ' ').match(/^(.+?)\s+(\d{5})\s+(.+)$/)
  if (matchInline) {
    codePostal = matchInline[2]
    commune = matchInline[3]
    lignes = [matchInline[1].trim()] // La partie avant le code postal
  } else {
    // Si on ne trouve pas de code postal, l'adresse est invalide
    throw new Error(
      `Format d'adresse invalide : "${adresseComplete}". ` +
      `Le format attendu est "Numéro Type Voie Code Postal Ville" (ex: "12 Rue de la Paix 75001 PARIS")`
    )
  }

  // Si multiligne, récupérer les lignes supplémentaires (complément)
  if (lines.length > 1) {
    // Extraire les lignes intermédiaires (entre la première et la dernière qui contient CP/ville)
    for (let i = 1; i < lines.length - 1; i++) {
      lignes.push(lines[i])
    }
  }

  // Validation : le code postal et la commune doivent être présents
  if (!codePostal || !commune) {
    throw new Error(
      `Code postal ou ville manquant dans l'adresse : "${adresseComplete}". ` +
      `Le format attendu est "Numéro Type Voie Code Postal Ville" (ex: "12 Rue de la Paix 75001 PARIS")`
    )
  }

  // Parse la première ligne pour extraire numéro et voie
  const premiereLigne = lignes[0] || ''
  const matchVoie = premiereLigne.match(/^(\d+)\s+(.+)$/)

  let numVoie = ''
  let voie = ''
  let typeVoie: string | undefined = undefined

  if (matchVoie) {
    numVoie = matchVoie[1]
    voie = matchVoie[2]

    // Essayer d'extraire le type de voie (RUE, AVENUE, BOULEVARD, etc.)
    const matchTypeVoie = voie.match(/^(RUE|AVENUE|BOULEVARD|PLACE|IMPASSE|CHEMIN|ROUTE|ALLEE|COURS|QUAI)\s+(.+)$/i)
    if (matchTypeVoie) {
      typeVoie = matchTypeVoie[1].toUpperCase()
      voie = matchTypeVoie[2]
    }
  } else {
    // Si pas de numéro, toute la ligne est la voie
    voie = premiereLigne
  }

  // Validation : la voie ne doit pas être vide
  if (!voie || voie.trim().length === 0) {
    throw new Error(
      `Voie manquante dans l'adresse : "${adresseComplete}". ` +
      `Le format attendu est "Numéro Type Voie Code Postal Ville" (ex: "12 Rue de la Paix 75001 PARIS")`
    )
  }

  const result: GUBlocAdresse = {
    codePays: 'FRA', // Code ISO 3 lettres (pas 'FR')
    codePostal: codePostal,
    commune: commune.toUpperCase(), // Normaliser en majuscules
    numVoie: numVoie || undefined,
    typeVoie: typeVoie,
    voie: voie,
  }

  // Ajouter complément si présent
  if (lignes[1]) {
    result.complement = lignes[1]
  }

  return result
}

/**
 * Parse une adresse française en composants GU (RubriqueAdresseEntreprise)
 */
function parseAdresseEntreprise(adresseComplete: string): GUAdresseEntreprise {
  return {
    caracteristiques: {
      ambulant: false,
      domiciliataire: false,
      indicateurDomicileEntrepreneur: false, // REQUIS
    },
    adresse: parseToBlocAdresse(adresseComplete),
  }
}

/**
 * Convertit une date ISO (YYYY-MM-DD) en format GU (YYYY-MM-DD)
 * Retourne la date ou une date par défaut si non fournie
 */
function formatDateGU(dateISO: string, defaultDate?: string): string {
  if (!dateISO) {
    if (defaultDate) return defaultDate
    // Si pas de date par défaut, lancer une erreur car la date est obligatoire
    throw new Error('Date manquante et aucune date par défaut fournie')
  }
  // Le format ISO YYYY-MM-DD est généralement accepté
  return dateISO
}

/**
 * Convertit une date de clôture d'exercice au format GU (MM-DD)
 * @param dateFin Format: "31/12" ou "31 décembre" → "12-31" (MM-DD)
 */
function formatDateClotureGU(dateFin: string): string {
  if (!dateFin) return '12-31' // Par défaut : 31 décembre

  // Si format DD/MM
  const matchSlash = dateFin.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (matchSlash) {
    const jour = matchSlash[1].padStart(2, '0')
    const mois = matchSlash[2].padStart(2, '0')
    return `${mois}-${jour}`
  }

  // Si format "31 mars" ou "31 décembre"
  const matchMois = dateFin.match(/(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/i)
  if (matchMois) {
    const jour = matchMois[1].padStart(2, '0')
    const moisNom = matchMois[2].toLowerCase()

    const moisMap: Record<string, string> = {
      'janvier': '01',
      'février': '02',
      'fevrier': '02',
      'mars': '03',
      'avril': '04',
      'mai': '05',
      'juin': '06',
      'juillet': '07',
      'août': '08',
      'aout': '08',
      'septembre': '09',
      'octobre': '10',
      'novembre': '11',
      'décembre': '12',
      'decembre': '12',
    }

    const mois = moisMap[moisNom] || '12'
    return `${mois}-${jour}`
  }

  // Fallback
  return '12-31'
}

/**
 * Convertit une civilité Formalyse vers GU
 */
function mapCivilite(civilite: 'M' | 'Mme'): GUCivilite {
  return civilite === 'M' ? 'M' : 'MME'
}

/**
 * Détermine la situation matrimoniale basée sur les données de l'associé
 * Codes :
 * - "1" : Célibataire
 * - "2" : Divorcé
 * - "3" : Veuf
 * - "4" : Marié
 * - "5" : Pacsé
 * - "6" : En concubinage
 */
function determineSituationMatrimoniale(associe: AssociePersonnePhysique): '1' | '2' | '3' | '4' | '5' | '6' {
  // Si PACS
  if (associe.pacs === true || associe.partenaireNom) {
    return '5' // Pacsé
  }

  // Si marié (présence de régime matrimonial ou conjoint)
  if (associe.regimeMatrimonial || associe.conjointNom) {
    return '4' // Marié
  }

  // Par défaut : célibataire
  return '1' // Célibataire
}

/**
 * Génère un numéro de sécurité sociale simulé valide
 * Format : Sexe (1) + Année (2) + Mois (2) + Dépt (2) + Commune (3) + Ordre (3) + Clé (2)
 *
 * @param civilite - Civilité de la personne (M ou Mme)
 * @param dateNaissance - Date de naissance au format YYYY-MM-DD
 * @param codeInseeGeographique - Code INSEE de la commune de naissance (5 chiffres)
 * @returns Numéro de sécurité sociale à 15 chiffres
 */
function generateNumeroSecu(
  civilite: 'M' | 'Mme',
  dateNaissance: string,
  codeInseeGeographique?: string
): string {
  // Sexe : 1 = homme, 2 = femme
  const sexe = civilite === 'M' ? '1' : '2'

  // Parser la date de naissance
  const [annee, mois] = dateNaissance.split('-')
  const anneeNaissance = annee.substring(2, 4) // 2 derniers chiffres (ex: 90 pour 1990)
  const moisNaissance = mois.padStart(2, '0')

  // Département et commune
  let departement = '75' // Paris par défaut
  let commune = '056' // Code commune par défaut (Paris)

  if (codeInseeGeographique && codeInseeGeographique.length === 5) {
    // Extraire le département (2 premiers chiffres)
    departement = codeInseeGeographique.substring(0, 2)
    // Extraire la commune (3 derniers chiffres)
    commune = codeInseeGeographique.substring(2, 5)
  }

  // Ordre de naissance : simulé à 001
  const ordre = '001'

  // Construire le NIR (13 premiers chiffres)
  const nir = sexe + anneeNaissance + moisNaissance + departement + commune + ordre

  // Calculer la clé : 97 - (NIR modulo 97)
  const nirNumber = BigInt(nir)
  const cle = (97n - (nirNumber % 97n)).toString().padStart(2, '0')

  // Retourner le numéro complet (15 chiffres)
  return nir + cle
}

/**
 * Normalise un pays de naissance vers le nom complet du pays (ex: "française" → "FRANCE")
 * Format requis par le Guichet Unique pour le champ paysNaissance
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
    allemande: 'ALLEMAGNE',
    allemand: 'ALLEMAGNE',
    allemagne: 'ALLEMAGNE',
    deu: 'ALLEMAGNE',
    de: 'ALLEMAGNE',
    belge: 'BELGIQUE',
    belgique: 'BELGIQUE',
    bel: 'BELGIQUE',
    be: 'BELGIQUE',
    italienne: 'ITALIE',
    italien: 'ITALIE',
    italie: 'ITALIE',
    ita: 'ITALIE',
    it: 'ITALIE',
    espagnole: 'ESPAGNE',
    espagnol: 'ESPAGNE',
    espagne: 'ESPAGNE',
    esp: 'ESPAGNE',
    es: 'ESPAGNE',
    britannique: 'ROYAUME-UNI',
    anglais: 'ROYAUME-UNI',
    anglaise: 'ROYAUME-UNI',
    'royaume-uni': 'ROYAUME-UNI',
    gbr: 'ROYAUME-UNI',
    gb: 'ROYAUME-UNI',
    américaine: 'ETATS-UNIS',
    américain: 'ETATS-UNIS',
    americaine: 'ETATS-UNIS',
    americain: 'ETATS-UNIS',
    'etats-unis': 'ETATS-UNIS',
    usa: 'ETATS-UNIS',
    us: 'ETATS-UNIS',
    // Ajouter d'autres nationalités au besoin
  }

  const normalized = nationalite.toLowerCase().trim()
  return mapping[normalized] || 'FRANCE' // Par défaut FRANCE
}

/**
 * Normalise une nationalité vers le code pays ISO 3 lettres (ex: "française" → "FRA")
 * Format requis par le Guichet Unique pour le champ codeNationalite
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
    allemande: 'DEU',
    allemand: 'DEU',
    allemagne: 'DEU',
    deu: 'DEU',
    de: 'DEU',
    belge: 'BEL',
    belgique: 'BEL',
    bel: 'BEL',
    be: 'BEL',
    italienne: 'ITA',
    italien: 'ITA',
    italie: 'ITA',
    ita: 'ITA',
    it: 'ITA',
    espagnole: 'ESP',
    espagnol: 'ESP',
    espagne: 'ESP',
    esp: 'ESP',
    es: 'ESP',
    britannique: 'GBR',
    anglais: 'GBR',
    anglaise: 'GBR',
    'royaume-uni': 'GBR',
    gbr: 'GBR',
    gb: 'GBR',
    américaine: 'USA',
    américain: 'USA',
    americaine: 'USA',
    americain: 'USA',
    'etats-unis': 'USA',
    usa: 'USA',
    us: 'USA',
    // Ajouter d'autres nationalités au besoin
  }

  const normalized = nationalite.toLowerCase().trim()
  return mapping[normalized] || 'FRA' // Par défaut FRA
}

/**
 * Retourne le code INSEE d'une ville française (5 chiffres)
 * Mapping partiel des villes principales
 * TODO: Compléter avec toutes les villes ou utiliser une API INSEE
 */
function getCodeInsee(ville: string): string {
  const normalized = ville.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retirer les accents
  
  // Mapping des codes INSEE des villes principales (format: code département + code commune)
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
    'le havre': '76351',
    'saint-etienne': '42218',
    'toulon': '83137',
    'grenoble': '38185',
    'dijon': '21231',
    'angers': '49007',
    'nimes': '30189',
    'villeurbanne': '69266',
    'clermont-ferrand': '63113',
    'le mans': '72181',
    'aix-en-provence': '13001',
    'brest': '29019',
    'tours': '37261',
    'amiens': '80021',
    'limoges': '87085',
    'annecy': '74010',
    'perpignan': '66136',
    'besancon': '25056',
    'metz': '57463',
    'orleans': '45234',
    'mulhouse': '68224',
    'rouen': '76540',
    'caen': '14118',
    'nancy': '54395',
    'argenteuil': '95018',
    'montreuil': '93048',
    'saint-denis': '93066',
  }

  // Ajouter "beauvais" au mapping
  if (normalized === 'beauvais') return '60057'
  
  const code = mapping[normalized]
  
  // Si le code n'est pas trouvé, retourner Paris par défaut
  // ATTENTION: Ce fallback sera vérifié dans le code appelant
  return code || '75056'
}

// ==============================================
// MAPPING PERSONNE PHYSIQUE
// ==============================================

/**
 * Convertit un associé personne physique Formalyse → GU
 * NOTE: Cette fonction utilise l'ancienne interface GUPersonnePhysique qui n'est plus utilisée
 * dans le flux principal de création de formalités (qui utilise GUDescriptionPersonne).
 * Conservée pour compatibilité.
 */
export function mapPersonnePhysique(
  personne: AssociePersonnePhysique
): GUPersonnePhysique {
  return {
    civilite: mapCivilite(personne.civilite),
    nom: personne.nom,
    prenom: personne.prenom,
    dateNaissance: formatDateGU(personne.dateNaissance),
    lieuNaissance: personne.lieuNaissance,
    paysNaissance: mapPaysNaissance(personne.nationalite || 'française'), // Nom complet du pays
    nationalite: mapCodeNationalite(personne.nationalite || 'française'), // Code ISO 3 lettres (temporaire, devrait être codeNationalite)
    adresse: parseAdresse(personne.adresse),
  }
}

// ==============================================
// MAPPING PERSONNE MORALE
// ==============================================

/**
 * Convertit un associé personne morale Formalyse → GU
 */
export function mapPersonneMorale(
  personne: AssociePersonneMorale
): GUPersonneMorale {
  // TODO: Mapper la forme juridique de la personne morale vers les codes GU
  const formeJuridique: GUNatureJuridique = 'string' // Placeholder

  return {
    denomination: personne.societeNom,
    formeJuridique,
    siren: personne.societeNumeroRCS,
    adresse: parseAdresse(personne.societeSiege),
    representantLegal: personne.representantNom && personne.representantPrenom ? {
      civilite: 'M', // TODO: Récupérer la civilité du représentant
      nom: personne.representantNom,
      prenom: personne.representantPrenom,
      dateNaissance: '', // Non disponible dans Formalyse
      lieuNaissance: '',
      paysNaissance: 'FRA', // Code ISO 3 lettres
      nationalite: 'FRA', // Code ISO 3 lettres
      adresse: parseAdresse(personne.societeSiege), // Utiliser l'adresse de la société par défaut
    } : undefined,
  }
}

// ==============================================
// MAPPING DIRIGEANT
// ==============================================

/**
 * Crée un dirigeant GU à partir des données de gérant/président
 */
export function mapDirigeant(statutsData: Partial<StatutsData>): GUDirigeant | null {
  const formeJuridique = statutsData.formeJuridique

  // Pour EURL/SARL : Gérant
  if (formeJuridique === 'EURL' || formeJuridique === 'SARL') {
    const gerant = statutsData.gerant
    const associeUnique = statutsData.associeUnique

    if (!gerant) return null

    // Si le gérant est l'associé unique
    if (gerant.isAssocieUnique && associeUnique && associeUnique.type === 'PERSONNE_PHYSIQUE') {
      return {
        qualite: 'GERANT',
        personnePhysique: mapPersonnePhysique(associeUnique),
        pourcentageDetention: 100,
      }
    }

    // Si le gérant est une personne différente
    if (gerant.nom && gerant.prenom) {
      return {
        qualite: 'GERANT',
        personnePhysique: {
          civilite: mapCivilite(gerant.civilite!),
          nom: gerant.nom,
          prenom: gerant.prenom,
          dateNaissance: formatDateGU(gerant.dateNaissance || ''),
          lieuNaissance: gerant.lieuNaissance || '',
          paysNaissance: mapPaysNaissance(gerant.nationalite || 'française'), // Nom complet du pays
          nationalite: mapCodeNationalite(gerant.nationalite || 'française'), // Code ISO 3 lettres
          adresse: parseAdresse(gerant.adresse || ''),
        },
      }
    }
  }

  // Pour SASU/SAS : Président
  if (formeJuridique === 'SASU' || formeJuridique === 'SAS') {
    const president = statutsData.president
    const associeUnique = statutsData.associeUnique

    if (!president) return null

    // Si le président est l'associé unique
    if (president.isAssocieUnique && associeUnique && associeUnique.type === 'PERSONNE_PHYSIQUE') {
      return {
        qualite: 'PRESIDENT',
        personnePhysique: mapPersonnePhysique(associeUnique),
        pourcentageDetention: 100,
      }
    }

    // Si le président est une personne différente
    if (president.nom && president.prenom) {
      return {
        qualite: 'PRESIDENT',
        personnePhysique: {
          civilite: mapCivilite(president.civilite!),
          nom: president.nom,
          prenom: president.prenom,
          dateNaissance: formatDateGU(president.dateNaissance || ''),
          lieuNaissance: president.lieuNaissance || '',
          paysNaissance: mapPaysNaissance(president.nationalite || 'française'), // Nom complet du pays
          nationalite: mapCodeNationalite(president.nationalite || 'française'), // Code ISO 3 lettres
          adresse: parseAdresse(president.adresse || ''),
        },
      }
    }
  }

  return null
}

/**
 * Crée un associé unique GU (bénéficiaire effectif)
 */
export function mapAssocieUnique(
  associeUnique: Exclude<StatutsData['associeUnique'], undefined>
): GUDirigeant {
  if (associeUnique.type === 'PERSONNE_PHYSIQUE') {
    return {
      qualite: 'ASSOCIE_UNIQUE',
      personnePhysique: mapPersonnePhysique(associeUnique),
      pourcentageDetention: 100,
    }
  } else {
    return {
      qualite: 'ASSOCIE_UNIQUE',
      personneMorale: mapPersonneMorale(associeUnique),
      pourcentageDetention: 100,
    }
  }
}

// ==============================================
// MAPPING CAPITAL
// ==============================================

/**
 * Convertit les informations de capital Formalyse → GU
 */
export function mapCapital(statutsData: Partial<StatutsData>): GUCapital {
  const capital = statutsData.capitalSocial || 0
  const apport = statutsData.apportDetaille

  let montantLibere = capital

  // Calculer le montant libéré selon le type d'apport
  if (apport) {
    if (apport.type === 'NUMERAIRE_PARTIEL') {
      montantLibere = apport.montantLibere
    } else if (apport.type === 'MIXTE_NUMERAIRE_NATURE') {
      montantLibere = apport.numeraire.montantLibere + apport.nature.valeur
    }
  }

  return {
    montant: Math.round(capital * 100), // Convertir en centimes
    devise: 'EUR',
    montantLibere: Math.round(montantLibere * 100),
    nombreParts: statutsData.nombreParts,
    nombreActions: statutsData.nombreActions,
    valeurNominale: Math.round((statutsData.valeurNominale || 0) * 100),
  }
}

// ==============================================
// MAPPING ÉTABLISSEMENT (SIÈGE SOCIAL)
// ==============================================

/**
 * Convertit l'adresse du siège social Formalyse → GU
 *
 * Pour une création avec siège = établissement principal:
 * rolePourEntreprise = "2" (Siège et établissement principal)
 */
export async function mapEtablissement(
  dossier: Dossier,
  statutsData: Partial<StatutsData>,
  dateCreation: string,
  rolePourEntreprise: GURolePourEntreprise = '2'
): Promise<GUEtablissement> {
  // Parser l'adresse au format BlocAdresse
  const adresse = parseToBlocAdresse(dossier.societe.siege)

  // Récupérer les codes de catégorisation depuis l'API GU
  const { categorisationActivite1, categorisationActivite2 } = await getDefaultCategorizationCodes()

  // Créer l'activité principale
  const activitePrincipale: GUBlocDescriptionActivite = {
    indicateurPrincipal: true,
    // TODO: Ajouter le code APE si disponible dans le dossier
    // codeApe: "62.02A",
    descriptionDetaillee: dossier.societe.objetSocial || statutsData.objetSocial || 'Activité non spécifiée',
    // Catégorisations récupérées depuis l'API GU (optionnelles)
    // Ne seront ajoutées que si disponibles (cleanObject() supprimera les undefined)
    ...(categorisationActivite1 && { categorisationActivite1 }),
    ...(categorisationActivite2 && { categorisationActivite2 }),
    // Champs obligatoires pour création
    exerciceActivite: 'P', // P = Permanente
    rolePrincipalPourEntreprise: true, // Activité principale
    origine: {
      typeOrigine: 'C', // C = Création
    },
  }

  return {
    descriptionEtablissement: {
      rolePourEntreprise,
      enseigne: dossier.societe.denomination,
      statutPourFormalite: '1', // "1" = Nouveau, ouverture (obligatoire pour création)
      // codeApe sera ajouté ici si disponible
    },
    adresse,
    activites: [activitePrincipale],
    effectifSalarie: {
      nombreSalarie: 0,
      presenceSalarie: false, // Pas de salarié au démarrage
      emploiPremierSalarie: false, // Pas d'emploi de salarié prévu immédiatement
    },
  }
}

// ==============================================
// MAPPING COMPLET DOSSIER → FORMALITÉ GU
// ==============================================

/**
 * Convertit un dossier Formalyse complet vers une formalité Guichet Unique
 * Documentation : Section 3.3 - Envoi d'une nouvelle formalité
 *
 * @param dossier - Le dossier Formalyse
 * @param statutsData - Les données des statuts (depuis dossier.statutsDraft?.data)
 * @returns La formalité au format GU (structure complète avec enveloppe + content)
 */
export async function mapDossierToGUFormality(
  dossier: Dossier,
  statutsData: Partial<StatutsData>
): Promise<GUFormaliteCreation> {
  // Vérifications de base
  if (!dossier.societe.formeJuridique) {
    throw new Error('Forme juridique manquante')
  }

  if (!statutsData.associeUnique) {
    throw new Error('Associé unique manquant')
  }

  // Mapper la forme juridique
  const formeJuridique = FORME_JURIDIQUE_TO_GU[dossier.societe.formeJuridique]

  // Construire la liste des dirigeants
  const dirigeants: GUDirigeant[] = []

  // Ajouter l'associé unique
  dirigeants.push(mapAssocieUnique(statutsData.associeUnique))

  // Ajouter le gérant/président s'il est différent de l'associé unique
  const dirigeant = mapDirigeant(statutsData)
  if (dirigeant) {
    // Vérifier qu'on n'ajoute pas le même dirigeant deux fois
    const estMemePersonne =
      statutsData.gerant?.isAssocieUnique || statutsData.president?.isAssocieUnique
    if (!estMemePersonne) {
      dirigeants.push(dirigeant)
    }
  }

  // Date de clôture de l'exercice (format MM-DD)
  const dateClotureExercice = formatDateClotureGU(statutsData.exerciceSocial?.dateFin || '12-31')

  // Convertir en format JJMM pour les options fiscales
  const [mois, jour] = dateClotureExercice.split('-')
  const dateClotureExerciceComptable = `${jour}${mois}` // JJMM (ex: "3112" pour 31 décembre)

  // Date de création : TOUJOURS utiliser la date actuelle
  // (car la date de signature peut être dans le futur pour les tests,
  //  mais l'API rejette les dates futures)
  const dateCreation = formatDateGU(new Date().toISOString().split('T')[0])

  // Date de première clôture : même jour/mois que dateClotureExerciceSocial, année suivante
  const datePremiereCloture = (() => {
    const year = new Date().getFullYear() + 1
    return `${year}-${mois}-${jour}` // Format: YYYY-MM-DD
  })()

  // ============================================
  // BLOC 1: Nature de création (REQUIS)
  // ============================================
  const natureCreation: GUNatureCreation = {
    dateCreation,
    formeJuridique,
    societeEtrangere: false,
    etablieEnFrance: true,
  }

  // ============================================
  // BLOC 2: Personne morale
  // ============================================

  // 2.1 Identité (structure imbriquée selon le schéma officiel)
  const identite: GUIdentitePersonneMorale = {
    // Bloc entreprise (REQUIS)
    entreprise: {
      denomination: dossier.societe.denomination,
      formeJuridique,
      pays: 'FRA', // Code ISO 3 lettres
      // siren: Non applicable pour une création (attribué par l'INSEE après)
    },
    // Bloc description (REQUIS pour création)
    description: {
      ...(statutsData.sigle ? { sigle: statutsData.sigle } : {}),
      objet: dossier.societe.objetSocial || statutsData.objetSocial || '', // L'objet va ici, pas dans entreprise
      duree: statutsData.duree || 99,
      dateClotureExerciceSocial: dateClotureExerciceComptable, // Format JJMM
      datePremiereCloture, // Même jour/mois que dateClotureExerciceSocial, année suivante
      montantCapital: statutsData.capitalSocial || 0, // Montant en euros (nombre)
      deviseCapital: 'EUR',
      capitalVariable: false, // REQUIS
      depotDemandeAcre: false, // REQUIS - Demande d'ACRE (aide à la création)
      ess: false, // Entreprise de l'Économie Sociale et Solidaire
      societeMission: false, // Société à mission
      indicateurOrigineFusionScission: false, // Indicateur fusion/scission (d'après le nom du champ HTML)
      // Nature de gérance : pour EURL/SARL (codes valides : 1=Majoritaire, 3=Minoritaire/égalitaire société associée, etc.)
      ...(dossier.societe.formeJuridique === 'EURL' || dossier.societe.formeJuridique === 'SARL'
        ? { natureGerance: '1' } // 1 = Majoritaire (cas EURL par défaut)
        : {}
      ),
    },
    // Publication légale (REQUIS pour création)
    publicationLegale: {
      indicateurNonPublicite: false, // Doit être publié
      // La date de publication doit être antérieure au mois prochain (donc passée ou dans le mois en cours)
      datePublication: formatDateGU(new Date().toISOString().split('T')[0]), // Date actuelle
      // support: Code support à récupérer depuis les données si disponible
      // url: URL de la publication si disponible
    },
    // Destinataire de correspondance (REQUIS)
    destinataireCorrespondance: {
      typeDestinataireCorrespondance: '1', // 1 = Représentant légal (code numérique)
    },
  }

  // 2.2 Adresse de l'entreprise
  const adresseEntreprise = parseAdresseEntreprise(dossier.societe.siege)

  // 2.2.5 Structure (nouvelles informations)
  const structure: GUStructure = {
    domiciliationProvisoireDomicileRepresentantLegal: false,
    recoursSocieteDomiciliation: false,
    entrepriseCreeeSansActivite: false,
    nomsDomaineInternet: [], // À récupérer depuis les données si disponible
  }

  // 2.3 Composition (dirigeants)
  // Créer un pouvoir pour le gérant/président (obligatoire pour création)
  const pouvoirs: GUPouvoir[] = []
  
  // Récupérer les données du dirigeant selon la forme juridique
  let dirigeantData: (Gerant | President) | undefined
  let roleEntreprise: string
  
  if (dossier.societe.formeJuridique === 'EURL' || dossier.societe.formeJuridique === 'SARL') {
    dirigeantData = statutsData.gerant
    // Codes pour EURL/SARL: 30 = Gérant unique, 41 = Gérant non associé
    roleEntreprise = '30' // Gérant unique (cas EURL)
  } else {
    dirigeantData = statutsData.president
    // Codes pour SASU/SAS: 71 = Président
    roleEntreprise = '71'
  }
  
  if (!dirigeantData) {
    throw new Error(`Données du ${dossier.societe.formeJuridique === 'EURL' || dossier.societe.formeJuridique === 'SARL' ? 'gérant' : 'président'} manquantes`)
  }
  
  // Valider les données obligatoires
  if (!dirigeantData.nom && !dirigeantData.isAssocieUnique) {
    throw new Error('Le nom du dirigeant est obligatoire')
  }
  if (!dirigeantData.prenom && !dirigeantData.isAssocieUnique) {
    throw new Error('Le prénom du dirigeant est obligatoire')
  }
  if (!dirigeantData.dateNaissance && !dirigeantData.isAssocieUnique) {
    throw new Error('La date de naissance du dirigeant est obligatoire')
  }
  if (!dirigeantData.lieuNaissance && !dirigeantData.isAssocieUnique) {
    throw new Error('Le lieu de naissance du dirigeant est obligatoire')
  }
  
  // Si le dirigeant est l'associé unique, utiliser les données de l'associé unique
  let personneData = dirigeantData
  if (dirigeantData.isAssocieUnique && statutsData.associeUnique?.type === 'PERSONNE_PHYSIQUE') {
    const associe = statutsData.associeUnique
    
    // Valider les données obligatoires de l'associé unique
    if (!associe.nom) throw new Error('Le nom de l\'associé unique est obligatoire')
    if (!associe.prenom) throw new Error('Le prénom de l\'associé unique est obligatoire')
    if (!associe.dateNaissance) throw new Error('La date de naissance de l\'associé unique est obligatoire')
    if (!associe.lieuNaissance) throw new Error('Le lieu de naissance de l\'associé unique est obligatoire')
    if (!associe.civilite) throw new Error('La civilité de l\'associé unique est obligatoire')
    if (!associe.nationalite) throw new Error('La nationalité de l\'associé unique est obligatoire')
    
    personneData = {
      ...dirigeantData,
      nom: associe.nom,
      prenom: associe.prenom,
      civilite: associe.civilite,
      dateNaissance: associe.dateNaissance,
      lieuNaissance: associe.lieuNaissance,
      adresse: associe.adresse,
      nationalite: associe.nationalite,
    }
  }
  
  // Parser le lieu de naissance pour extraire la ville
  const lieuNaissance = personneData.lieuNaissance || ''
  const villeNaissance = lieuNaissance.split('(')[0].trim() || lieuNaissance
  
  // Valider que les champs obligatoires sont présents
  if (!personneData.nom) throw new Error('Le nom est obligatoire')
  if (!personneData.prenom) throw new Error('Le prénom est obligatoire')
  if (!personneData.dateNaissance) throw new Error('La date de naissance est obligatoire')
  if (!personneData.civilite) throw new Error('La civilité est obligatoire')
  if (!personneData.nationalite) throw new Error('La nationalité est obligatoire')
  
  // Créer UNIQUEMENT les champs nécessaires pour un individu (PAS de formeSociale)
  // IMPORTANT: Utiliser les noms de champs exacts de l'API GU (ex: dateDeNaissance, pas dateNaissance)
  // Déterminer la situation matrimoniale
  let situationMatrimoniale: '1' | '2' | '3' | '4' | '5' | '6' = '1' // Célibataire par défaut
  if (statutsData.associeUnique?.type === 'PERSONNE_PHYSIQUE') {
    situationMatrimoniale = determineSituationMatrimoniale(statutsData.associeUnique)
  }

  // Type strict pour éviter l'ajout accidentel de champs pour personne morale
  interface DescriptionPersonneIndividu {
    nom: string
    prenoms: string[]
    genre: string
    dateDeNaissance: string
    paysNaissance: string // Nom complet du pays (ex: FRANCE)
    codeNationalite: string // Code ISO 3 lettres (ex: FRA)
    numeroSecu?: string // Numéro de sécurité sociale (OBLIGATOIRE pour nationalité française)
    formeSociale: string // REQUIS même pour individu : affiliation sociale
    situationMatrimoniale: '1' | '2' | '3' | '4' | '5' | '6' // REQUIS pour entrepreneur
    villeNaissance?: string
    codeInseeGeographique?: string
    lieuDeNaissance?: string
  }

  const descriptionPersonne: DescriptionPersonneIndividu = {
    nom: personneData.nom.toUpperCase(),
    prenoms: [personneData.prenom], // Array de prénoms
    genre: personneData.civilite === 'M' ? '1' : '2', // "1" = Masculin, "2" = Féminin (codes GU)
    dateDeNaissance: formatDateGU(personneData.dateNaissance), // ATTENTION: "dateDeNaissance" avec "De"
    paysNaissance: mapPaysNaissance(personneData.nationalite), // Nom complet du pays (ex: FRANCE)
    codeNationalite: mapCodeNationalite(personneData.nationalite), // Code ISO 3 lettres (ex: FRA)
    formeSociale: '3', // "3" = Avec affiliation sociale de l'un des dirigeants (pour gérant/président)
    situationMatrimoniale, // Situation matrimoniale obligatoire
  }

  // Ajouter les champs optionnels s'ils sont renseignés
  if (villeNaissance) {
    descriptionPersonne.villeNaissance = villeNaissance
    // Ajouter le code INSEE SEULEMENT si on le trouve (pas de fallback Paris)
    const codeInsee = getCodeInsee(villeNaissance)
    // Ne pas utiliser le code par défaut (75056 Paris) si la ville est différente
    if (codeInsee !== '75056' || villeNaissance.toLowerCase().includes('paris')) {
      descriptionPersonne.codeInseeGeographique = codeInsee
    }
  }

  if (lieuNaissance) {
    descriptionPersonne.lieuDeNaissance = lieuNaissance
  }

  // Générer le numéro de sécurité sociale UNIQUEMENT pour les Français
  if (descriptionPersonne.codeNationalite === 'FRA') {
    descriptionPersonne.numeroSecu = generateNumeroSecu(
      personneData.civilite,
      personneData.dateNaissance,
      descriptionPersonne.codeInseeGeographique
    )
  }
  
  // Parser l'adresse du dirigeant au format GUAdresseDomicile
  const adresseDomicile = personneData.adresse ? parseAdresseDomicile(personneData.adresse) : undefined

  // Créer le volet social pour l'individu (composition-volet-social-individu)
  const voletSocialIndividu: GUVoletSocialIndividu = {
    indicateurActiviteAnterieure: false, // Pas d'activité non salariée antérieure
    activiteSimultanee: false, // Pas d'activité simultanée
    affiliationPamBiologiste: false, // Pas d'affiliation biologiste
    affiliationPamPharmacien: false, // Pas d'affiliation pharmacien
    organismeAssuranceMaladieActuelle: 'R', // Régime général
  }

  // Créer le pouvoir avec les vraies données
  const pouvoir: GUPouvoir = {
    individu: {
      descriptionPersonne,
      // Ajouter l'adresse de domicile si disponible (composition-adresse-individu.address-fetcher)
      ...(adresseDomicile ? { adresseDomicile } : {}),
      // Ajouter les contacts si disponibles (récupérer depuis le client)
      contacts: {
        email: dossier.client.email,
        telephone: dossier.client.telephone,
      },
      // Ajouter le volet social (composition-volet-social-individu.indicateurActiviteAnterieure)
      voletSocial: voletSocialIndividu,
    },
    roleEntreprise,
    statutPourLaFormalite: 'N', // N = Nouveau
    dateEffet: dateCreation,
    typeDePersonne: 'INDIVIDU', // "INDIVIDU" = Personne physique (pas "P")
    // Indiquer que cette personne est bénéficiaire effectif (associé unique détenant 100%)
    beneficiaireEffectif: true,
    indicateurSecondRoleEntreprise: false, // Par défaut : pas de seconde fonction
    nouveauBeneficiaireEffectif: true, // Nouveau bénéficiaire effectif pour une création
  }

  pouvoirs.push(pouvoir)

  const composition: GUComposition = {
    pouvoirs,
  }

  // 2.3.5 Bénéficiaires effectifs
  // Pour une création avec associé unique détenant 100%, il est automatiquement bénéficiaire effectif
  const beneficiairesEffectifs: any[] = []

  if (statutsData.associeUnique?.type === 'PERSONNE_PHYSIQUE') {
    const associe = statutsData.associeUnique

    // Parser le lieu de naissance pour extraire la ville
    const lieuNaissance = associe.lieuNaissance || ''
    const villeNaissance = lieuNaissance.split('(')[0].trim() || lieuNaissance

    // Déterminer la situation matrimoniale pour le bénéficiaire effectif
    const situationMatrimonialeBE = determineSituationMatrimoniale(associe)

    // Récupérer le code INSEE de la ville de naissance (pour le numéro de sécu)
    const codeInseeNaissance = villeNaissance ? getCodeInsee(villeNaissance) : undefined
    // Ne pas utiliser le code par défaut (75056 Paris) si la ville est différente
    const codeInseeValide = codeInseeNaissance !== '75056' || villeNaissance.toLowerCase().includes('paris')
      ? codeInseeNaissance
      : undefined

    // Mapper la nationalité
    const codeNationaliteBE = mapCodeNationalite(associe.nationalite || 'française')

    // Construire l'objet beneficiaire (sans les champs d'assurance maladie qui sont dans voletSocial)
    const beneficiaire: any = {
      nom: associe.nom.toUpperCase(),
      prenoms: [associe.prenom],
      genre: associe.civilite === 'M' ? '1' : '2', // "1" = Masculin, "2" = Féminin
      dateDeNaissance: formatDateGU(associe.dateNaissance),
      villeNaissance: villeNaissance || undefined,
      paysNaissance: mapPaysNaissance(associe.nationalite || 'française'), // Nom complet du pays (ex: FRANCE)
      codeNationalite: codeNationaliteBE, // Code ISO 3 lettres (ex: FRA)
      lieuDeNaissance: lieuNaissance || undefined,
      situationMatrimoniale: situationMatrimonialeBE, // Situation matrimoniale obligatoire
    }

    // Générer le numéro de sécurité sociale UNIQUEMENT pour les Français
    if (codeNationaliteBE === 'FRA') {
      beneficiaire.numeroSecu = generateNumeroSecu(
        associe.civilite,
        associe.dateNaissance,
        codeInseeValide
      )
    }

    beneficiairesEffectifs.push({
      // Le bénéficiaire est la personne elle-même (structure identique à descriptionPersonne dans pouvoir)
      beneficiaire,
      // Statut pour la formalité : "1" = Ajout (nouveau bénéficiaire effectif)
      statutPourLaFormalite: '1',
      // Modalités de contrôle : détention de 100% du capital
      modalitesControle: ['DETENTION_CAPITAL'],
    })
  }

  // 2.4 Options fiscales (OBLIGATOIRE pour création selon doc)
  // Structure BlocOptionFiscale-1 avec valeurs minimales

  const optionsFiscales: GUOptionsFiscales = {
    dateClotureExerciceComptable,
    // Régime de TVA par défaut : TVA réel normal
    regimeTVA: 'TVA_REEL_NORMAL',
  }

  // Ajouter regimeImpositionBenefices seulement si EURL avec option IS
  // Codes valides : 115 = Réel normal IS
  if (dossier.societe.formeJuridique === 'EURL' && statutsData.optionFiscale === 'IMPOT_SOCIETES') {
    optionsFiscales.regimeImpositionBenefices = '115' // 115 = Réel normal IS
  }

  // 2.5 Établissements
  // Pour une création standard : établissement principal = siège ET établissement principal (role "2")
  // Note: Les codes de catégorisation sont maintenant en dur (07040408) dans la définition de l'activité
  // car les codes de l'API ne correspondent pas au format attendu par la création de formalité
  
  // Établissement principal (siège de la société)
  // D'après SHEMA.txt et les erreurs API, il faut:
  // - indicateurEtablissementPrincipal: true
  // - rolePourEntreprise dépend du contexte (essayons "2" pour siège ET principal)
  const etablissementPrincipal: GUEtablissement = {
    descriptionEtablissement: {
      rolePourEntreprise: '2', // "2" = Siège ET établissement principal
      statutPourFormalite: '1', // "1" = Nouveau, ouverture
      indicateurEtablissementPrincipal: true, // REQUIS d'après SHEMA.txt
    },
    adresse: parseToBlocAdresse(dossier.societe.siege),
    // Effectif salarié (OBLIGATOIRE pour création)
    effectifSalarie: {
      nombreSalarie: 0, // 0 salarié au démarrage
      presenceSalarie: false, // REQUIS : Pas de salarié pour le moment
      emploiPremierSalarie: false, // REQUIS : Pas d'emploi de premier salarié prévu immédiatement
    },
    // Activités de l'établissement
    activites: [
      {
        dateDebut: dateCreation,
        indicateurPrincipal: true,
        principale: true,
        libelle: 'Conseil aux entreprises', // Libellé court de l'activité
        categorie: 'Autres activités juridiques', // Catégorie d'activité
        descriptionDetaillee: dossier.societe.objetSocial || statutsData.objetSocial || 'Activité de conseil et services',
        exerciceActivite: 'P',
        exercice: 'PERMANENTE',
        rolePrincipalPourEntreprise: true,
        ambulant: false,
        prolongementActiviteAgricole: false,
        origine: {
          typeOrigine: '1', // "1" = Création
        },
        // Catégorisations : codes valides issus du dictionnaire GU (4 champs séparés)
        // Code complet: 07-04-04-08 = Conseil aux entreprises
        categorisationActivite1: '07', // Activités de services
        categorisationActivite2: '04', // Catégorie principale
        categorisationActivite3: '04', // Sous-catégorie
        categorisationActivite4: '08', // Détail activité
      },
    ],
  }
  
  // 2.6 Observations et correspondance
  const observationsCorrespondance: GUObservationsCorrespondance = {
    observations: `Création ${dossier.societe.denomination}`,
    prospectionConsentement: false, // Pas de consentement pour la prospection par défaut
    correspondance: {
      typeDestinataire: 'ENTREPRISE',
      adresse: parseToBlocAdresse(dossier.societe.siege),
      contacts: {
        email: dossier.client.email,
        telephone: dossier.client.telephone,
      },
    },
  }

  // 2.6.5 Volet social (OBLIGATOIRE pour création)
  const voletSocial: GUBlocVoletSocial = {
    indicateurActiviteAnterieure: false, // Pas d'activité non salariée antérieure
    activiteSimultanee: false, // Pas d'activité simultanée
    affiliationPamBiologiste: false, // Pas d'affiliation biologiste
    affiliationPamPharmacien: false, // Pas d'affiliation pharmacien
    organismeAssuranceMaladieActuelle: 'R', // Régime général
  }

  // 2.7 Personne morale complète
  const personneMorale: GUPersonneMoraleComplete = {
    identite,
    adresseEntreprise,
    structure,
    composition, // REQUIS - Contient au moins le gérant/président
    // Pour CRÉATION : l'établissement doit être dans etablissementPrincipal
    // L'erreur indique: "Veuillez fournir au moins un établissement siège ou un établissement 'siège et principal'"
    etablissementPrincipal,
    // NE PAS utiliser autresEtablissements pour une création simple
    optionsFiscales, // REQUIS pour création
    beneficiairesEffectifs, // Liste des bénéficiaires effectifs
    observationsCorrespondance,
    voletSocial, // OBLIGATOIRE pour création
    // NOTE: Ne JAMAIS envoyer isEnableBypassModificationRepresentant et isEnableBypassModificationBE
    // Ce sont des indicateurs de variables d'environnement côté serveur (lecture seule)
  }

  // ============================================
  // BLOC 3: Contenu complet
  // ============================================
  const content: GUFormaliteContent = {
    natureCreation,
    personneMorale,
    piecesJointes: [], // TODO: Convertir les documents du dossier en base64
  }

  // Construire l'enveloppe de la formalité
  const formalite: GUFormaliteCreation = {
    // Nom de l'entreprise (champ de niveau racine)
    companyName: dossier.societe.denomination,

    // Référence du mandataire (utiliser le numéro de dossier)
    referenceMandataire: dossier.numero,

    // Nom du dossier
    nomDossier: `Création ${dossier.societe.denomination}`,

    // Type de formalité : C (Création)
    typeFormalite: 'C',

    // Diffusion INSEE : O (Oui)
    diffusionINSEE: 'O',

    // Diffusion commerciale : O (Oui) - REQUIS
    diffusionCommerciale: 'O',

    // Indicateur d'entrée au registre (création = true)
    indicateurEntreeSortieRegistre: true,

    // Type de personne : M (Personne Morale) - CRITIQUE !
    typePersonne: 'M',

    // Numéro national (SIREN) : Non applicable pour une création
    // numNat: undefined,

    // Contenu de la formalité
    content,
  }

  return formalite
}

// ==============================================
// VALIDATION
// ==============================================

/**
 * Valide qu'un dossier contient toutes les données nécessaires pour créer une formalité GU
 *
 * @returns Un objet { valid: boolean, errors: string[] }
 */
export function validateDossierForGU(
  dossier: Dossier,
  statutsData: Partial<StatutsData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Vérifications essentielles
  if (!dossier.societe.formeJuridique) {
    errors.push('Forme juridique manquante')
  }

  if (!dossier.societe.denomination) {
    errors.push('Dénomination sociale manquante')
  }

  if (!dossier.societe.siege) {
    errors.push('Adresse du siège social manquante')
  } else {
    // Valider le format de l'adresse en essayant de la parser
    try {
      parseToBlocAdresse(dossier.societe.siege)
    } catch (error) {
      errors.push(
        `Adresse du siège social invalide : ${error instanceof Error ? error.message : 'format incorrect'}. ` +
        `Format attendu : "Numéro Type Voie Code Postal Ville" (ex: "12 Rue de la Paix 75001 PARIS")`
      )
    }
  }

  if (!dossier.societe.objetSocial && !statutsData.objetSocial) {
    errors.push('Objet social manquant')
  }

  if (!dossier.societe.capitalSocial && !statutsData.capitalSocial) {
    errors.push('Capital social manquant')
  }

  if (!statutsData.associeUnique) {
    errors.push('Associé unique manquant')
  } else {
    // Validation de l'associé unique (personne physique)
    if (statutsData.associeUnique.type === 'PERSONNE_PHYSIQUE') {
      const associe = statutsData.associeUnique
      if (!associe.nom) errors.push('Nom de l\'associé manquant')
      if (!associe.prenom) errors.push('Prénom de l\'associé manquant')
      if (!associe.dateNaissance) errors.push('Date de naissance de l\'associé manquante')
      if (!associe.lieuNaissance) errors.push('Lieu de naissance de l\'associé manquant')
      if (!associe.adresse) {
        errors.push('Adresse de l\'associé manquante')
      } else {
        // Valider le format de l'adresse de l'associé
        try {
          parseAdresse(associe.adresse)
        } catch (error) {
          errors.push(
            `Adresse de l'associé invalide : ${error instanceof Error ? error.message : 'format incorrect'}`
          )
        }
      }
    }
  }

  // Validation du gérant/président
  if (dossier.societe.formeJuridique === 'EURL' || dossier.societe.formeJuridique === 'SARL') {
    if (!statutsData.gerant) {
      errors.push('Informations du gérant manquantes')
    } else if (!statutsData.gerant.isAssocieUnique) {
      if (!statutsData.gerant.nom) errors.push('Nom du gérant manquant')
      if (!statutsData.gerant.prenom) errors.push('Prénom du gérant manquant')
    }
  }

  if (dossier.societe.formeJuridique === 'SASU' || dossier.societe.formeJuridique === 'SAS') {
    if (!statutsData.president) {
      errors.push('Informations du président manquantes')
    } else if (!statutsData.president.isAssocieUnique) {
      if (!statutsData.president.nom) errors.push('Nom du président manquant')
      if (!statutsData.president.prenom) errors.push('Prénom du président manquant')
    }
  }

  // Validation de l'exercice social
  if (!statutsData.exerciceSocial?.dateFin) {
    errors.push('Date de clôture de l\'exercice social manquante')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
