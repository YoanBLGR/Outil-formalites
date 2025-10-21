import React from 'react'
import { Input } from './input'
import { Textarea } from './textarea'

interface TrackedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName?: string
  onFieldChange?: (fieldName: string, value: string) => void
  onFieldFocus?: (fieldName: string, value: string) => void
  onFieldBlur?: () => void
}

interface TrackedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldName?: string
  onFieldChange?: (fieldName: string, value: string) => void
  onFieldFocus?: (fieldName: string, value: string) => void
  onFieldBlur?: () => void
}

export const TrackedInput = React.forwardRef<HTMLInputElement, TrackedInputProps>(
  ({ fieldName, onFieldChange, onFieldFocus, onFieldBlur, onChange, onFocus, onBlur, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      if (fieldName) onFieldChange?.(fieldName, e.target.value)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e)
      if (fieldName) onFieldFocus?.(fieldName, e.target.value)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e)
      onFieldBlur?.()
    }

    return (
      <Input
        ref={ref}
        {...props}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    )
  }
)

TrackedInput.displayName = 'TrackedInput'

export const TrackedTextarea = React.forwardRef<HTMLTextAreaElement, TrackedTextareaProps>(
  ({ fieldName, onFieldChange, onFieldFocus, onFieldBlur, onChange, onFocus, onBlur, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e)
      if (fieldName) onFieldChange?.(fieldName, e.target.value)
    }

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      onFocus?.(e)
      if (fieldName) onFieldFocus?.(fieldName, e.target.value)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      onBlur?.(e)
      onFieldBlur?.()
    }

    return (
      <Textarea
        ref={ref}
        {...props}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    )
  }
)

TrackedTextarea.displayName = 'TrackedTextarea'

