import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Step {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  allowClickNavigation?: boolean
  className?: string
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowClickNavigation = true,
  className,
}: StepperProps) {
  const handleStepClick = (index: number) => {
    if (allowClickNavigation && onStepClick && index <= currentStep) {
      onStepClick(index)
    }
  }

  return (
    <nav className={cn('w-full', className)} aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep
          const isClickable = allowClickNavigation && index <= currentStep

          return (
            <li
              key={step.id}
              className="relative flex-1 flex items-center"
            >
              {/* Connecting line */}
              {index !== 0 && (
                <div
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full -ml-[50%]',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step circle */}
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'relative flex flex-col items-center group z-10',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-not-allowed'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Circle with icon/number */}
                <span
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                    isCompleted &&
                      'bg-primary border-primary text-primary-foreground',
                    isCurrent &&
                      'bg-background border-primary text-primary ring-4 ring-primary/10',
                    isUpcoming &&
                      'bg-background border-muted text-muted-foreground',
                    isClickable && 'group-hover:border-primary group-hover:scale-105'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : step.icon ? (
                    <span className="scale-75">{step.icon}</span>
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </span>

                {/* Step label */}
                <span className="mt-1.5 text-center">
                  <span
                    className={cn(
                      'block text-xs font-medium transition-colors',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-foreground',
                      isUpcoming && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span
                      className={cn(
                        'hidden sm:block text-xs mt-0.5 transition-colors',
                        isCurrent && 'text-muted-foreground',
                        isCompleted && 'text-muted-foreground',
                        isUpcoming && 'text-muted-foreground/70'
                      )}
                    >
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Progress indicator for mobile
interface StepperProgressProps {
  currentStep: number
  totalSteps: number
  currentStepTitle: string
  className?: string
}

export function StepperProgress({
  currentStep,
  totalSteps,
  currentStepTitle,
  className,
}: StepperProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Étape {currentStep + 1} sur {totalSteps}
        </span>
        <span className="text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{currentStepTitle}</p>
    </div>
  )
}
