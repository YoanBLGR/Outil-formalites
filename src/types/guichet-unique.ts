/**
 * Types TypeScript pour l'API Guichet Unique INPI
 * Documentation : https://guichet-unique.inpi.fr/api/swagger_ui/mandataire/
 *
 * ⚠️ IMPORTANT : Ces types sont basés sur les standards d'API REST.
 * Ils devront être ajustés en fonction de la documentation complète de l'API.
 */

import type { FormeJuridique } from './index'

// ==============================================
// AUTHENTIFICATION
// ==============================================

/**
 * Credentials pour l'authentification au Guichet Unique
 * TODO: Vérifier le mode d'authentification exact (OAuth2, API Key, Basic Auth)
 */
export interface GUCredentials {
  username?: string
  password?: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
}

/**
 * Token d'authentification
 */
export interface GUAuthToken {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresIn: number
  expiresAt: number // Timestamp de fin de validité
}

/**
 * Réponse d'authentification
 */
export interface GUAuthResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

// ==============================================
// FORMALITÉS
// ==============================================

/**
 * Types de formalité (codes officiels GU)
 * C = Création, M = Modification, R = Radiation
 */
export type GUFormalityType = 'C' | 'M' | 'R'

/**
 * Statut d'une formalité
 * TODO: Vérifier les statuts exacts de l'API GU
 */
export type GUFormalityStatus =
  | 'DRAFT' // Brouillon
  | 'SUBMITTED' // Déposée
  | 'IN_PROGRESS' // En traitement
  | 'COMPLETED' // Traitée
  | 'REJECTED' // Rejetée
  | 'CANCELLED' // Annulée

/**
 * Nature juridique au format GU
 * Mapping depuis FormeJuridique vers les codes GU
 * ⚠️ ATTENTION : Codes corrigés suite aux tests API
 */
export type GUNatureJuridique =
  | '5498' // SARL
  | '5499' // EURL
  | '5710' // SASU
  | '5770' // SAS
  | string // Autres formes

/**
 * Civilité au format GU
 */
export type GUCivilite = 'M' | 'MME' | 'AUTRE'

/**
 * Qualité d'un dirigeant ou associé
 * TODO: Compléter avec les qualités exactes du GU
 */
export type GUQualite =
  | 'GERANT' // Gérant (EURL/SARL)
  | 'PRESIDENT' // Président (SASU/SAS)
  | 'DIRECTEUR_GENERAL' // Directeur général
  | 'ASSOCIE_UNIQUE' // Associé unique
  | 'ASSOCIE' // Associé
  | 'BENEFICIAIRE_EFFECTIF' // Bénéficiaire effectif
  | string

// ==============================================
// ADRESSE
// ==============================================

/**
 * Adresse au format GU
 * TODO: Vérifier la structure exacte attendue par le GU
 */
export interface GUAdresse {
  ligne1?: string
  ligne2?: string
  ligne3?: string
  codePostal: string
  ville: string
  pays: string // Code pays ISO (ex: FR)
  complementAdresse?: string
}

// ==============================================
// PERSONNE PHYSIQUE
// ==============================================

/**
 * Personne physique au format GU
 */
export interface GUPersonnePhysique {
  civilite: GUCivilite
  nom: string
  prenom: string
  nomUsage?: string
  dateNaissance: string // Format: YYYY-MM-DD
  lieuNaissance: string
  paysNaissance: string // Code pays ISO (ex: FR)
  nationalite: string // Code pays ISO (ex: FR)
  adresse: GUAdresse
}

// ==============================================
// PERSONNE MORALE
// ==============================================

/**
 * Personne morale au format GU
 */
export interface GUPersonneMorale {
  denomination: string
  sigle?: string
  formeJuridique: GUNatureJuridique
  siren?: string
  adresse: GUAdresse
  representantLegal?: GUPersonnePhysique
}

// ==============================================
// DIRIGEANTS ET BÉNÉFICIAIRES
// ==============================================

/**
 * Dirigeant ou associé
 */
export interface GUDirigeant {
  qualite: GUQualite
  personnePhysique?: GUPersonnePhysique
  personneMorale?: GUPersonneMorale
  dateDebutFonction?: string // Format: YYYY-MM-DD
  dateFinFonction?: string // Format: YYYY-MM-DD (pour mandat à durée déterminée)
  pourcentageDetention?: number // Pourcentage de parts/actions détenues
}

