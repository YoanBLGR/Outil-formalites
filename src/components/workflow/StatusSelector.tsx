import { useState } from 'react'
import { Check, AlertCircle, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import type { WorkflowStatus, ChecklistItem } from '../../types'
import { WORKFLOW_STATUS_LABELS } from '../../types'
import {
  calculateSuggestedStatus,
  isValidStatusTransition,
  getMissingTasksForStatus,
  getStatusCompletionPercentage,
  STATUS_RULES,
} from '../../utils/status-helpers'

interface StatusSelectorProps {
  currentStatus: WorkflowStatus
  checklist: ChecklistItem[]
  onStatusChange: (newStatus: WorkflowStatus) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StatusSelector({
  currentStatus,
  checklist,
  onStatusChange,
  open,
  onOpenChange,
}: StatusSelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus>(currentStatus)
  const suggestedStatus = calculateSuggestedStatus(checklist)
  const validation = isValidStatusTransition(currentStatus, selectedStatus, checklist)

  const handleConfirm = () => {
    if (validation.valid) {
      onStatusChange(selectedStatus)
      onOpenChange(false)
    }
  }

  const handleApplySuggestion = () => {
    if (suggestedStatus) {
      setSelectedStatus(suggestedStatus)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le statut du dossier</DialogTitle>
          <DialogDescription>
            Choisissez le nouveau statut pour ce dossier. Les statuts sont automatiquement suggérés en fonction de la checklist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Suggestion automatique */}
          {suggestedStatus && suggestedStatus !== currentStatus && (
            <Alert className="bg-blue-50 border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Suggestion automatique</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Basé sur votre checklist, nous suggérons : <strong>{WORKFLOW_STATUS_LABELS[suggestedStatus]}</strong>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleApplySuggestion}
                  className="ml-4 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Appliquer
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Sélection du statut */}
          <div className="space-y-3">
            <Label className="text-base">Nouveau statut</Label>
            <div className="grid gap-2">
              {STATUS_RULES.map((rule) => {
                const completion = getStatusCompletionPercentage(rule.status, checklist)
                const isCurrent = rule.status === currentStatus
                const isSelected = rule.status === selectedStatus
                const missingTasks = getMissingTasksForStatus(rule.status, checklist)
                const isAccessible = missingTasks.length === 0

                return (
                  <button
                    key={rule.status}
                    type="button"
                    onClick={() => setSelectedStatus(rule.status)}
                    disabled={isCurrent}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : isCurrent
                        ? 'border-muted bg-muted/50 cursor-not-allowed'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Indicateur */}
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : isCurrent
                            ? 'bg-muted-foreground border-muted-foreground'
                            : 'border-border'
                        }`}
                      >
                        {(isSelected || isCurrent) && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {WORKFLOW_STATUS_LABELS[rule.status]}
                          </span>
                          {isCurrent && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              Actuel
                            </span>
                          )}
                          {rule.status === suggestedStatus && !isCurrent && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Suggéré
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rule.description}
                        </p>

                        {/* Barre de progression */}
                        {rule.requiredItems.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progression</span>
                              <span
                                className={`font-medium ${
                                  completion === 100
                                    ? 'text-green-600'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {completion}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  completion === 100
                                    ? 'bg-green-500'
                                    : completion > 50
                                    ? 'bg-blue-500'
                                    : 'bg-yellow-500'
                                }`}
                                style={{ width: `${completion}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Tâches manquantes */}
                        {!isAccessible && missingTasks.length > 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <p className="font-medium text-yellow-900 mb-1">
                              Tâches manquantes ({missingTasks.length}) :
                            </p>
                            <ul className="space-y-0.5 text-yellow-800">
                              {missingTasks.slice(0, 3).map((task, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>{task}</span>
                                </li>
                              ))}
                              {missingTasks.length > 3 && (
                                <li className="text-yellow-700 italic">
                                  ... et {missingTasks.length - 3} autre(s)
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Avertissement si transition invalide */}
          {!validation.valid && selectedStatus !== currentStatus && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Transition non valide</p>
                <p className="text-sm mt-1">{validation.reason}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!validation.valid || selectedStatus === currentStatus}
          >
            Confirmer le changement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
