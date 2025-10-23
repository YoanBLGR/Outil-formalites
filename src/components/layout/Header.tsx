import { Search, LogOut, User } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un dossier..."
              className="pl-10"
            />
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-medium text-gray-700">{user}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
