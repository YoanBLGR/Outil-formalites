import type { DocumentGUChecklistItem, FormeJuridique, DocumentType } from '../types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Configuration des documents requis pour le Guichet Unique
 */
const DOCUMENTS_GU_CONFIG: Array<{
  documentType: DocumentType
  label: string
  description: string
  icon: string
  required: boolean
  formeJuridique?: FormeJuridique[]
  ordre: number
}> = [
  {
    documentType: 'STATUTS',
    label: 'Statuts signés',
    description: 'Statuts de la société paraphés et signés par tous les associés',
    icon: '📜',
    required: true,
    ordre: 1,
  },
  {
    documentType: 'CNI',
    label: 'CNI des dirigeants',
    description: 'Copie recto-verso de la carte d\'identité de chaque dirigeant',
    icon: '🪪',
    required: true,
    ordre: 2,
  },
  {
    documentType: 'DECLARATION_NON_CONDAMNATION',
    label: 'Déclaration de non condamnation',
    description: 'Déclaration sur l\'honneur de non condamnation signée par chaque dirigeant',
    icon: '✍️',
    required: true,
    ordre: 3,
  },
  {
    documentType: 'ATTESTATION_DEPOT_FONDS',
    label: 'Attestation de dépôt des fonds',
    description: 'Certificat du dépositaire attestant du dépôt du capital social',
    icon: '🏦',
    required: true,
    ordre: 4,
  },
  {
    documentType: 'LISTE_SOUSCRIPTEURS',
    label: 'Liste des souscripteurs',
    description: 'Liste complète des souscripteurs avec montants souscrits et libérés',
    icon: '📊',
    required: true,
    formeJuridique: ['SASU', 'SAS'],
    ordre: 5,
  },
  {
    documentType: 'JUSTIFICATIF_SIEGE',
    label: 'Justificatif d\'occupation du siège',
    description: 'Bail commercial, titre de propriété, ou facture d\'eau/électricité de moins de 3 mois',
    icon: '🏠',
    required: true,
    ordre: 6,
  },
  {
    documentType: 'ATTESTATION_ANNONCE_LEGALE',
    label: 'Attestation de parution de l\'annonce légale',
    description: 'Justificatif de publication de l\'avis de constitution dans un journal habilité',
    icon: '📰',
    required: true,
    ordre: 7,
  },
  {
    documentType: 'MANDAT',
    label: 'Mandat',
    description: 'Mandat de dépôt du dossier au greffe (si nécessaire)',
    icon: '✉️',
    required: true,
    ordre: 8,
  },
]

/**
 * Génère la checklist des documents GU pour une forme juridique donnée
 */
export function generateDocumentsGUChecklist(
  formeJuridique: FormeJuridique
): DocumentGUChecklistItem[] {
  return DOCUMENTS_GU_CONFIG.filter((doc) => {
    // Si le document a une restriction de forme juridique, vérifier qu'elle correspond
    if (doc.formeJuridique && !doc.formeJuridique.includes(formeJuridique)) {
      return false
    }
    return true
  })
    .sort((a, b) => a.ordre - b.ordre)
    .map((doc) => ({
      id: uuidv4(),
      documentType: doc.documentType,
      label: doc.label,
      description: doc.description,
      icon: doc.icon,
      required: doc.required,
      completed: false,
      formeJuridique: doc.formeJuridique,
    }))
}

/**
 * Calcule la progression de la checklist GU
 */
export function getDocumentsGUProgress(items: DocumentGUChecklistItem[]): {
  total: number
  completed: number
  percentage: number
  required: {
    total: number
    completed: number
  }
} {
  const total = items.length
  const completed = items.filter((item) => item.completed).length
  const requiredItems = items.filter((item) => item.required)
  const requiredCompleted = requiredItems.filter((item) => item.completed).length

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    required: {
      total: requiredItems.length,
      completed: requiredCompleted,
    },
  }
}

/**
 * Vérifie si tous les documents requis sont complétés
 */
export function areAllRequiredDocumentsCompleted(items: DocumentGUChecklistItem[]): boolean {
  return items.filter((item) => item.required).every((item) => item.completed)
}

/**
 * Obtient les documents manquants (requis non complétés)
 */
export function getMissingRequiredDocuments(items: DocumentGUChecklistItem[]): DocumentGUChecklistItem[] {
  return items.filter((item) => item.required && !item.completed)
}

/**
 * Recherche un item de la checklist par type de document
 */
export function findChecklistItemByDocumentType(
  items: DocumentGUChecklistItem[],
  documentType: DocumentType
): DocumentGUChecklistItem | undefined {
  return items.find((item) => item.documentType === documentType)
}

/**
 * Met à jour un item de la checklist GU
 */
export function updateChecklistGUItem(
  items: DocumentGUChecklistItem[],
  itemId: string,
  updates: Partial<DocumentGUChecklistItem>
): DocumentGUChecklistItem[] {
  return items.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        ...updates,
        completedAt: updates.completed && !item.completed ? new Date().toISOString() : item.completedAt,
      }
    }
    return item
  })
}

/**
 * Marque un document comme lié à un upload
 */
export function linkDocumentToChecklistItem(
  items: DocumentGUChecklistItem[],
  documentType: DocumentType,
  documentId: string
): DocumentGUChecklistItem[] {
  return items.map((item) => {
    if (item.documentType === documentType) {
      return {
        ...item,
        linkedDocumentId: documentId,
        completed: true,
        completedAt: new Date().toISOString(),
      }
    }
    return item
  })
}