/**
 * Bénéficiaire effectif
 * Structure officielle selon l'API GU
 */
export interface GUBeneficiaireEffectif {
  // Le bénéficiaire (même structure que descriptionPersonne)
  beneficiaire: GUDescriptionPersonne
  // Statut pour la formalité : "1" = Ajout, "2" = Modification, "3" = Suppression, "4" = Inchangée, "5" = Inchangée 24M
  statutPourLaFormalite: '1' | '2' | '3' | '4' | '5'
  // Modalités de contrôle
  modalitesControle: string[] // Ex: ['DETENTION_CAPITAL', 'DROIT_VOTE']
  // Pourcentage de détention (optionnel)
  pourcentageDetention?: number
  pourcentageDroitsVote?: number
}

// ==============================================
// CAPITAL SOCIAL
// ==============================================

/**
 * Capital social au format GU
 */
export interface GUCapital {
  montant: number // Montant en euros (centimes)
  devise: string // EUR
  montantLibere?: number
  nombreParts?: number
  nombreActions?: number
  valeurNominale: number
}

// ==============================================
// ÉTABLISSEMENT
// ==============================================

/**
 * Rôle pour l'entreprise
 * "1" = Siège uniquement
 * "2" = Siège et établissement principal
 * "3" = Établissement principal (différent du siège)
 */
export type GURolePourEntreprise = '1' | '2' | '3'

/**
 * Description d'une activité
 * Documentation: BlocDescriptionActivite-0
 */
export interface GUBlocDescriptionActivite {
  // Période et date
  typePeriode?: string // "1" = À partir du, "2" = Pendant la période
  dateDebut?: string // Date de début d'activité (YYYY-MM-DD)
  dateFin?: string // Date de fin (si saisonnière)

  // Indicateurs d'activité principale
  activitePrincipale?: boolean // Indicateur d'activité principale (legacy)
  indicateurPrincipal?: boolean // Indicateur d'activité principale (nouveau champ)
  principale?: boolean // Alias pour indicateurPrincipal

  // Description de l'activité
  activite?: string // Description courte de l'activité
  libelle?: string // Libellé de l'activité
  categorie?: string // Catégorie d'activité
  descriptionDetaillee?: string // Description détaillée (REQUIS)
  codeApe?: string // Code APE (si connu)

  // Caractéristiques de l'activité
  origine?: {
    typeOrigine?: string // "1" = Création, "3" = Achat, "8" = Reprise, etc. (REQUIS pour création)
    autreOrigine?: string // Précision si typeOrigine = "9" (Autre)
  }
  exerciceActivite?: string // 'P' = Permanente, 'S' = Saisonnière (REQUIS)
  exercice?: string // Alias pour exerciceActivite
  rolePrincipalPourEntreprise?: boolean // Cette activité est le rôle principal (REQUIS)
  ambulant?: boolean // Activité ambulante
  prolongementActiviteAgricole?: boolean // Prolongement d'une activité agricole

  // Catégorisations (codes à 2 chiffres) - REQUIS en création
  categorisationActivite1?: string // Ex: "01" (Commerce)
  categorisationActivite2?: string // Ex: "06" (Autre)
  categorisationActivite3?: string
  categorisationActivite4?: string

  // Précisions pour catégories "Autre"
  precisionAutreCategorie1?: string
  precisionAutreCategorie2?: string
  precisionAutreCategorie3?: string
  precisionAutreCategorie4?: string
}

/**
 * Effectif salarié (BlocEtablissementSalarie-0)
 * Note: Le schéma OpenAPI indique "string" mais l'API attend des nombres
 */
export interface GUEffectifSalarie {
  presenceSalarie?: boolean // Présence de salarié
  presenceSalaries?: boolean // Alias pour presenceSalarie
  nombreSalarie?: number // Nombre de salariés (ex: 0, 5) - l'API attend un number
  nombreApprenti?: number // Nombre d'apprentis
  nombreVrp?: number // Nombre de VRP
  emploiPremierSalarie?: boolean // Emploi du premier salarié prévu
  emploiePremiersSalaries?: boolean // Alias pour emploiPremierSalarie
  dateEffetDebutEmploiSalarie?: string // Date de début d'emploi de salarié (YYYY-MM-DD)
  dateEffetFinEmploiSalarie?: string // Date de fin d'emploi de salarié (YYYY-MM-DD)
  nombreSaisonnier?: number // Nombre de saisonniers
  nombreSalariesMarin?: number // Nombre de salariés marins
  employeurSalarieNonRegimeFr?: boolean // Employeur salarié non soumis au régime français
}

