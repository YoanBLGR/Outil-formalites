import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TooltipProps {
  content: string | React.ReactNode
  children?: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  showIcon?: boolean
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  showIcon = true,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      let top = 0
      let left = 0

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          break
        case 'bottom':
          top = triggerRect.bottom + 8
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          break
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
          left = triggerRect.left - tooltipRect.width - 8
          break
        case 'right':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
          left = triggerRect.right + 8
          break
      }

      setCoords({ top, left })
    }
  }, [isVisible, position])

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex items-center justify-center transition-colors',
          showIcon && 'w-4 h-4 rounded-full hover:bg-muted',
          className
        )}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        onClick={(e) => {
          e.preventDefault()
          setIsVisible(!isVisible)
        }}
      >
        {children || <HelpCircle className="h-4 w-4 text-muted-foreground" />}
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 max-w-xs rounded-md bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md border',
            'animate-in fade-in-0 zoom-in-95'
          )}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-popover border rotate-45',
              position === 'top' && 'bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
              position === 'bottom' && 'top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
              position === 'left' && 'right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0',
              position === 'right' && 'left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
            )}
          />
        </div>
      )}
    </div>
  )
}

// Composant simplifié pour usage inline avec Label
export function FieldTooltip({ content }: { content: string }) {
  return <Tooltip content={content} position="top" />
}
