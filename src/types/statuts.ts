import type { FormeJuridique } from './index'

// Type d'associé unique
export type TypeAssocie = 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE'

// Types d'apports (7 variants)
export type TypeApport =
  | 'NUMERAIRE_TOTAL'
  | 'NUMERAIRE_PARTIEL'
  | 'NATURE_SEUL'
  | 'MIXTE_NUMERAIRE_NATURE'
  | 'FONDS_COMMERCE'
  | 'BIEN_COMMUN'
  | 'PACS_INDIVISION'

// Types de libération
export type TypeLiberation = 'TOTALE' | 'PARTIELLE'

// Régime matrimonial
export type RegimeMatrimonial =
  | 'COMMUNAUTE_REDUITE_AUX_ACQUETS'
  | 'SEPARATION_BIENS'
  | 'COMMUNAUTE_UNIVERSELLE'
  | 'PARTICIPATION_AUX_ACQUETS'

// Associé personne physique
export interface AssociePersonnePhysique {
  type: 'PERSONNE_PHYSIQUE'
  civilite: 'M' | 'Mme'
  nom: string
  prenom: string
  dateNaissance: string
  lieuNaissance: string
  nationalite: string
  adresse: string
  pourcentageCapital: number // Pourcentage du capital détenu (ex: 50 pour 50%)
  regimeMatrimonial?: RegimeMatrimonial
  conjointNom?: string
  conjointPrenom?: string
  pacs?: boolean
  partenaireNom?: string
  partenairePrenom?: string
}

// Associé personne morale
export interface AssociePersonneMorale {
  type: 'PERSONNE_MORALE'
  societeNom: string
  societeFormeJuridique: string
  societeCapital: number
  societeRCS: string
  societeNumeroRCS: string
  societeSiege: string
  representantNom: string
  representantPrenom: string
  representantQualite: string
  pourcentageCapital: number // Pourcentage du capital détenu (ex: 50 pour 50%)
}

export type AssocieUnique = AssociePersonnePhysique | AssociePersonneMorale

// Associé avec parts (pour SARL/SAS)
export interface AssocieAvecParts {
  id: string
  associe: AssociePersonnePhysique | AssociePersonneMorale
  nombreParts?: number // Calculé automatiquement si non fourni, basé sur pourcentageCapital
  montantApport?: number // Calculé automatiquement si non fourni, basé sur pourcentageCapital
  pourcentageCapital?: number // DEPRECATED: utiliser associe.pourcentageCapital à la place
  apport?: ApportDetaille // Détails de l'apport si applicable
}

// Liste des associés (pour SARL/SAS)
export interface Associes {
  liste: AssocieAvecParts[]
  nombreTotal: number
}

// Commissaire aux apports
export interface CommissaireAuxApports {
  requis: boolean
  nom?: string
  prenom?: string
  designation?: string // ex: "à l'unanimité des associés"
  rapportAnnexe?: boolean
}

// Détails d'un apport
export interface Apport {
  id: string
  type: TypeApport
  montant: number
  description?: string
  dateLiberation?: string
  pourcentageLibere?: number // Pour libération partielle
}

// Apport en numéraire
export interface ApportNumeraire {
  type: 'NUMERAIRE_TOTAL' | 'NUMERAIRE_PARTIEL'
  montant: number
  montantLibere: number
  pourcentageLibere: number
  montantRestant: number
  nombreParts: number // Pour EURL/SARL
  nombreActions?: number // Pour SASU/SAS
}

// Apport en nature
export interface ApportNature {
  type: 'NATURE_SEUL'
  description: string
  valeur: number
  nombreParts: number // Pour EURL/SARL
  nombreActions?: number // Pour SASU/SAS
  commissaireAuxApports: CommissaireAuxApports
}

// Apport mixte
export interface ApportMixte {
  type: 'MIXTE_NUMERAIRE_NATURE'
  numeraire: {
    montant: number
    montantLibere: number
  }
  nature: {
    description: string
    valeur: number
  }
  nombreParts: number // Pour EURL/SARL
  nombreActions?: number // Pour SASU/SAS
  commissaireAuxApports: CommissaireAuxApports
}

// Apport d'un fonds de commerce
export interface ApportFondsCommerce {
  type: 'FONDS_COMMERCE'
  nature: string // ex: "boulangerie-pâtisserie"
  adresse: string
  elementsIncorporels: number
  materiel: number
  marchandises: number
  valeurTotale: number
  nombreParts: number // Pour EURL/SARL
  nombreActions?: number // Pour SASU/SAS
  commissaireAuxApports: CommissaireAuxApports
}

