import type { ChecklistItem, WorkflowStatus } from '../types'

/**
 * Règles de progression automatique des statuts basées sur la checklist
 */
export interface StatusRule {
  status: WorkflowStatus
  requiredItems: string[] // Labels des items requis
  description: string
}

/**
 * Définition des règles de progression pour chaque statut
 */
export const STATUS_RULES: StatusRule[] = [
  {
    status: 'NOUVEAU',
    requiredItems: [],
    description: 'Dossier créé',
  },
  {
    status: 'DEVIS_ENVOYE',
    requiredItems: ['Informations société collectées', 'Informations gérant/président collectées'],
    description: 'Informations collectées, prêt pour envoi du devis',
  },
  {
    status: 'PROJET_STATUTS',
    requiredItems: [
      'Informations société collectées',
      'Informations gérant/président collectées',
      'Devis signé reçu',
    ],
    description: 'Devis signé, rédaction du projet de statuts',
  },
  {
    status: 'ATTENTE_DEPOT',
    requiredItems: [
      'Informations société collectées',
      'Informations gérant/président collectées',
      'Devis signé reçu',
      'Projet de statuts rédigé',
      'Projet de statuts envoyé au client',
    ],
    description: 'Projet envoyé, attente du dépôt de capital',
  },
  {
    status: 'DEPOT_VALIDE',
    requiredItems: [
      'Informations société collectées',
      'Informations gérant/président collectées',
      'Devis signé reçu',
      'Projet de statuts rédigé',
      'Projet de statuts envoyé au client',
      'Attestation de dépôt des fonds reçue',
    ],
    description: 'Dépôt validé, collecte des documents',
  },
  {
    status: 'PREP_RDV',
    requiredItems: [
      'Informations société collectées',
      'Informations gérant/président collectées',
      'Devis signé reçu',
      'Projet de statuts rédigé',
      'Projet de statuts envoyé au client',
      'Attestation de dépôt des fonds reçue',
      "CNI gérant/président reçue",
      'Déclaration de non condamnation reçue',
      "Justificatif d'occupation du siège reçu",
    ],
    description: 'Documents collectés, préparation du rendez-vous de signature',
  },
  {
    status: 'RDV_SIGNE',
    requiredItems: [
      'Informations société collectées',
      'Informations gérant/président collectées',
      'Devis signé reçu',
      'Projet de statuts rédigé',
      'Projet de statuts envoyé au client',
      'Attestation de dépôt des fonds reçue',
      "CNI gérant/président reçue",
      'Déclaration de non condamnation reçue',
      "Justificatif d'occupation du siège reçu",
      'Statuts signés',
    ],
    description: 'Statuts signés, préparation des formalités',
  },
  {
    status: 'FORMALITE_SAISIE',
    requiredItems: [
      'Informations société collectées',
      'Informations gérant/président collectées',
      'Devis signé reçu',
      'Projet de statuts rédigé',
      'Projet de statuts envoyé au client',
      'Attestation de dépôt des fonds reçue',
      "CNI gérant/président reçue",
      'Déclaration de non condamnation reçue',
      "Justificatif d'occupation du siège reçu",
      'Statuts signés',
      'Annonce légale rédigée',
      'Annonce légale publiée',
      'Attestation de parution reçue',
      'Formulaire M0 complété',
      'Formalité saisie sur le Guichet Unique',
    ],
    description: 'Formalité saisie, dossier transmis au greffe',
  },
  {
    status: 'SUIVI',
    requiredItems: [
      'Informations société collectées',
      'Informations gérant/président collectées',
      'Devis signé reçu',
      'Projet de statuts rédigé',
      'Projet de statuts envoyé au client',
      'Attestation de dépôt des fonds reçue',
      "CNI gérant/président reçue",
      'Déclaration de non condamnation reçue',
      "Justificatif d'occupation du siège reçu",
      'Statuts signés',
      'Annonce légale rédigée',
      'Annonce légale publiée',
      'Attestation de parution reçue',
      'Formulaire M0 complété',
      'Formalité saisie sur le Guichet Unique',
      'Dossier transmis au greffe',
    ],
    description: 'Dossier transmis, en attente de retour du greffe',
  },
  {
    status: 'CLOTURE',
    requiredItems: [],
    description: 'Dossier clôturé',
  },
]

