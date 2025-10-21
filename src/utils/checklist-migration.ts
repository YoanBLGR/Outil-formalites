import type { ChecklistItem, ChecklistCategory } from '../types'

/**
 * Règles de mapping pour assigner automatiquement une catégorie basée sur le label
 */
const LABEL_TO_CATEGORY_MAP: Record<string, ChecklistCategory> = {
  // PREPARATION
  'Informations société collectées': 'PREPARATION',
  'Informations gérant/président collectées': 'PREPARATION',
  'Devis signé reçu': 'PREPARATION',

  // REDACTION
  'Projet de statuts rédigé': 'REDACTION',
  'Projet de statuts envoyé au client': 'REDACTION',

  // DOCUMENTS
  'Attestation de dépôt des fonds reçue': 'DOCUMENTS',
  'CNI gérant/président reçue': 'DOCUMENTS',
  'Déclaration de non condamnation reçue': 'DOCUMENTS',
  "Justificatif d'occupation du siège reçu": 'DOCUMENTS',
  'Liste des souscripteurs établie': 'DOCUMENTS',

  // SIGNATURE
  'Statuts signés': 'SIGNATURE',
  'Annonce légale rédigée': 'SIGNATURE',
  'Annonce légale publiée': 'SIGNATURE',
  'Attestation de parution reçue': 'SIGNATURE',

  // FORMALITES
  'Recueil d\'informations': 'FORMALITES',
  'Formulaire M0 complété': 'FORMALITES', // Ancien label pour compatibilité
  'Formalité saisie sur le Guichet Unique': 'FORMALITES',
  'Dossier transmis au greffe': 'FORMALITES',
}

/**
 * Règles de mapping pour assigner une icône basée sur le label
 */
const LABEL_TO_ICON_MAP: Record<string, string> = {
  'Informations société collectées': '🏢',
  'Informations gérant/président collectées': '👤',
  'Devis signé reçu': '💰',
  'Projet de statuts rédigé': '📝',
  'Projet de statuts envoyé au client': '📤',
  'Attestation de dépôt des fonds reçue': '🏦',
  'CNI gérant/président reçue': '🪪',
  'Déclaration de non condamnation reçue': '📋',
  "Justificatif d'occupation du siège reçu": '🏠',
  'Liste des souscripteurs établie': '📊',
  'Statuts signés': '✒️',
  'Annonce légale rédigée': '📰',
  'Annonce légale publiée': '📢',
  'Attestation de parution reçue': '📜',
  'Recueil d\'informations': '📋',
  'Formulaire M0 complété': '📋', // Ancien label pour compatibilité
  'Formalité saisie sur le Guichet Unique': '💻',
  'Dossier transmis au greffe': '🏛️',
}

/**
 * Devine la catégorie d'un item basé sur son label
 */
function guessCategory(label: string): ChecklistCategory {
  // Recherche exacte
  if (LABEL_TO_CATEGORY_MAP[label]) {
    return LABEL_TO_CATEGORY_MAP[label]
  }

  // Recherche par mots-clés
  const lowerLabel = label.toLowerCase()

  if (lowerLabel.includes('information') || lowerLabel.includes('devis')) {
    return 'PREPARATION'
  }

  if (lowerLabel.includes('statut') && (lowerLabel.includes('rédig') || lowerLabel.includes('envoyé'))) {
    return 'REDACTION'
  }

  if (
    lowerLabel.includes('attestation') ||
    lowerLabel.includes('cni') ||
    lowerLabel.includes('justificatif') ||
    lowerLabel.includes('déclaration') ||
    lowerLabel.includes('liste')
  ) {
    return 'DOCUMENTS'
  }

  if (
    lowerLabel.includes('sign') ||
    lowerLabel.includes('annonce') ||
    lowerLabel.includes('parution')
  ) {
    return 'SIGNATURE'
  }

  if (
    lowerLabel.includes('formulaire') ||
    lowerLabel.includes('formalité') ||
    lowerLabel.includes('greffe') ||
    lowerLabel.includes('guichet')
  ) {
    return 'FORMALITES'
  }

  // Par défaut
  return 'PREPARATION'
}

/**
 * Devine l'icône d'un item basé sur son label
 */
function guessIcon(label: string): string {
  // Recherche exacte
  if (LABEL_TO_ICON_MAP[label]) {
    return LABEL_TO_ICON_MAP[label]
  }

  // Icônes par défaut basées sur les mots-clés
  const lowerLabel = label.toLowerCase()

  if (lowerLabel.includes('document') || lowerLabel.includes('attestation')) return '📄'
  if (lowerLabel.includes('sign')) return '✍️'
  if (lowerLabel.includes('envoi') || lowerLabel.includes('envoyé')) return '📤'
  if (lowerLabel.includes('reçu')) return '📥'
  if (lowerLabel.includes('statut')) return '📝'
  if (lowerLabel.includes('annonce')) return '📰'
  if (lowerLabel.includes('greffe') || lowerLabel.includes('guichet')) return '🏛️'

  return '✅' // Icône par défaut
}

/**
 * Migre un item de checklist vers le nouveau format avec catégorie et icône
 */
export function migrateChecklistItem(item: ChecklistItem): ChecklistItem {
  // Si l'item a déjà une catégorie et une icône, le retourner tel quel
  if (item.category && item.icon) {
    return item
  }

  return {
    ...item,
    category: item.category || guessCategory(item.label),
    icon: item.icon || guessIcon(item.label),
  }
}

/**
 * Migre une liste complète d'items de checklist
 */
export function migrateChecklist(items: ChecklistItem[]): ChecklistItem[] {
  return items.map(migrateChecklistItem)
}

/**
 * Vérifie si une checklist nécessite une migration
 */
export function needsMigration(items: ChecklistItem[]): boolean {
  return items.some((item) => !item.category || !item.icon)
}

/**
 * Obtient des statistiques sur la migration
 */
export function getMigrationStats(items: ChecklistItem[]): {
  total: number
  needsMigration: number
  byCategory: Record<ChecklistCategory, number>
} {
  const stats = {
    total: items.length,
    needsMigration: 0,
    byCategory: {
      PREPARATION: 0,
      REDACTION: 0,
      DOCUMENTS: 0,
      SIGNATURE: 0,
      FORMALITES: 0,
    } as Record<ChecklistCategory, number>,
  }

  items.forEach((item) => {
    if (!item.category || !item.icon) {
      stats.needsMigration++
    }
    const category = item.category || guessCategory(item.label)
    stats.byCategory[category]++
  })

  return stats
}