// Apport d'un bien commun (marié)
export interface ApportBienCommun {
  type: 'BIEN_COMMUN'
  description: string
  valeur: number
  regimeMatrimonial: RegimeMatrimonial
  conjointNom: string
  conjointPrenom: string
  conjointRenonciation: boolean // Renonce à la qualité d'associé
  conjointApport?: ConjointApport // Détails intervention conjoint
  nombreParts: number // Pour EURL/SARL
  nombreActions?: number // Pour SASU/SAS
}

// Apport d'un bien indivis (PACS)
export interface ApportBienIndivis {
  type: 'PACS_INDIVISION'
  description: string
  valeur: number
  partenaireNom: string
  partenairePrenom: string
  partenaireAccord: boolean
  partenaireRenonciation: boolean
  partenairePACS?: PartenairePACS // Type de PACS (coassocié ou séparation)
  nombreParts: number // Pour EURL/SARL
  nombreActions?: number // Pour SASU/SAS
}

// Type d'intervention du conjoint pour apports de biens communs
export type ConjointIntervention = 
  | 'REVENDICATION' // Revendique la qualité d'associé
  | 'RENONCIATION_DEFINITIVE' // Renonce définitivement
  | 'RENONCIATION_PROVISOIRE' // Renonce provisoirement, peut revendiquer plus tard
  | 'AUCUNE' // Pas d'intervention

// Mode de notification du conjoint
export type ConjointNotification = 
  | 'COURRIER' // Par lettre recommandée
  | 'STATUTS' // Intervention aux statuts
  | 'AUCUNE' // Pas de notification

// Informations sur le conjoint pour apports mariés
export interface ConjointApport {
  intervention: ConjointIntervention
  notification: ConjointNotification
  dateAvertissement?: string
  dateNotification?: string
  consentementArticle1424?: boolean // Accord pour apport soumis à l'article 1424 C.civ
}

// Informations sur le partenaire PACS pour apports
export type PartenairePACS = 
  | 'COASSOCIE' // Partenaires co-associés
  | 'SEPARATION_PATRIMOINES' // Séparation des patrimoines

export type ApportDetaille =
  | ApportNumeraire
  | ApportNature
  | ApportMixte
  | ApportFondsCommerce
  | ApportBienCommun
  | ApportBienIndivis

// Informations sur les parts sociales (EURL/SARL) ou actions (SASU/SAS)
export interface PartsSociales {
  nombreTotal: number // Nombre total de parts ou actions
  valeurNominale: number
  repartition: {
    associeId: string
    nombreParts: number // ou nombreActions pour SASU
    montantSouscrit: number
  }[]
}

// Informations sur le gérant (EURL/SARL)
export interface Gerant {
  isAssocieUnique: boolean // true si le gérant est l'associé unique
  civilite?: 'M' | 'Mme'
  nom?: string
  prenom?: string
  dateNaissance?: string
  lieuNaissance?: string
  adresse?: string
  nationalite?: string
  dureeMandat: string // ex: "durée de la société" ou "3 ans"
  remuneration: {
    type: 'FIXE' | 'VARIABLE' | 'AUCUNE'
    montant?: number
    modalites?: string
  }
  pouvoirs: string // Description des pouvoirs
}

// Informations sur le Président (SASU/SAS)
export interface President {
  isAssocieUnique: boolean // true si le président est l'associé unique
  civilite?: 'M' | 'Mme'
  nom?: string
  prenom?: string
  dateNaissance?: string
  lieuNaissance?: string
  adresse?: string
  nationalite?: string
  dureeMandat: string // ex: "sans limitation de durée" ou durée spécifique
  remuneration: {
    type: 'FIXE' | 'VARIABLE' | 'AUCUNE'
    montant?: number
    modalites?: string
  }
  delaiPreavis: number // en mois
  modeRevocation: string // ex: "à tout moment" ou "pour motifs graves"
}

// Type union pour Dirigeant (Gérant ou Président)
export type Dirigeant = Gerant | President

// Exercice social
export interface ExerciceSocial {
  dateDebut: string // Format: "01/01" ou date de création
  dateFin: string // Format: "31/12"
  premierExerciceFin?: string // Date de clôture du 1er exercice (ex: "31 décembre 2025")
  premierExercice?: {
    debut: string // Date de création
    fin: string // Date de clôture du 1er exercice
  }
}

