import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Step } from './stepper'

interface StepperCompactProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  allowClickNavigation?: boolean
  className?: string
}

export function StepperCompact({
  steps,
  currentStep,
  onStepClick,
  allowClickNavigation = true,
  className,
}: StepperCompactProps) {
  const handleStepClick = (index: number) => {
    if (allowClickNavigation && onStepClick && index <= currentStep) {
      onStepClick(index)
    }
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isClickable = allowClickNavigation && index <= currentStep

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => handleStepClick(index)}
            disabled={!isClickable}
            className={cn(
              'group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-xs font-medium',
              isCurrent && 'bg-primary text-primary-foreground',
              isCompleted && !isCurrent && 'bg-primary/10 text-primary hover:bg-primary/20',
              !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
              isClickable && 'cursor-pointer',
              !isClickable && 'cursor-not-allowed opacity-50'
            )}
            title={step.description}
          >
            {/* Circle/number */}
            <span
              className={cn(
                'flex items-center justify-center w-5 h-5 rounded-full border transition-all',
                isCompleted && 'bg-primary border-primary text-primary-foreground',
                isCurrent && 'border-primary-foreground',
                !isCompleted && !isCurrent && 'border-current'
              )}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="text-[10px] font-semibold">{index + 1}</span>
              )}
            </span>

            {/* Label - hidden on small screens */}
            <span className="hidden sm:inline whitespace-nowrap">{step.title}</span>
          </button>
        )
      })}
    </div>
  )
}
