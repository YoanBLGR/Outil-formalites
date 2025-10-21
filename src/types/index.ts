import type { StatutsDraft } from './statuts'

export type FormeJuridique = 'EURL' | 'SARL' | 'SASU' | 'SAS'

export type WorkflowStatus =
  | 'NOUVEAU'
  | 'DEVIS_ENVOYE'
  | 'PROJET_STATUTS'
  | 'ATTENTE_DEPOT'
  | 'DEPOT_VALIDE'
  | 'PREP_RDV'
  | 'RDV_SIGNE'
  | 'FORMALITE_SAISIE'
  | 'SUIVI'
  | 'CLOTURE'

export type DocumentType =
  | 'CNI'
  | 'DECLARATION_NON_CONDAMNATION'
  | 'JUSTIFICATIF_SIEGE'
  | 'AUTORISATION_DOMICILIATION'
  | 'STATUTS'
  | 'LISTE_SOUSCRIPTEURS'
  | 'ATTESTATION_DEPOT_FONDS'
  | 'ATTESTATION_ANNONCE_LEGALE'
  | 'MANDAT'
  | 'AVIS_CONSTITUTION'
  | 'PROJET_STATUTS'
  | 'DEVIS'
  | 'AUTRE'

export type TimelineEventType =
  | 'CREATION'
  | 'STATUS_CHANGE'
  | 'DOCUMENT_UPLOAD'
  | 'COMMENT'
  | 'CHECKLIST_UPDATE'
  | 'AUTRE'

export interface Client {
  civilite: 'M' | 'Mme'
  nom: string
  prenom: string
  email: string
  telephone: string
}

export interface Societe {
  formeJuridique: FormeJuridique
  denomination: string
  siege: string
  capitalSocial?: number
  objetSocial?: string
}

export interface Document {
  id: string
  nom: string
  type: DocumentType
  categorie: string
  fichier: Blob
  uploadedAt: string
  uploadedBy: string
}

export type ChecklistCategory =
  | 'PREPARATION'
  | 'REDACTION'
  | 'DOCUMENTS'
  | 'SIGNATURE'
  | 'FORMALITES'

export interface ChecklistItem {
  id: string
  label: string
  description?: string
  completed: boolean
  required: boolean
  category?: ChecklistCategory // Optionnel pour rétrocompatibilité
  icon?: string
  dependsOn?: string[]
  formeJuridique?: FormeJuridique[]
  completedAt?: string
  completedBy?: string
}

export interface DocumentGUChecklistItem {
  id: string
  documentType: DocumentType
  label: string
  description?: string
  completed: boolean
  required: boolean
  icon: string
  formeJuridique?: FormeJuridique[]
  linkedDocumentId?: string // ID du document uploadé correspondant
  completedAt?: string
  completedBy?: string
  notes?: string
}

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  description: string
  createdAt: string
  createdBy: string
  metadata?: Record<string, unknown>
}

export interface GuichetUniqueData {
  formalityId: string // ID de la formalité sur le GU
  status: string // Statut de la formalité (DRAFT, SUBMITTED, etc.)
  createdAt: string // Date de création de la formalité
  url?: string // URL vers la formalité sur le portail GU
  reference?: string // Référence de la formalité
  lastSyncAt?: string // Dernière synchronisation avec le GU
}

export interface Dossier {
  id: string
  numero: string
  createdAt: string
  updatedAt: string
  client: Client
  societe: Societe
  statut: WorkflowStatus
  documents: Document[]
  checklist: ChecklistItem[]
  checklistDocumentsGU?: DocumentGUChecklistItem[] // Checklist spécifique documents GU
  timeline: TimelineEvent[]
  statutsDraft?: StatutsDraft
  guichetUnique?: GuichetUniqueData // Données de la formalité sur le Guichet Unique
}

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  NOUVEAU: 'Nouveau',
  DEVIS_ENVOYE: 'Devis envoyé',
  PROJET_STATUTS: 'Projet de statuts',
  ATTENTE_DEPOT: 'Attente dépôt capital',
  DEPOT_VALIDE: 'Dépôt validé',
  PREP_RDV: 'Préparation RDV',
  RDV_SIGNE: 'Statuts signés',
  FORMALITE_SAISIE: 'Formalité saisie',
  SUIVI: 'En suivi',
  CLOTURE: 'Clôturé',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CNI: 'CNI',
  DECLARATION_NON_CONDAMNATION: 'Déclaration de non condamnation',
  JUSTIFICATIF_SIEGE: 'Justificatif d\'occupation du siège',
  AUTORISATION_DOMICILIATION: 'Autorisation de domiciliation',
  STATUTS: 'Statuts',
  LISTE_SOUSCRIPTEURS: 'Liste des souscripteurs',
  ATTESTATION_DEPOT_FONDS: 'Attestation de dépôt des fonds',
  ATTESTATION_ANNONCE_LEGALE: 'Attestation de parution de l\'annonce légale',
  MANDAT: 'Mandat',
  AVIS_CONSTITUTION: 'Avis de constitution',
  PROJET_STATUTS: 'Projet de statuts',
  DEVIS: 'Devis',
  AUTRE: 'Autre',
}

export const DOCUMENT_CATEGORIES = {
  STATUTS: 'Statuts',
  KBIS: 'Extrait Kbis',
  IDENTITE: 'Pièce d\'identité',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  BAIL: 'Bail commercial',
  MANDAT: 'Mandat CCI',
  AVIS_CONSTITUTION: 'Avis de constitution',
  AUTRE: 'Autre',
} as const

export const FORME_JURIDIQUE_LABELS: Record<FormeJuridique, string> = {
  EURL: 'EURL',
  SARL: 'SARL',
  SASU: 'SASU',
  SAS: 'SAS',
}

// Types pour l'OCR et extraction de données CNI
export interface CNIData {
  nom: string
  prenom: string
  civilite?: 'M' | 'Mme'
  dateNaissance?: string
  lieuNaissance?: string
  confidence: number // 0-100%
}

export interface CNIFieldConfidence {
  nom: number
  prenom: number
  civilite: number
  dateNaissance: number
  lieuNaissance: number
}

export interface OCRResult {
  success: boolean
  data?: CNIData
  fieldConfidence?: CNIFieldConfidence
  rawText?: string
  error?: string
  processingTime?: number
}