// Affectation des résultats
export interface AffectationResultats {
  reserveLegale: number // Généralement 5%
  reserveStatutaire?: number // Optionnel
  dividendes: string // ex: "Le solde est mis en réserve ou distribué"
  reportNouveau: boolean
}

// Transmission des parts
export interface TransmissionParts {
  agrementRequis: boolean
  modalitesAgrement?: string
  droitPreemption: boolean
  clauseInalienabilite?: {
    duree: string
    conditions: string
  }
}

// Régime de cession des parts (EURL/SARL - Article 13.1.2)
export type RegimeCession = 
  | 'LIBRE_ENTRE_ASSOCIES' // Libre entre associés, agrément famille et tiers
  | 'LIBRE_FAMILIAL' // Libre famille, agrément associés et tiers
  | 'LIBRE_ASSOCIES_FAMILIAL' // Libre associés+famille, agrément tiers
  | 'AGREMENT_TOTAL' // Agrément pour toutes cessions

// Type d'exploit pour signification (Article 13.1.1 et 13.1.2)
export type ExploitType = 'HUISSIER' | 'COMMISSAIRE'

// Transmission par décès (Article 13.3)
export type TransmissionDeces =
  | 'SURVIVANTS_SEULS' // Société continue avec les seuls associés survivants
  | 'HERITIERS_AVEC_AGREMENT' // Héritiers avec agrément
  | 'HERITIERS_SANS_AGREMENT' // Héritiers sans agrément
  | 'PERSONNES_DESIGNEES' // Personnes désignées dans les statuts

// Liquidation de communauté (Article 13.3)
export type LiquidationCommunaute =
  | 'AVEC_AGREMENT' // Attribution parts au conjoint avec agrément
  | 'SANS_AGREMENT' // Attribution parts au conjoint sans agrément
  | 'NON_APPLICABLE' // Pas de clause

// Location des parts (Article 13.5)
export type LocationParts = 'INTERDITE' | 'AUTORISEE'

// Article 17 : Durée du mandat de Gérant
export type DureeMandat = 'INDETERMINEE' | 'DETERMINEE'

// Article 17 : Majorité pour nomination du Gérant
export type MajoriteNomination = 
  | 'LEGALE_AVEC_SECONDE' // Majorité légale (>50%) avec seconde consultation possible
  | 'LEGALE_SANS_SECONDE' // Majorité légale sans seconde consultation
  | 'RENFORCEE_AVEC_SECONDE' // Majorité renforcée avec seconde consultation
  | 'RENFORCEE_SANS_SECONDE' // Majorité renforcée sans seconde consultation

// Régime de cession des actions (SASU/SAS - Article 11)
export type RegimeCessionActions = 'LIBRE' | 'AGREMENT_PLURIPERSONNELLE'

export interface AdmissionAssocies {
  regimeCession: RegimeCession
  exploitType: ExploitType // Type d'exploit (huissier ou commissaire)
  majoriteCessionTiers?: string // ex: "la moitié" ou "les deux tiers"
  majoriteMutation?: string // ex: "la moitié"
  modalitesPrixRachat?: string // Description du calcul du prix de rachat
  
  // Article 13.3 : Transmission par décès
  transmissionDeces: TransmissionDeces
  personnesDesignees?: string // Si PERSONNES_DESIGNEES
  liquidationCommunaute: LiquidationCommunaute
  
  // Article 13.5 : Location des parts
  locationParts: LocationParts
}

// Transmission des actions (SASU/SAS - Article 11)
export interface TransmissionActions {
  regimeCession: RegimeCessionActions
  majoriteAgrement?: string // ex: "l'unanimité" ou "la majorité des droits de vote"
  modalitesPrixRachat?: string // Description du calcul du prix de rachat
}

// Comptes courants (Article 21)
export interface CompteCourant {
  seuilMinimum: number // Pourcentage minimum du capital (généralement 5%)
  conditions?: string // Conditions de remboursement et rémunération
}

// Nomination du gérant (EURL/SARL - Article 30)
export interface NominationGerant {
  gerantDansStatuts: boolean // true si nommé dans les statuts, false si acte séparé
  gerantEstAssocie: boolean // true si le gérant est l'associé unique
  dureeNomination?: string // "indéterminée" ou durée spécifique
  remunerationFixee?: boolean
  descriptionRemuneration?: string
}