/**
 * Informations générales établissement
 */
export interface GUInformationsGenerales {
  presenceSalaries?: boolean
  emploiePremiersSalaries?: boolean
}

/**
 * Établissement (siège social ou établissement)
 * Documentation: RubriqueEtablissement-1
 */
export interface GUEtablissement {
  descriptionEtablissement?: {
    rolePourEntreprise: GURolePourEntreprise
    enseigne?: string
    nomCommercial?: string
    codeApe?: string
    statutPourFormalite?: string // "1" = Nouveau, "2" = Supprimé, "3" = Modifié, etc.
    indicateurEtablissementPrincipal?: boolean
  }
  adresse?: GUBlocAdresse
  activites?: GUBlocDescriptionActivite[]
  effectifSalarie?: GUEffectifSalarie
  informationsGenerales?: GUInformationsGenerales
  dateDebut?: string // Date d'installation au siège
}

// ==============================================
// FORMALITÉ COMPLÈTE
// ==============================================

/**
 * Type de personne
 * M = Personne Morale (société)
 * P = Personne Physique
 */
export type GUTypePersonne = 'M' | 'P'

/**
 * Nature de création (champ requis dans content)
 * Documentation: BlocNatureCreation-0
 */
export interface GUNatureCreation {
  dateCreation?: string // Format: YYYY-MM-DD
  formeJuridique?: GUNatureJuridique
  societeEtrangere?: boolean
  typeExploitation?: string
  microEntreprise?: boolean
  etablieEnFrance?: boolean
  salarieEnFrance?: boolean
  dateDepotCreation?: string
}

/**
 * Entreprise (identité de base)
 * Documentation: BlocEntrepriseIdentite-1
 */
export interface GUBlocEntrepriseIdentite {
  denomination?: string
  formeJuridique?: GUNatureJuridique
  siren?: string
  pays?: string
  objet?: string // Objet social
}

/**
 * Description détaillée de la personne morale
 * Documentation: BlocDetailPersonneMorale-0
 */
export interface GUBlocDetailPersonneMorale {
  objet?: string // Objet social
  sigle?: string
  duree?: number // en années
  dateClotureExerciceSocial?: string // Format: JJMM (ex: "3112")
  datePremiereCloture?: string // Format: YYYY-MM-DD
  montantCapital?: number // Montant en euros (nombre)
  deviseCapital?: string // Ex: "EUR"
  capitalVariable?: boolean
  depotDemandeAcre?: boolean
  ess?: boolean // Entreprise de l'Économie Sociale et Solidaire
  societeMission?: boolean // Société à mission
  indicateurOrigineFusionScission?: boolean // Indicateur origine fusion/scission (nom exact du champ HTML)
  /**
   * Nature de la gérance (codes valides) :
   * - "1" : Majoritaire
   * - "3" : Minoritaire ou égalitaire, société associée
   * - "4" : Minoritaire ou égalitaire, sans société associée
   * - "5" : Gérance non associée, société associée
   * - "6" : Gérance non associée, sans société associée
   */
  natureGerance?: '1' | '3' | '4' | '5' | '6'
}

/**
 * Publication légale
 */
export interface GUPublicationLegale {
  indicateurNonPublicite?: boolean
  datePublication?: string // Format: YYYY-MM-DD
  support?: string // Code du support de publication
  url?: string // URL de la publication légale
}

/**
 * Destinataire de correspondance
 */
export interface GUDestinataireCorrespondance {
  typeDestinataireCorrespondance?: string // R = Représentant légal
}

/**
 * Identité de la personne morale (structure complète)
 * Documentation: PMRubriqueIdentitePM-0
 */
export interface GUIdentitePersonneMorale {
  entreprise?: GUBlocEntrepriseIdentite // REQUIS
  description?: GUBlocDetailPersonneMorale // REQUIS pour création
  publicationLegale?: GUPublicationLegale
  destinataireCorrespondance?: GUDestinataireCorrespondance
}

/**
 * Bloc adresse (structure officielle)
 * Documentation: BlocAdresse-1
 */
