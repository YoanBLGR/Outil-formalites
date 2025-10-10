import { Button } from '../ui/button'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  isLastStep: boolean
  nextButtonText?: string
  previousButtonText?: string
  completeButtonText?: string
  className?: string
  errors?: string[]
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onComplete,
  canGoNext,
  canGoPrevious,
  isLastStep,
  nextButtonText = 'Suivant',
  previousButtonText = 'Précédent',
  completeButtonText = 'Finaliser',
  className,
  errors = [],
}: WizardNavigationProps) {
  const hasErrors = errors.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Error summary */}
      {hasErrors && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <h4 className="text-sm font-semibold text-destructive mb-2">
            Veuillez corriger les erreurs suivantes :
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-destructive/80">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="min-w-[120px]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {previousButtonText}
        </Button>

        <div className="flex-1 text-center">
          <p className="text-xs text-muted-foreground">
            Étape {currentStep + 1} sur {totalSteps}
          </p>
        </div>

        {isLastStep ? (
          <Button
            type="button"
            onClick={onComplete}
            disabled={!canGoNext || hasErrors}
            className="min-w-[120px]"
          >
            <Check className="mr-2 h-4 w-4" />
            {completeButtonText}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || hasErrors}
            className="min-w-[120px]"
          >
            {nextButtonText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
