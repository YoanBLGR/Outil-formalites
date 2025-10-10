import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { suggestObjetSocial } from '../../services/ai-suggestions'
import { isAIConfigured } from '../../lib/ai-config'
import { AIDisabledAlert } from './AIConfigAlert'
import type { AISuggestion } from '../../types/ai'

interface InlineSuggestionsProps {
  fieldName: string
  currentValue: string
  onApplySuggestion: (suggestion: string) => void
}

export function InlineSuggestions({ 
  fieldName, 
  currentValue, 
  onApplySuggestion
}: InlineSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [appliedSuggestion, setAppliedSuggestion] = useState<string | null>(null)

  const loadSuggestions = async () => {
    if (!isAIConfigured() || !currentValue.trim()) return

    setIsLoading(true)
    try {
      let newSuggestions: AISuggestion[] = []
      
      if (fieldName === 'objetSocial') {
        newSuggestions = await suggestObjetSocial(currentValue)
      }
      // Ajouter d'autres types de suggestions ici
      
      setSuggestions(newSuggestions)
      setIsExpanded(true)
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplySuggestion = (suggestion: string) => {
    onApplySuggestion(suggestion)
    setAppliedSuggestion(suggestion)
    setIsExpanded(false)
    
    // Réinitialiser après 2 secondes
    setTimeout(() => {
      setAppliedSuggestion(null)
    }, 2000)
  }

  const handleDismiss = () => {
    setIsExpanded(false)
    setSuggestions([])
  }

  // Ne pas afficher si pas de valeur ou pas configuré
  if (!currentValue.trim() || !isAIConfigured()) {
    return null
  }

  return (
    <div className="mt-2">
      {/* Bouton pour charger les suggestions */}
      {!isExpanded && !appliedSuggestion && (
        <Button
          variant="outline"
          size="sm"
          onClick={loadSuggestions}
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          {isLoading ? 'Analyse...' : '✨ Suggérer'}
        </Button>
      )}

      {/* Message de succès */}
      {appliedSuggestion && (
        <div className="flex items-center gap-2 text-green-600 text-xs">
          <Check className="h-3 w-3" />
          Suggestion appliquée !
        </div>
      )}

      {/* Suggestions */}
      {isExpanded && suggestions.length > 0 && (
        <Card className="mt-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Suggestions IA
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {suggestions.slice(0, 3).map((suggestion) => (
                <div key={suggestion.id} className="space-y-1">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {suggestion.title}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {suggestion.description}
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded text-xs border">
                    {suggestion.value}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplySuggestion(suggestion.value)}
                    className="text-xs h-6"
                  >
                    Appliquer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si pas de suggestions */}
      {isExpanded && suggestions.length === 0 && !isLoading && (
        <div className="text-xs text-gray-500 mt-2">
          Aucune suggestion disponible pour cette valeur.
        </div>
      )}
    </div>
  )
}

// Composant spécialisé pour l'objet social
export function ObjetSocialSuggestions({ 
  currentValue, 
  onApplySuggestion 
}: {
  currentValue: string
  onApplySuggestion: (suggestion: string) => void
}) {
  return (
    <InlineSuggestions
      fieldName="objetSocial"
      currentValue={currentValue}
      onApplySuggestion={onApplySuggestion}
    />
  )
}

// Composant pour afficher l'état de configuration IA
export function AIStatusIndicator() {
  if (!isAIConfigured()) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <AIDisabledAlert reason="Clé API non configurée" />
      </div>
    )
  }
  
  return null
}
