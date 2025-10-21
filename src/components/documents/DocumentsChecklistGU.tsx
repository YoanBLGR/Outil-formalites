import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  Upload,
  ExternalLink,
  Info,
  Filter,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import type { DocumentGUChecklistItem, FormeJuridique } from '../../types'
import { getDocumentsGUProgress, getMissingRequiredDocuments } from '../../utils/documents-gu-checklist'
import { cn } from '../../lib/utils'

interface DocumentsChecklistGUProps {
  items: DocumentGUChecklistItem[]
  formeJuridique: FormeJuridique
  onToggle: (itemId: string) => void
  onAddNote?: (itemId: string, note: string) => void
  onViewDocument?: (documentId: string) => void
  onUploadDocument?: (documentType: DocumentGUChecklistItem['documentType']) => void
}

type FilterMode = 'all' | 'completed' | 'pending' | 'required'

export function DocumentsChecklistGU({
  items,
  formeJuridique,
  onToggle,
  onAddNote,
  onViewDocument,
  onUploadDocument,
}: DocumentsChecklistGUProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  const progress = getDocumentsGUProgress(items)
  const missingRequired = getMissingRequiredDocuments(items)

  const toggleNote = (itemId: string) => {
    setExpandedNotes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const getFilteredItems = () => {
    return items.filter((item) => {
      if (filterMode === 'completed') return item.completed
      if (filterMode === 'pending') return !item.completed
      if (filterMode === 'required') return item.required
      return true
    })
  }

  const filteredItems = getFilteredItems()

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Documents à fournir au Guichet Unique
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Liste des documents nécessaires pour l'immatriculation de votre {formeJuridique}
            </CardDescription>

            {/* Statistiques */}
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {progress.completed}/{progress.total} complétés
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={progress.required.completed === progress.required.total ? 'default' : 'destructive'}
                  className="text-sm"
                >
                  {progress.required.completed}/{progress.required.total} obligatoires
                </Badge>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant={filterMode === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterMode('all')}
            >
              Tous
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'required' ? 'default' : 'outline'}
              onClick={() => setFilterMode('required')}
            >
              Obligatoires
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterMode('pending')}
            >
              Manquants
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilterMode('completed')}
            >
              Complétés
            </Button>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Progression globale</span>
            <span className="text-sm font-bold text-blue-600">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-3" />
        </div>

        {/* Alerte documents manquants */}
        {missingRequired.length > 0 && (
          <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">
                  {missingRequired.length} document{missingRequired.length > 1 ? 's' : ''} obligatoire
                  {missingRequired.length > 1 ? 's' : ''} manquant{missingRequired.length > 1 ? 's' : ''}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-orange-800">
                  {missingRequired.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <Circle className="h-3 w-3" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        {/* Liste des documents */}
        <div className="space-y-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'rounded-xl border-2 transition-all duration-200 overflow-hidden animate-in fade-in slide-in-from-left-2',
                item.completed
                  ? 'bg-green-50 border-green-300 shadow-sm'
                  : item.required
                  ? 'bg-white border-orange-200 shadow-md hover:shadow-lg'
                  : 'bg-gray-50 border-gray-200 shadow-sm'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* En-tête du document */}
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all',
                      item.completed
                        ? 'bg-green-500 shadow-lg animate-bounce'
                        : item.required
                        ? 'bg-orange-100'
                        : 'bg-gray-200'
                    )}
                  >
                    {item.icon}
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={cn(
                              'font-semibold text-lg',
                              item.completed ? 'text-green-900' : 'text-gray-900'
                            )}
                          >
                            {item.label}
                          </h3>
                          {item.required && (
                            <Badge variant="destructive" className="text-xs">
                              Obligatoire
                            </Badge>
                          )}
                          {item.completed && (
                            <CheckCircle2 className="h-5 w-5 text-green-600 animate-in zoom-in" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>

                        {/* Date de complétion */}
                        {item.completedAt && (
                          <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
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

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={item.completed ? 'outline' : 'default'}
                          onClick={() => onToggle(item.id)}
                          className={cn(
                            'min-w-[100px]',
                            item.completed && 'bg-green-600 hover:bg-green-700 text-white'
                          )}
                        >
                          {item.completed ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Complété
                            </>
                          ) : (
                            <>
                              <Circle className="h-4 w-4 mr-1" />
                              Marquer
                            </>
                          )}
                        </Button>

                        {onUploadDocument && !item.linkedDocumentId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUploadDocument(item.documentType)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Uploader
                          </Button>
                        )}

                        {item.linkedDocumentId && onViewDocument && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewDocument(item.linkedDocumentId!)}
                            className="text-blue-600"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        )}

                        {onAddNote && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleNote(item.id)}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Note
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {expandedNotes.has(item.id) && onAddNote && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-in slide-in-from-top-2">
                        <textarea
                          className="w-full p-2 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ajouter une note..."
                          rows={3}
                          defaultValue={item.notes || ''}
                          onBlur={(e) => onAddNote(item.id, e.target.value)}
                        />
                      </div>
                    )}

                    {item.notes && !expandedNotes.has(item.id) && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700 border-l-4 border-blue-400">
                        📝 {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message si toutes les tâches sont complétées */}
        {progress.completed === progress.total && items.length > 0 && (
          <div className="mt-6 text-center py-8 px-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-300 animate-in zoom-in duration-500">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">Félicitations !</h3>
            <p className="text-gray-700 text-lg">
              Tous les documents pour le Guichet Unique sont complétés.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Vous pouvez maintenant procéder au dépôt du dossier sur le Guichet Unique.
            </p>
          </div>
        )}

        {/* Message si aucun document ne correspond au filtre */}
        {filteredItems.length === 0 && items.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            <Filter className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Aucun document ne correspond à ce filtre</p>
          </div>
        )}

        {/* Message si aucun document */}
        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Aucun document dans la checklist</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
