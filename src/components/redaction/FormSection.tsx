import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FormSectionProps {
  title: string
  subtitle?: string
  completed: boolean
  children: ReactNode
  defaultOpen?: boolean
  sectionId?: string
  onSectionClick?: (sectionId: string) => void
  required?: boolean
  hasErrors?: boolean
}

export function FormSection({
  title,
  subtitle,
  completed,
  children,
  defaultOpen = false,
  sectionId,
  onSectionClick,
  required = false,
  hasErrors = false,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [justCompleted, setJustCompleted] = useState(false)

  // Animation quand la section devient complétée
  useEffect(() => {
    if (completed && !justCompleted) {
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 2000)
    }
  }, [completed, justCompleted])

  const handleClick = () => {
    setIsOpen(!isOpen)
    if (sectionId && onSectionClick) {
      onSectionClick(sectionId)
    }
  }

  return (
    <div className={cn(
      'group relative border rounded-xl transition-all duration-300 bg-card',
      'hover:shadow-md hover:border-primary/20',
      justCompleted && 'ring-2 ring-green-500 shadow-lg shadow-green-500/20',
      hasErrors && 'border-destructive/50 shadow-sm shadow-destructive/10',
      completed && !justCompleted && 'border-green-500/50',
      isOpen && 'shadow-md'
    )}>
      <button
        onClick={handleClick}
        className={cn(
          'w-full p-4 flex items-center justify-between transition-all duration-200',
          'hover:bg-accent/50',
          isOpen && 'bg-accent/30'
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          {completed ? (
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 transition-all',
              justCompleted && 'scale-125 bg-green-500/20'
            )}>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          ) : hasErrors ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted transition-all group-hover:bg-primary/10">
              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          )}
          <div className="text-left flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "font-semibold transition-colors",
                isOpen ? "text-primary" : "text-foreground"
              )}>{title}</h3>
              {required && !completed && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-destructive/10 to-destructive/5 text-destructive border border-destructive/20">
                  Requis
                </span>
              )}
              {!required && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border">
                  Optionnel
                </span>
              )}
              {completed && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-500/10 to-green-500/5 text-green-700 dark:text-green-400 border border-green-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  Complété
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
          </div>
        </div>
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-all",
          isOpen ? "bg-primary/10 rotate-0" : "bg-transparent group-hover:bg-accent rotate-0"
        )}>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-primary transition-transform" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
      </button>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-5 border-t bg-gradient-to-b from-accent/20 to-transparent space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
