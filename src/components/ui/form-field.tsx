import { useState, useEffect } from 'react'
import { Label } from './label'
import { Input, type InputProps } from './input'
import { Textarea } from './textarea'
import { Select } from './select'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: number | string | RegExp
  message: string
  validate?: (value: any) => boolean
}

interface BaseFormFieldProps {
  label: string
  name: string
  value: any
  onChange: (value: any) => void
  error?: string
  helperText?: string
  required?: boolean
  optional?: boolean
  tooltip?: string
  validationRules?: ValidationRule[]
  showValidation?: boolean
  className?: string
}

interface FormFieldInputProps extends BaseFormFieldProps {
  type: 'input'
  inputType?: InputProps['type']
  placeholder?: string
  inputProps?: Omit<InputProps, 'value' | 'onChange' | 'type'>
}

interface FormFieldTextareaProps extends BaseFormFieldProps {
  type: 'textarea'
  placeholder?: string
  rows?: number
}

interface FormFieldSelectProps extends BaseFormFieldProps {
  type: 'select'
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

type FormFieldProps = FormFieldInputProps | FormFieldTextareaProps | FormFieldSelectProps

export function FormField(props: FormFieldProps) {
  const {
    label,
    name,
    value,
    onChange,
    error: externalError,
    helperText,
    required = false,
    optional = false,
    tooltip,
    validationRules = [],
    showValidation = true,
    className,
  } = props

  const [internalError, setInternalError] = useState<string | undefined>()
  const [touched, setTouched] = useState(false)
  const [isValid, setIsValid] = useState(false)

  // Validation
  useEffect(() => {
    if (!showValidation || !touched) return

    const errors = validateField(value, validationRules, required)
    if (errors.length > 0) {
      setInternalError(errors[0])
      setIsValid(false)
    } else {
      setInternalError(undefined)
      setIsValid(!!value)
    }
  }, [value, validationRules, required, showValidation, touched])

  const handleBlur = () => {
    setTouched(true)
  }

  const handleChange = (newValue: any) => {
    onChange(newValue)
    if (!touched) {
      setTouched(true)
    }
  }

  const displayError = externalError || (touched && internalError)
  const showSuccess = touched && !displayError && isValid && showValidation

  return (
    <div className={cn('space-y-2.5', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="flex items-center gap-2 font-medium text-sm">
          {label}
          {required && <span className="text-destructive text-sm font-semibold">*</span>}
          {optional && !required && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border">
              Optionnel
            </span>
          )}
          {tooltip && (
            <button
              type="button"
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 hover:bg-primary/20 transition-all hover:scale-110"
              title={tooltip}
            >
              <span className="text-xs text-primary font-medium">?</span>
            </button>
          )}
        </Label>
        {showSuccess && (
          <div className="flex items-center gap-1.5 text-green-600 animate-in fade-in slide-in-from-right-1 duration-300">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Valide</span>
          </div>
        )}
      </div>

      {/* Input field */}
      <div className="relative group">
        {props.type === 'input' && (
          <Input
            id={name}
            type={props.inputType || 'text'}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={props.placeholder}
            className={cn(
              displayError && 'border-destructive focus-visible:ring-destructive bg-destructive/5',
              showSuccess && 'border-green-500 focus-visible:ring-green-500 bg-green-50/50 dark:bg-green-950/20'
            )}
            {...props.inputProps}
          />
        )}

        {props.type === 'textarea' && (
          <Textarea
            id={name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={props.placeholder}
            rows={props.rows || 3}
            className={cn(
              displayError && 'border-destructive focus-visible:ring-destructive bg-destructive/5',
              showSuccess && 'border-green-500 focus-visible:ring-green-500 bg-green-50/50 dark:bg-green-950/20'
            )}
          />
        )}

        {props.type === 'select' && (
          <Select
            id={name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={cn(
              displayError && 'border-destructive focus-visible:ring-destructive bg-destructive/5',
              showSuccess && 'border-green-500 focus-visible:ring-green-500 bg-green-50/50 dark:bg-green-950/20'
            )}
          >
            {props.placeholder && (
              <option value="" disabled>
                {props.placeholder}
              </option>
            )}
            {props.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* Helper text or error */}
      {displayError && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{displayError}</span>
        </div>
      )}
      {!displayError && helperText && (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5 px-1">
          <span className="text-primary">•</span>
          {helperText}
        </p>
      )}
    </div>
  )
}

// Helper de validation
function validateField(
  value: any,
  rules: ValidationRule[],
  required: boolean
): string[] {
  const errors: string[] = []

  // Check required
  if (required && (!value || value.toString().trim() === '')) {
    errors.push('Ce champ est requis')
    return errors // Return early if required field is empty
  }

  // Si vide et non requis, pas besoin de valider les autres règles
  if (!value || value.toString().trim() === '') {
    return errors
  }

  // Check other validation rules
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || value.toString().trim() === '') {
          errors.push(rule.message)
        }
        break

      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          errors.push(rule.message)
        }
        break

      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          errors.push(rule.message)
        }
        break

      case 'pattern':
        if (typeof value === 'string') {
          const regex = rule.value instanceof RegExp ? rule.value : new RegExp(rule.value as string)
          if (!regex.test(value)) {
            errors.push(rule.message)
          }
        }
        break

      case 'custom':
        if (rule.validate && !rule.validate(value)) {
          errors.push(rule.message)
        }
        break
    }
  }

  return errors
}
