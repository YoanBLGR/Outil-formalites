import React from 'react'
import { AlertCircle, Settings, ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface AIConfigAlertProps {
  onDismiss?: () => void
}

export function AIConfigAlert({ onDismiss }: AIConfigAlertProps) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Settings className="h-5 w-5" />
          Configuration IA requise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Pour utiliser l'assistant IA, vous devez configurer votre clé API OpenAI.
        </p>
        
        <div className="space-y-2">
          <h4 className="font-medium text-amber-800 dark:text-amber-200">
            Étapes de configuration :
          </h4>
          <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 ml-4">
            <li>1. Créez un fichier <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env</code> à la racine du projet</li>
            <li>2. Ajoutez votre clé API : <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">VITE_OPENAI_API_KEY=votre_cle</code></li>
            <li>3. Activez l'IA : <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">VITE_AI_ENABLED=true</code></li>
            <li>4. Redémarrez l'application</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
            className="text-amber-800 border-amber-300 hover:bg-amber-100"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Obtenir une clé API
          </Button>
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-amber-700 hover:bg-amber-100"
            >
              Fermer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface AIDisabledAlertProps {
  reason?: string
}

export function AIDisabledAlert({ reason }: AIDisabledAlertProps) {
  return (
    <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">
            Assistant IA désactivé
            {reason && ` : ${reason}`}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