// Nomination du Président (SASU/SAS - Article 13)
export interface NominationPresident {
  presidentDansStatuts: boolean // true si nommé dans les statuts, false si acte séparé
  presidentEstAssocie: boolean // true si le président est l'associé unique
  dureeNomination?: string // "sans limitation de durée" ou durée spécifique
  remunerationFixee?: boolean
  descriptionRemuneration?: string
}

// Informations dépôt de fonds
export interface DepotFonds {
  date: string
  etablissement: string // Nom de la banque, notaire ou CDC
  typeDepositaire?: 'NOTAIRE' | 'BANQUE' | 'CDC'
  nomDepositaire?: string
  adresseDepositaire?: string
  numeroCompte?: string
}

// Nantissement de parts (OBSOLÈTE - non utilisé dans les templates actuels)
// Note: Cette interface est conservée pour compatibilité avec l'ancien template EURL v2
// Les templates actuels (EURL v3, SARL v1, SASU v1) ont tous un contenu fixe pour le nantissement
export interface Nantissement {
  agrementRequis: boolean // Si true, nantissement soumis à agrément
}

// Commissaires aux comptes
export interface CommissairesAuxComptes {
  obligatoire: boolean
  designes?: boolean // Si true, on désigne des commissaires dès la constitution (Articles 15 et 24)
  duree?: string // Durée du mandat (ex: "6 exercices")
  dateFinMandat?: string // Date de fin du mandat (ex: "31 décembre 2030")
  titulaire?: {
    nom: string
    prenom: string
    adresse: string
  }
  suppleant?: {
    nom: string
    prenom: string
    adresse: string
  }
}

// Conventions réglementées
export interface ConventionsReglementees {
  // Toujours présent dans les statuts, pas de paramétrage
  presente: boolean
}

// Clause compromissoire (optionnelle)
export interface ClauseCompromissoire {
  presente: boolean
  institutionArbitrage?: string // ex: "la Chambre de Commerce et d'Industrie"
  lieuArbitrage?: string // ex: "Paris"
}

// Actes en formation
export interface ActesFormation {
  presents: boolean
  liste?: string // Description des actes accomplis
}

// Option fiscale
export type OptionFiscale = 'IMPOT_SOCIETES' | 'IMPOT_REVENU'

// Dissolution et liquidation
export interface DissolutionLiquidation {
  causes: string[]
  liquidateur: string // ex: "le gérant" ou nom spécifique
  modalites: string
}

// Données complètes pour la rédaction des statuts (Version 3 - Conforme modèle de référence)
// Support EURL/SARL et SASU/SAS
export interface StatutsData {
  // SECTION 0: Associés
  // Pour EURL/SASU : associeUnique
  // Pour SARL/SAS : associes
  associeUnique?: AssocieUnique
  associes?: Associes

  // SECTION 1: Identité (pré-rempli depuis Dossier)
  formeJuridique: FormeJuridique
  denomination: string
  sigle?: string // Optionnel
  siegeSocial: string
  objetSocial: string

  // SECTION 2: Durée
  duree: number // en années, généralement 99

  // SECTION 3: Capital et apports (nouveau système détaillé)
  capitalSocial: number
  nombreParts: number // Pour EURL/SARL
  nombreActions?: number // Pour SASU/SAS
  valeurNominale: number
  apportDetaille: ApportDetaille // Remplace l'ancien système Apport[]
  depotFonds?: DepotFonds // Informations sur le dépôt de fonds

  // SECTION 4: Parts sociales (EURL/SARL) ou Actions (SASU/SAS)
  partsSociales: PartsSociales

  // SECTION 5: Nantissement supprimée - contenu fixe dans tous les templates actuels (EURL v3, SARL v1, SASU v1)

  // Variables SARL spécifiques
  droitPreferentielSouscription?: boolean // Article 8: Droit préférentiel de souscription en cas d'augmentation de capital
  repartitionVotesUsufruit?: 'NU_PROPRIETAIRE' | 'USUFRUITIER' | 'MIXTE' // Article 12: Répartition votes usufruit/nu-propriétaire

