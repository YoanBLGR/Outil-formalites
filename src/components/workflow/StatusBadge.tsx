import { Badge } from '../ui/badge'
import type { WorkflowStatus } from '../../types'
import { WORKFLOW_STATUS_LABELS } from '../../types'

interface StatusBadgeProps {
  status: WorkflowStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = (status: WorkflowStatus) => {
    switch (status) {
      case 'NOUVEAU':
        return 'info'
      case 'DEVIS_ENVOYE':
      case 'PROJET_STATUTS':
      case 'ATTENTE_DEPOT':
        return 'warning'
      case 'DEPOT_VALIDE':
      case 'PREP_RDV':
      case 'RDV_SIGNE':
      case 'FORMALITE_SAISIE':
      case 'SUIVI':
        return 'default'
      case 'CLOTURE':
        return 'success'
      default:
        return 'outline'
    }
  }

  return (
    <Badge variant={getVariant(status)}>
      {WORKFLOW_STATUS_LABELS[status]}
    </Badge>
  )
}
