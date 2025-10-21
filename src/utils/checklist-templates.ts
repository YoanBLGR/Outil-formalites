import type { ChecklistItem, FormeJuridique, ChecklistCategory } from '../types'
import { v4 as uuidv4 } from 'uuid'

export const CHECKLIST_CATEGORY_CONFIG = {
  PREPARATION: {
    label: 'Préparation',
    description: 'Collecte des informations et devis',
    icon: '📋',
    color: 'blue',
  },
  REDACTION: {
    label: 'Rédaction',
    description: 'Rédaction et envoi des documents',
    icon: '✍️',
    color: 'purple',
  },
  DOCUMENTS: {
    label: 'Documents',
    description: 'Réception des documents officiels',
    icon: '📄',
    color: 'green',
  },
  SIGNATURE: {
    label: 'Signature',
    description: 'Signature et annonce légale',
    icon: '✒️',
    color: 'orange',
  },
  FORMALITES: {
    label: 'Formalités',
    description: 'Démarches administratives',
    icon: '🏛️',
    color: 'red',
  },
}

export function generateChecklist(formeJuridique: FormeJuridique): ChecklistItem[] {
  const baseChecklist: Omit<ChecklistItem, 'id'>[] = [
    // PREPARATION
    {
      label: 'Informations société collectées',
      description: 'Dénomination, siège social, capital, objet social',
      completed: false,
      required: true,
      category: 'PREPARATION',
      icon: '🏢',
    },
    {
      label: 'Informations gérant/président collectées',
      description: 'État civil, adresse, nationalité',
      completed: false,
      required: true,
      category: 'PREPARATION',
      icon: '👤',
    },
    {
      label: 'Devis signé reçu',
      description: 'Devis accepté et retourné signé',
      completed: false,
      required: true,
      category: 'PREPARATION',
      icon: '💰',
    },
    // REDACTION
    {
      label: 'Projet de statuts rédigé',
      description: 'Statuts rédigés selon les informations fournies',
      completed: false,
      required: true,
      category: 'REDACTION',
      icon: '📝',
    },
    {
      label: 'Projet de statuts envoyé au client',
      description: 'Projet transmis pour validation',
      completed: false,
      required: true,
      category: 'REDACTION',
      icon: '📤',
    },
    // DOCUMENTS
    {
      label: 'Attestation de dépôt des fonds reçue',
      description: 'Preuve du dépôt du capital social',
      completed: false,
      required: true,
      category: 'DOCUMENTS',
      icon: '🏦',
    },
    {
      label: 'CNI gérant/président reçue',
      description: 'Copie recto-verso de la carte d\'identité',
      completed: false,
      required: true,
      category: 'DOCUMENTS',
      icon: '🪪',
    },
    {
      label: 'Déclaration de non condamnation reçue',
      description: 'Déclaration sur l\'honneur signée',
      completed: false,
      required: true,
      category: 'DOCUMENTS',
      icon: '📋',
    },
    {
      label: 'Justificatif d\'occupation du siège reçu',
      description: 'Bail, titre de propriété ou attestation',
      completed: false,
      required: true,
      category: 'DOCUMENTS',
      icon: '🏠',
    },
    // SIGNATURE
    {
      label: 'Statuts signés',
      description: 'Statuts définitifs paraphés et signés',
      completed: false,
      required: true,
      category: 'SIGNATURE',
      icon: '✍️',
    },
    {
      label: 'Annonce légale rédigée',
      description: 'Rédaction de l\'avis de constitution',
      completed: false,
      required: true,
      category: 'SIGNATURE',
      icon: '📰',
    },
    {
      label: 'Annonce légale publiée',
      description: 'Publication dans un journal habilité',
      completed: false,
      required: true,
      category: 'SIGNATURE',
      icon: '📢',
    },
    {
      label: 'Attestation de parution reçue',
      description: 'Justificatif de publication',
      completed: false,
      required: true,
      category: 'SIGNATURE',
      icon: '📜',
    },
    // FORMALITES
    {
      label: 'Recueil d\'informations',
      description: 'Collecte des informations pour la déclaration',
      completed: false,
      required: true,
      category: 'FORMALITES',
      icon: '📋',
    },
    {
      label: 'Formalité saisie sur le Guichet Unique',
      description: 'Dossier déposé en ligne sur le guichet unique',
      completed: false,
      required: true,
      category: 'FORMALITES',
      icon: '💻',
    },
    {
      label: 'Dossier transmis au greffe',
      description: 'Confirmation de transmission au greffe compétent',
      completed: false,
      required: true,
      category: 'FORMALITES',
      icon: '⚖️',
    },
  ]

  // Ajouter la liste des souscripteurs pour SAS/SASU
  if (formeJuridique === 'SAS' || formeJuridique === 'SASU') {
    baseChecklist.splice(9, 0, {
      label: 'Liste des souscripteurs établie',
      description: 'Liste complète des souscripteurs avec montants',
      completed: false,
      required: true,
      category: 'DOCUMENTS',
      icon: '📊',
      formeJuridique: ['SAS', 'SASU'],
    })
  }

  return baseChecklist.map((item) => ({
    ...item,
    id: uuidv4(),
  }))
}

export function getChecklistProgress(items: ChecklistItem[]): {
  total: number
  completed: number
  byCategory: Record<ChecklistCategory, { total: number; completed: number }>
} {
  const byCategory: Record<ChecklistCategory, { total: number; completed: number }> = {
    PREPARATION: { total: 0, completed: 0 },
    REDACTION: { total: 0, completed: 0 },
    DOCUMENTS: { total: 0, completed: 0 },
    SIGNATURE: { total: 0, completed: 0 },
    FORMALITES: { total: 0, completed: 0 },
  }

  items.forEach((item) => {
    // Vérification de sécurité : ignorer les items sans catégorie ou avec catégorie invalide
    if (!item.category || !byCategory[item.category as ChecklistCategory]) {
      // Catégorie par défaut pour les anciens items sans catégorie
      const defaultCategory: ChecklistCategory = 'PREPARATION'
      if (byCategory[defaultCategory]) {
        byCategory[defaultCategory].total++
        if (item.completed) {
          byCategory[defaultCategory].completed++
        }
      }
      return
    }

    byCategory[item.category as ChecklistCategory].total++
    if (item.completed) {
      byCategory[item.category as ChecklistCategory].completed++
    }
  })

  const total = items.length
  const completed = items.filter((item) => item.completed).length

  return { total, completed, byCategory }
}