  // Variables SARL pour génération textes Articles 17 et 20 (Gérance)
  dureeMandat?: 'INDETERMINEE' | 'DETERMINEE' // Durée du mandat des gérants (SARL)
  anneesDureeMandat?: number // Nombre d'années si durée déterminée (SARL)
  reeligible?: boolean // Gérants rééligibles si durée déterminée (SARL)
  majoriteNomination?: 'LEGALE_AVEC_SECONDE' | 'LEGALE_SANS_SECONDE' | 'RENFORCEE_AVEC_SECONDE' | 'RENFORCEE_SANS_SECONDE' // SARL Article 17
  majoriteRevocation?: 'LEGALE_AVEC_SECONDE' | 'LEGALE_SANS_SECONDE' | 'RENFORCEE_AVEC_SECONDE' | 'RENFORCEE_SANS_SECONDE' // SARL Article 20
  niveauMajoriteRenforcee?: string // Ex: "deux tiers" (si majorité renforcée pour nomination)
  niveauMajoriteRevocation?: string // Ex: "deux tiers" (si différent de nomination)
  
  // Article 18 : Pouvoirs de la Gérance (SARL)
  majoriteLimitationsPouvoirs?: string // Majorité pour décisions soumises à autorisation
  listeLimitationsPouvoirs?: string // Liste détaillée des limitations
  cogerance?: boolean // Certains actes nécessitent plusieurs gérants
  listeActesCogerance?: string // Liste des actes en cogérance

  // SECTION 6: Gérance (EURL/SARL) ou Présidence (SASU/SAS)
  gerant?: Gerant // Pour EURL/SARL
  nominationGerant?: NominationGerant // Pour EURL/SARL - Article 30
  president?: President // Pour SASU/SAS
  nominationPresident?: NominationPresident // Pour SASU/SAS - Article 13

  // SECTION 7: Exercice social
  exerciceSocial: ExerciceSocial

  // SECTION 8: Commissaires aux comptes
  commissairesAuxComptes: CommissairesAuxComptes

  // SECTION 9: Conventions réglementées
  conventionsReglementees: ConventionsReglementees

  // SECTION 10: Options
  clauseCompromissoire?: ClauseCompromissoire // Optionnel pour SASU
  optionFiscale?: OptionFiscale // Pour EURL uniquement

  // SECTION 11: Actes en formation
  actesFormation: ActesFormation

  // Article 6.5 : Apports mariés/PACS
  conjointApport?: ConjointApport
  partenairePACS?: PartenairePACS

  // Article 11: Admission de nouveaux associés (EURL/SARL)
  admissionAssocies?: AdmissionAssocies

  // Article 11: Transmission des actions (SASU/SAS)
  transmissionActions?: TransmissionActions

  // Article 14-15: Gérance (majorités et délais) - EURL uniquement
  majoriteNominationGerant?: string // ex: "la moitié"
  majoriteRevocationGerant?: string // ex: "la moitié"
  delaiPreavisGerant?: number // en mois

  // Article 16: Limitations de pouvoirs
  limitationsPouvoirs?: boolean
  descriptionLimitationsPouvoirs?: string

  // Article 17-18: Décisions collectives (SASU/SAS)
  quorumDecisions?: string // ex: "50%" des droits de vote
  delaiConvocationAssemblee?: number // en jours
  delaiConsultationEcrite?: number // en jours
  signatairePV?: string // ex: "le Président" ou "le Président de séance"
  delaiInformationResultat?: number // en jours

  // Article 21: Comptes courants (optionnel pour SASU)
  compteCourant?: CompteCourant

  // Article 27 bis: Clause compromissoire
  delaiArbitrage?: number // en mois

  // Affectation des résultats (article 25)
  affectationResultats: AffectationResultats

  // Décisions de l'associé unique (article 22)
  modalitesDecisions: string

  // Transmission des parts (articles 10-11) - EURL/SARL
  transmissionParts?: TransmissionParts

  // Dissolution, liquidation (article 27)
  dissolutionLiquidation: DissolutionLiquidation

  // Formalités (article 29)
  formalites: {
    depot: string
    publicite: string
  }

  // Signature
  dateSignature?: string
  lieuSignature?: string
  
  // Variables de configuration supplémentaires (optionnelles, pour templates avancés)
  designationCAC_Obligatoire?: boolean
  formesDecisionsCollectives?: string
  decisionsOrdinaires?: string
  majoriteOrdinairesRenforcee?: string
  quorumExtraordinaire1?: string
  quorumExtraordinaire2?: string
  majoriteExtraordinaire?: string
  exerciceSocialCivil?: boolean
  dateCloturePremiereExercice?: string
  dateDebutExercice?: string
  dateFinExercice?: string
  rapportGestion?: string
  contenuRapportActivite?: string
  
