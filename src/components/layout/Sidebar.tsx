import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

export function Sidebar() {
  const location = useLocation()

  const navItems = [
    {
      title: 'Tableau de bord',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      title: 'Dossiers',
      href: '/dossiers',
      icon: FolderOpen,
    },
  ]

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Formalyse</h1>
        <p className="text-sm text-muted-foreground">Gestion de dossiers</p>
      </div>

      <div className="px-3 py-2">
        <Link to="/dossiers/nouveau">
          <Button className="w-full" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau dossier
          </Button>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href

          return (
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="p-6 border-t">
        <p className="text-xs text-muted-foreground">CCI - Pack Rédaction d'actes</p>
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-xs font-semibold text-green-700">✨ VERSION 1.0.8 - AUTO-UPDATE OK!</p>
        </div>
      </div>
    </div>
  )
}
