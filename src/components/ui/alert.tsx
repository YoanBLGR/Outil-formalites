import React from 'react'
import { cn } from '../../lib/utils'

interface AlertProps {
  children: React.ReactNode
  variant?: 'default' | 'destructive'
  className?: string
}

export function Alert({ children, variant = 'default', className }: AlertProps) {
  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4',
        variant === 'destructive'
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-border bg-background',
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">{children}</div>
    </div>
  )
}

interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return <div className={cn('text-sm flex-1', className)}>{children}</div>
}
