import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  compact?: boolean
}

export function Layout({ children, title, subtitle, compact = false }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {!compact && <Header title={title} subtitle={subtitle} />}
        <main className={compact ? "flex-1 overflow-y-auto p-4" : "flex-1 overflow-y-auto p-8"}>
          {children}
        </main>
      </div>
    </div>
  )
}