export interface GUBlocAdresse {
  codePays?: string
  codePostal?: string
  commune?: string
  numVoie?: string
  typeVoie?: string
  voie?: string
  complement?: string
  lieuDit?: string
  codeCommune?: string
}

/**
 * Caractéristiques de l'adresse
 */
export interface GUCaracteristiquesAdresse {
  ambulant?: boolean
  domiciliataire?: boolean
  indicateurDomicileEntrepreneur?: boolean
  indicateurDomicileEntrepreneurValidation?: boolean // OBLIGATOIRE pour EI : validation de la domiciliation
  indicateurAdresseEtablissement?: boolean // OBLIGATOIRE pour EI : true si adresse différente du domicile
}

/**
 * Adresse de l'entreprise
 * Documentation: RubriqueAdresseEntreprise-1
 */
export interface GUAdresseEntreprise {
  caracteristiques?: GUCaracteristiquesAdresse
  adresse?: GUBlocAdresse
}

/**
 * Description d'une personne (pour pouvoir)
 * IMPORTANT: Les noms de champs doivent correspondre exactement à l'API GU
 * NOTE: Les champs d'assurance maladie (indicateurActiviteAnterieure, etc.) sont dans voletSocial, pas ici
 */
export interface GUDescriptionPersonne {
  nom?: string
  prenoms?: string[] // Array de prénoms
  genre?: string // "1" = Masculin, "2" = Féminin (codes numériques)
  nomUsage?: string
  dateDeNaissance?: string // Format: YYYY-MM-DD (ATTENTION: "dateDeNaissance" avec "De")
  villeNaissance?: string
  paysNaissance?: string // Nom complet du pays (ex: "FRANCE", "ALLEMAGNE")
  codeNationalite?: string // Code ISO 3 lettres (ex: "FRA", "DEU")
  numeroSecu?: string // Numéro de sécurité sociale (15 chiffres, OBLIGATOIRE pour nationalité française)
  codeInseeGeographique?: string // Code INSEE de la commune de naissance (5 chiffres, OBLIGATOIRE pour entrepreneur)
  lieuDeNaissance?: string // Lieu de naissance complet
  formeSociale?: string // "0" = Non applicable, "1" = sans affiliation, "2" = affiliation entrepreneur, "3" = affiliation dirigeant (REQUIS pour individu dans pouvoir)
  /**
   * Situation matrimoniale (OBLIGATOIRE pour l'entrepreneur) :
   * - "1" : Célibataire
   * - "2" : Divorcé
   * - "3" : Veuf
   * - "4" : Marié
   * - "5" : Pacsé
   * - "6" : En concubinage
   */
  situationMatrimoniale?: '1' | '2' | '3' | '4' | '5' | '6'
  indicateurDeNonSedentarite?: boolean // OBLIGATOIRE pour entrepreneur : false = sédentaire
  statutVisAVisFormalite?: string // OBLIGATOIRE pour entrepreneur : "1" = Nouveau
}

/**
 * Adresse de domicile pour un individu dans un pouvoir
 * Documentation: composition-adresse-individu.address-fetcher
 */
export interface GUAdresseDomicile {
  roleAdresse?: string // Rôle de l'adresse
  pays?: string // Nom complet du pays (ex: "France")
  codePays?: string // Code pays ISO 3 lettres (ex: "FRA")
  codePostal?: string
  commune?: string
  communeAncienne?: string
  codeInseeCommune?: string
  typeVoie?: string // Ex: "RUE", "BD", "AVENUE"
  typeVoiePresent?: boolean
  voie?: string // Nom de la voie
  voiePresent?: boolean
  voieCodifiee?: string
  voieCodifieePresent?: boolean
  numVoie?: string // Numéro de voie
  numVoiePresent?: boolean
  indiceRepetition?: string // Ex: "T", "B" (bis, ter)
  indiceRepetitionPresent?: boolean
  distributionSpeciale?: string // Ex: "CEDEX"
  distributionSpecialePresent?: boolean
  rgpd?: string
  datePriseEffetAdresse?: string // Format: YYYY-MM-DD
  complementLocalisation?: string
  complementLocalisationPresent?: boolean
  communeDeRattachement?: string
  caracteristiques?: {
    ambulant?: boolean
    domiciliataire?: boolean
    indicateurDomicileEntrepreneur?: boolean
    indicateurDomicileEntrepreneurValidation?: boolean
  }
}

