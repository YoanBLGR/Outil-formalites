import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Filter, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import type { ChecklistItem, ChecklistCategory } from '../../types'
import { CHECKLIST_CATEGORY_CONFIG, getChecklistProgress } from '../../utils/checklist-templates'
import { cn } from '../../lib/utils'

interface EnhancedChecklistProps {
  items: ChecklistItem[]
  onToggle: (itemId: string) => void
}

type FilterMode = 'all' | 'completed' | 'pending'

export function EnhancedChecklist({ items, onToggle }: EnhancedChecklistProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<ChecklistCategory>>(
    new Set(['PREPARATION', 'REDACTION', 'DOCUMENTS', 'SIGNATURE', 'FORMALITES'])
  )
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const progress = getChecklistProgress(items)

  const toggleCategory = (category: ChecklistCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const getCategoryItems = (category: ChecklistCategory) => {
    return items.filter((item) => {
      // Pour les items sans catégorie, les assigner à PREPARATION par défaut
      const itemCategory = item.category || 'PREPARATION'
      if (itemCategory !== category) return false
      if (filterMode === 'completed') return item.completed
      if (filterMode === 'pending') return !item.completed
      return true
    })
  }

  const getCategoryColor = (color: string, completed: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string; bgLight: string }> = {
      blue: {
        bg: completed ? 'bg-blue-500' : 'bg-blue-100',
        border: completed ? 'border-blue-500' : 'border-blue-200',
        text: completed ? 'text-blue-700' : 'text-blue-600',
        bgLight: 'bg-blue-50',
      },
      purple: {
        bg: completed ? 'bg-purple-500' : 'bg-purple-100',
        border: completed ? 'border-purple-500' : 'border-purple-200',
        text: completed ? 'text-purple-700' : 'text-purple-600',
        bgLight: 'bg-purple-50',
      },
      green: {
        bg: completed ? 'bg-green-500' : 'bg-green-100',
        border: completed ? 'border-green-500' : 'border-green-200',
        text: completed ? 'text-green-700' : 'text-green-600',
        bgLight: 'bg-green-50',
      },
      orange: {
        bg: completed ? 'bg-orange-500' : 'bg-orange-100',
        border: completed ? 'border-orange-500' : 'border-orange-200',
        text: completed ? 'text-orange-700' : 'text-orange-600',
        bgLight: 'bg-orange-50',
      },
      red: {
        bg: completed ? 'bg-red-500' : 'bg-red-100',
        border: completed ? 'border-red-500' : 'border-red-200',
        text: completed ? 'text-red-700' : 'text-red-600',
        bgLight: 'bg-red-50',
      },
    }
    return colors[color] || colors.blue
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Checklist du dossier</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {progress.completed} sur {progress.total} tâches complétées
            </p>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterMode === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterMode('all')}
            >
              Toutes
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterMode('pending')}
            >
              À faire
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilterMode('completed')}
            >
              Complétées
            </Button>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-sm font-bold">
              {Math.round((progress.completed / progress.total) * 100)}%
            </span>
          </div>
          <Progress value={(progress.completed / progress.total) * 100} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Catégories */}
        {Object.entries(CHECKLIST_CATEGORY_CONFIG).map(([category, config]) => {
          const categoryKey = category as ChecklistCategory
          const categoryItems = getCategoryItems(categoryKey)
          const categoryProgress = progress.byCategory[categoryKey]
          const isExpanded = expandedCategories.has(categoryKey)
          const isCompleted = categoryProgress.completed === categoryProgress.total
          const colors = getCategoryColor(config.color, isCompleted)

          if (categoryItems.length === 0 && filterMode !== 'all') {
            return null
          }

          return (
            <div key={category} className="space-y-2">
              {/* En-tête de catégorie */}
              <button
                onClick={() => toggleCategory(categoryKey)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md',
                  colors.border,
                  colors.bgLight
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Icône */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
                      colors.bg,
                      isCompleted && 'animate-bounce'
                    )}
                  >
                    {config.icon}
                  </div>

                  {/* Infos */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className={cn('font-semibold', colors.text)}>{config.label}</h3>
                      {isCompleted && (
                        <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progression */}
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', colors.text)}>
                      {categoryProgress.completed}/{categoryProgress.total}
                    </p>
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={cn('h-full transition-all', colors.bg)}
                        style={{
                          width: `${
                            (categoryProgress.completed / categoryProgress.total) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Chevron */}
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Liste des tâches */}
              {isExpanded && (
                <div className="space-y-2 ml-4 animate-in slide-in-from-top-2 duration-200">
                  {categoryItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => onToggle(item.id)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 rounded-lg border transition-all group',
                        item.completed
                          ? 'bg-muted/50 border-muted hover:bg-muted'
                          : 'bg-white border-border hover:border-primary/50 hover:shadow-sm',
                        'animate-in fade-in slide-in-from-left-2 duration-200'
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-0.5">
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in duration-200" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>

                      {/* Icône de la tâche */}
                      {item.icon && (
                        <div className="flex-shrink-0 text-xl">{item.icon}</div>
                      )}

                      {/* Contenu */}
                      <div className="flex-1 text-left">
                        <p
                          className={cn(
                            'font-medium transition-all',
                            item.completed
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground group-hover:text-primary'
                          )}
                        >
                          {item.label}
                          {item.required && !item.completed && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        {item.completedAt && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Complété le{' '}
                            {new Date(item.completedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Message si toutes les tâches sont complétées */}
        {progress.completed === progress.total && (
          <div className="text-center py-8 px-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200 animate-in zoom-in duration-500">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-xl font-bold text-green-700 mb-2">
              Félicitations !
            </h3>
            <p className="text-muted-foreground">
              Toutes les tâches de la checklist sont complétées.
            </p>
          </div>
        )}

        {/* Message si aucune tâche ne correspond au filtre */}
        {items.length > 0 &&
          Object.values(progress.byCategory).every((cat) =>
            filterMode === 'completed'
              ? cat.completed === 0
              : filterMode === 'pending'
              ? cat.completed === cat.total
              : false
          ) && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune tâche ne correspond à ce filtre</p>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