/**
 * Calcule le statut suggéré basé sur les items de checklist complétés
 */
export function calculateSuggestedStatus(checklist: ChecklistItem[]): WorkflowStatus | null {
  const completedLabels = new Set(
    checklist.filter((item) => item.completed).map((item) => item.label)
  )

  // Parcourir les règles du statut le plus avancé au moins avancé
  // Exclure CLOTURE qui est un statut manuel uniquement
  for (let i = STATUS_RULES.length - 2; i >= 0; i--) {
    const rule = STATUS_RULES[i]

    // Ignorer les statuts sans conditions (comme NOUVEAU et CLOTURE)
    if (rule.requiredItems.length === 0) {
      continue
    }

    const allRequiredCompleted = rule.requiredItems.every((label) =>
      completedLabels.has(label)
    )

    if (allRequiredCompleted) {
      return rule.status
    }
  }

  return 'NOUVEAU'
}

/**
 * Vérifie si un changement de statut est valide
 */
export function isValidStatusTransition(
  currentStatus: WorkflowStatus,
  newStatus: WorkflowStatus,
  checklist: ChecklistItem[]
): { valid: boolean; reason?: string } {
  // On peut toujours revenir en arrière
  const currentIndex = STATUS_RULES.findIndex((rule) => rule.status === currentStatus)
  const newIndex = STATUS_RULES.findIndex((rule) => rule.status === newStatus)

  if (newIndex < currentIndex) {
    return { valid: true }
  }

  // Pour aller en avant, vérifier que les conditions sont remplies
  const rule = STATUS_RULES.find((r) => r.status === newStatus)
  if (!rule) {
    return { valid: false, reason: 'Statut inconnu' }
  }

  const completedLabels = new Set(
    checklist.filter((item) => item.completed).map((item) => item.label)
  )

  const missingItems = rule.requiredItems.filter((label) => !completedLabels.has(label))

  if (missingItems.length > 0) {
    return {
      valid: false,
      reason: `Tâches manquantes : ${missingItems.slice(0, 3).join(', ')}${
        missingItems.length > 3 ? ` et ${missingItems.length - 3} autre(s)` : ''
      }`,
    }
  }

  return { valid: true }
}

/**
 * Obtient la prochaine étape logique basée sur le statut actuel
 */
export function getNextStatus(currentStatus: WorkflowStatus): WorkflowStatus | null {
  const currentIndex = STATUS_RULES.findIndex((rule) => rule.status === currentStatus)
  if (currentIndex === -1 || currentIndex === STATUS_RULES.length - 1) {
    return null
  }
  return STATUS_RULES[currentIndex + 1].status
}

/**
 * Obtient les tâches manquantes pour atteindre un statut
 */
export function getMissingTasksForStatus(
  targetStatus: WorkflowStatus,
  checklist: ChecklistItem[]
): string[] {
  const rule = STATUS_RULES.find((r) => r.status === targetStatus)
  if (!rule) return []

  const completedLabels = new Set(
    checklist.filter((item) => item.completed).map((item) => item.label)
  )

  return rule.requiredItems.filter((label) => !completedLabels.has(label))
}

/**
 * Obtient le pourcentage de complétion pour un statut donné
 */
export function getStatusCompletionPercentage(
  status: WorkflowStatus,
  checklist: ChecklistItem[]
): number {
  const rule = STATUS_RULES.find((r) => r.status === status)
  if (!rule || rule.requiredItems.length === 0) return 100

  const completedLabels = new Set(
    checklist.filter((item) => item.completed).map((item) => item.label)
  )

  const completedCount = rule.requiredItems.filter((label) =>
    completedLabels.has(label)
  ).length

  return Math.round((completedCount / rule.requiredItems.length) * 100)
}
