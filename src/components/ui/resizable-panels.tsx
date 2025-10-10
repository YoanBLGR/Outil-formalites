import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ResizablePanelsProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  defaultLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
  className?: string
  showRightPanel?: boolean
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minLeftWidth = 30,
  maxLeftWidth = 70,
  className,
  showRightPanel = true,
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
        setLeftWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, minLeftWidth, maxLeftWidth])

  return (
    <div ref={containerRef} className={cn('flex h-full', className)}>
      {/* Left panel */}
      <div
        style={{
          width: showRightPanel ? `${leftWidth}%` : '100%',
          transition: isDragging ? 'none' : 'width 0.2s ease',
        }}
        className="flex-shrink-0"
      >
        {leftPanel}
      </div>

      {/* Resize handle */}
      {showRightPanel && (
        <div
          className={cn(
            'w-1 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center group transition-colors',
            isDragging && 'bg-primary'
          )}
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-6 w-6 text-primary-foreground bg-primary rounded px-0.5" />
          </div>
        </div>
      )}

      {/* Right panel */}
      {showRightPanel && (
        <div className="flex-1">
          {rightPanel}
        </div>
      )}
    </div>
  )
}