/**
 * Adresse pour un pouvoir (DEPRECATED - utilisez GUAdresseDomicile)
 */
export interface GUAdressePouvoir {
  pays?: string // Code pays ISO 3 lettres (ex: "FRA")
  codePostal?: string
  commune?: string
  ligne1?: string
}

/**
 * Contacts pour un pouvoir
 */
export interface GUContactsPouvoir {
  email?: string
  telephone?: string
}

/**
 * Volet social individu (pour pouvoir)
 * Documentation: composition-volet-social-individu
 */
export interface GUVoletSocialIndividu {
  natureVoletSocial?: string // Ex: "TNS" (Travailleur Non Salarié)
  dateEffetVoletSocial?: string // Format: YYYY-MM-DD
  situationVisAVisMsa?: string // Situation vis-à-vis de la MSA
  indicateurActiviteAnterieure?: boolean // Activité non salariée antérieure (false = Non)
  activiteSimultanee?: boolean // Exercice d'une activité simultanée (false = Non)
  affiliationPamBiologiste?: boolean // Affiliation biologiste (false = Non)
  affiliationPamPharmacien?: boolean // Affiliation pharmacien (false = Non)
  organismeAssuranceMaladieActuelle?: string // Organisme d'assurance maladie actuel (ex: "R" = Régime général)
  autreOrganisme?: string // Autre organisme
  demandeAcre?: boolean // Demande d'ACRE
  statutExerciceActiviteSimultanee?: string
  autreActiviteExercee?: string
  jeuneAgriculteur?: string
  organismePension?: string
  nonSalarieOuConjointBeneficiaireRsaRmi?: string
  choixOrganismeAssuranceMaladie?: string
  departementOrganismeAssuranceMaladie?: string
  indicateurRegimeAssuranceMaladie?: boolean
  ancienNumeroSiren?: string
}

/**
 * Détail d'un individu pour un pouvoir
 */
export interface GUIndividuPouvoir {
  descriptionPersonne?: GUDescriptionPersonne
  adresse?: GUAdressePouvoir // [DEPRECATED] Utilisez adresseDomicile
  adresseDomicile?: GUAdresseDomicile // Adresse de domicile officielle (composition-adresse-individu.address-fetcher)
  contacts?: GUContactsPouvoir
  voletSocial?: GUVoletSocialIndividu // Volet social (composition-volet-social-individu)
}

/**
 * Pouvoir (dirigeant, représentant)
 */
export interface GUPouvoir {
  individu?: GUIndividuPouvoir
  entreprise?: any // Pour personne morale
  roleEntreprise?: string // Ex: "30" pour Gérant unique, "71" pour Président
  statutPourLaFormalite?: string // Ex: "N" pour Nouveau
  dateEffet?: string // Format: YYYY-MM-DD
  typeDePersonne?: string // "INDIVIDU" pour Personne physique, "ENTREPRISE" pour Personne morale
  beneficiaireEffectif?: boolean // Obligatoire pour personne morale - true si bénéficiaire effectif
  autreFonction?: boolean // [DEPRECATED] Utilisez indicateurSecondRoleEntreprise
  indicateurSecondRoleEntreprise?: boolean // Indicateur si la personne exerce une autre fonction (false par défaut)
  secondRoleEntreprise?: string // Code du second rôle si indicateurSecondRoleEntreprise = true
  autreRoleEntreprise?: string // Description du second rôle si indicateurSecondRoleEntreprise = true
  nouveauBeneficiaireEffectif?: boolean // Nouveau bénéficiaire effectif
}

/**
 * Composition (dirigeants et pouvoirs)
 */
export interface GUComposition {
  pouvoirs?: GUPouvoir[]
}

/**
 * Structure de la personne morale
 */
export interface GUStructure {
  domiciliationProvisoireDomicileRepresentantLegal?: boolean
  recoursSocieteDomiciliation?: boolean
  entrepriseCreeeSansActivite?: boolean
  nomsDomaineInternet?: string[]
}

/**
 * Options fiscales
 * Codes régime d'imposition :
 * - 110: Régime spécial BNC
 * - 111: Déclaration contrôlée BNC
 * - 112: Réel simplifié BIC
 * - 113: Réel normal BIC
 * - 114: Réel simplifié IS
 * - 115: Réel normal IS
 * - 116: Micro BIC
 * - 117: Micro BA
 * - 118: Régime réel simplifié BA
 * - 119: Régime réel normal BA
 * - 120: Revenu foncier
 * - 121: Forfait Forestier
 */