  // Article 35: Nomination du premier Gérant (SARL)
  gerantsSARLIds?: string[] // IDs des associés désignés comme premiers gérants (pour SARL multi-associés)
  dureeGerantPremier?: string
  nomPrenomGerantPremier?: string
  adresseGerantPremier?: string
  nominationPremiersCAC?: boolean
  dureeCAC?: number
  dateFinMandatCAC?: string
  nomCACTitulaire?: string
  nomCACSuppléant?: string
  mandatairePostSignature?: string
  nombreExemplaires?: number
  nomAssocieSignature?: string
}

// Draft des statuts sauvegardé dans le dossier
export interface StatutsDraft {
  id: string
  dossierId: string
  formeJuridique: FormeJuridique
  data: Partial<StatutsData>
  progression: number // Pourcentage de complétion (0-100)
  sections: Record<StatutsSection, boolean>
  version: number
  createdAt: string
  updatedAt: string
  generatedDocumentUrl?: string
}

// Sections du formulaire (11 sections pour v2)
export type StatutsSection =
  | 'associe'
  | 'identite'
  | 'duree'
  | 'capital'
  | 'parts'
  // 'nantissement' supprimé - contenu fixe dans les templates
  | 'gerant'
  | 'exercice'
  | 'commissairesComptes'
  | 'conventions'
  | 'options'
  | 'actes'

export const STATUTS_SECTION_LABELS: Record<StatutsSection, string> = {
  associe: "Type d'associé unique",
  identite: 'Identité de la société',
  duree: 'Durée',
  capital: 'Capital et apports',
  parts: 'Parts sociales',
  // nantissement supprimé - contenu fixe dans les templates
  gerant: 'Gérance',
  exercice: 'Exercice social',
  commissairesComptes: 'Commissaires aux comptes',
  conventions: 'Conventions réglementées',
  options: 'Options (fiscale, arbitrage)',
  actes: 'Actes en formation',
}

// Labels pour les types d'apports
export const TYPE_APPORT_LABELS: Record<TypeApport, string> = {
  NUMERAIRE_TOTAL: 'Apport en numéraire (totalement libéré)',
  NUMERAIRE_PARTIEL: 'Apport en numéraire (partiellement libéré)',
  NATURE_SEUL: 'Apport en nature seul',
  MIXTE_NUMERAIRE_NATURE: 'Apport mixte (numéraire + nature)',
  FONDS_COMMERCE: 'Apport d\'un fonds de commerce',
  BIEN_COMMUN: 'Apport d\'un bien commun (marié)',
  PACS_INDIVISION: 'Apport d\'un bien indivis (PACS)',
}

// Labels pour les régimes matrimoniaux
export const REGIME_MATRIMONIAL_LABELS: Record<RegimeMatrimonial, string> = {
  COMMUNAUTE_REDUITE_AUX_ACQUETS: 'Communauté réduite aux acquêts',
  SEPARATION_BIENS: 'Séparation de biens',
  COMMUNAUTE_UNIVERSELLE: 'Communauté universelle',
  PARTICIPATION_AUX_ACQUETS: 'Participation aux acquêts',
}

// Labels pour les options fiscales
export const OPTION_FISCALE_LABELS: Record<OptionFiscale, string> = {
  IMPOT_SOCIETES: 'Impôt sur les sociétés (IS)',
  IMPOT_REVENU: 'Impôt sur le revenu (IR)',
}

// Labels pour les régimes de cession (EURL/SARL)
export const REGIME_CESSION_LABELS: Record<RegimeCession, string> = {
  LIBRE_ENTRE_ASSOCIES: 'Libre entre associés, agrément pour famille et tiers',
  LIBRE_FAMILIAL: 'Libre pour la famille, agrément pour associés et tiers',
  LIBRE_ASSOCIES_FAMILIAL: 'Libre entre associés et famille, agrément pour tiers (régime légal)',
  AGREMENT_TOTAL: 'Agrément pour toutes les cessions',
}

// Labels pour les régimes de cession d'actions (SASU/SAS)
export const REGIME_CESSION_ACTIONS_LABELS: Record<RegimeCessionActions, string> = {
  LIBRE: 'Cession libre (même en cas de pluralité d\'associés)',
  AGREMENT_PLURIPERSONNELLE: 'Cession libre en unipersonnelle, agrément si pluralité d\'associés',
}

// Template de clause pour les statuts
export interface ClauseTemplate {
  id: string
  section: StatutsSection
  titre: string
  contenu: string // Contenu avec variables {{variable}}
  variables: string[] // Liste des variables utilisées
  formeJuridique: FormeJuridique[] // Formes juridiques concernées
  obligatoire: boolean
  ordre: number
}