export interface GUOptionsFiscales {
  optionIS?: boolean
  regimeImpositionBenefices?: string // Codes valides : "110" à "121" (voir ci-dessus)
  regimeTVA?: string // Ex: "TVA_REEL_NORMAL"
  dateClotureExerciceComptable?: string // Format: JJMM
  optionVersementLiberatoire?: boolean // OBLIGATOIRE si régime micro-social
}

/**
 * Correspondance
 */
export interface GUCorrespondance {
  typeDestinataire?: string // "ENTREPRISE", etc.
  adresse?: GUBlocAdresse
  contacts?: {
    email?: string
    telephone?: string
  }
}

/**
 * Observations et correspondance
 */
export interface GUObservationsCorrespondance {
  observations?: string
  prospectionConsentement?: boolean
  correspondance?: GUCorrespondance
}

/**
 * Volet social (informations d'assurance maladie et activité)
 * Documentation: BlocVoletSocial
 */
export interface GUBlocVoletSocial {
  indicateurActiviteAnterieure?: boolean // Activité non salariée antérieure
  activiteSimultanee?: boolean // Exercice d'une activité simultanée
  affiliationPamBiologiste?: boolean // Affiliation biologiste
  affiliationPamPharmacien?: boolean // Affiliation pharmacien
  organismeAssuranceMaladieActuelle?: string // Organisme d'assurance maladie actuel (ex: "R" = Régime général)
}

/**
 * Régime micro-social pour les EI
 */
export interface GURegimeMicroSocial {
  optionMicroSocial?: boolean // Option pour le régime micro-social
  periodiciteVersement?: 'M' | 'T' // M = Mensuel, T = Trimestriel
}

/**
 * Entrepreneur (informations spécifiques à l'EI)
 * Documentation: entrepreneur bloc du SHEMA.txt
 */
export interface GUEntrepreneur {
  indicateurActifAgricole?: boolean
  dateActifAgricole?: string
  roleConjoint?: string
  nouveauRoleConjoint?: string
  voletSocial?: GUVoletSocialIndividu
  regimeMicroSocial?: GURegimeMicroSocial
  greffeImmatriculation?: string
  noUniqueIdentification?: string
  descriptionPersonne?: GUDescriptionPersonne
  descriptionEntrepreneur?: GUDescriptionPersonne
  adresseDomicile?: GUAdresseDomicile
  contact?: {
    email?: string
    telephone?: string
    telecopie?: string
  }
}

/**
 * Destinataire de correspondance
 */
export interface GUDestinataireCorrespondanceEI {
  typeDestinataireCorrespondance?: string // "1" = Entrepreneur
}

/**
 * Identité de la personne physique (entrepreneur)
 */
export interface GUIdentitePersonnePhysique {
  entreprise?: any // Référence circulaire possible
  entrepreneur?: GUEntrepreneur
  destinataireCorrespondance?: GUDestinataireCorrespondanceEI
}

/**
 * Personne physique complète (EI)
 * Structure équivalente à GUPersonneMoraleComplete pour les EI
 */
export interface GUPersonnePhysiqueComplete {
  identite?: GUIdentitePersonnePhysique
  adresseEntreprise?: GUAdresseEntreprise // OBLIGATOIRE pour non-cessation
  etablissementPrincipal?: GUEtablissement
  autresEtablissements?: GUEtablissement[]
  optionsFiscales?: GUOptionsFiscales
  observationsCorrespondance?: GUObservationsCorrespondance
}

/**
 * Personne morale complète
 * Documentation: PersonneMorale-0
 */
export interface GUPersonneMoraleComplete {
  identite: GUIdentitePersonneMorale
  adresseEntreprise?: GUAdresseEntreprise
  structure?: GUStructure
  composition?: GUComposition
  etablissementPrincipal?: GUEtablissement
  autresEtablissements?: GUEtablissement[]
  optionsFiscales?: GUOptionsFiscales
  beneficiairesEffectifs?: GUBeneficiaireEffectif[]
  observationsCorrespondance?: GUObservationsCorrespondance
  voletSocial?: GUBlocVoletSocial // Volet social (OBLIGATOIRE pour création)

  // ⚠️ CHAMPS EN LECTURE SEULE (ne pas envoyer dans les requêtes POST/PATCH)
  // Ces indicateurs sont définis par le serveur selon ses variables d'environnement
  isEnableBypassModificationRepresentant?: boolean
  isEnableBypassModificationBE?: boolean
}

/**
 * Contenu de la formalité (champ "content" de la requête)
 * Structure officielle selon l'API OpenAPI
 * Documentation: Company-0
 */
export interface GUFormaliteContent {
  // Nature de création (REQUIS pour création)
  natureCreation: GUNatureCreation

  // Personne morale (REQUIS pour personne morale, typePersonne = 'M')
  personneMorale?: GUPersonneMoraleComplete

  // Personne physique (REQUIS pour EI, typePersonne = 'P')
  personnePhysique?: GUPersonnePhysiqueComplete

  // Déclarant (optionnel)
  declarant?: any

  // Pièces jointes (PDF en base64, < 10Mo)
  piecesJointes?: GUDocument[]
}

/**
 * Requête de création d'une formalité (structure complète)
 * Documentation officielle : Section 3.3 - Envoi d'une nouvelle formalité
 */
export interface GUFormaliteCreation {
  // Nom de l'entreprise
  companyName: string

  // Référence libre du mandataire pour rattacher la formalité
  referenceMandataire?: string

  // Nom du dossier
  nomDossier?: string

  // Type de formalité : C (Création), M (Modification), R (Radiation)
  typeFormalite: GUFormalityType

  // Observation pour la signature
  observationSignature?: string

  // Diffusion INSEE : O (Oui) ou N (Non)
  diffusionINSEE?: 'O' | 'N'

  // Diffusion commerciale : O (Oui) ou N (Non)
  diffusionCommerciale?: 'O' | 'N'

  // Indicateur d'entrée/sortie du registre
  indicateurEntreeSortieRegistre?: boolean

  // Type de personne : P (Personne Morale)
  typePersonne: GUTypePersonne

  // Numéro national (SIREN si existant)
  numNat?: string

  // Contenu de la formalité
  content: GUFormaliteContent
}

/**
 * Document joint à une formalité (pièce jointe)
 * Les fichiers doivent être au format PDF et inférieurs à 10Mo
 * Envoyés en base64 dans le tableau content->piecesJointes
 */
export interface GUDocument {
  typeDocument: string // Code type de document selon nomenclature GU
  nomFichier: string
  contenuBase64: string // Contenu du fichier en base64
}

// ==============================================
// RÉPONSES API
// ==============================================

/**
 * Réponse de création d'une formalité
 */
export interface GUCreateFormalityResponse {
  formalityId: string
  status: GUFormalityStatus
  createdAt: string
  updatedAt: string
  url?: string // URL vers la formalité sur le portail GU
  reference?: string // Référence de la formalité
  errors?: GUError[]
  warnings?: GUWarning[]
}

/**
 * Réponse de récupération d'une formalité
 */
export interface GUGetFormalityResponse extends GUCreateFormalityResponse {
  data: GUFormaliteCreation
}

/**
 * Erreur retournée par l'API
 */
export interface GUError {
  code: string
  message: string
  field?: string
  details?: Record<string, unknown>
}

/**
 * Avertissement retourné par l'API
 */
export interface GUWarning {
  code: string
  message: string
  field?: string
}

// ==============================================
// CONFIGURATION
// ==============================================

/**
 * Configuration du service Guichet Unique
 */
export interface GUConfig {
  apiUrl: string
  credentials: GUCredentials
  timeout?: number
  retryAttempts?: number
}

// ==============================================
// HELPERS
// ==============================================

/**
 * Mapping des formes juridiques Formalyse → GU
 * ⚠️ ATTENTION : Les codes ont été corrigés suite aux tests
 * - 5499 = EURL (et non 5498 qui correspond à une société d'attribution d'immeuble)
 * - 5498 = SARL
 */
export const FORME_JURIDIQUE_TO_GU: Record<FormeJuridique, GUNatureJuridique> = {
  EURL: '5499',
  SARL: '5498',
  SASU: '5710',
  SAS: '5770',
}

/**
 * Mapping inverse GU → Formalyse
 */
export const GU_TO_FORME_JURIDIQUE: Record<GUNatureJuridique, FormeJuridique> = {
  '5498': 'SARL',
  '5499': 'EURL',
  '5710': 'SASU',
  '5770': 'SAS',
}
