/**
 * Composant de debug pour vérifier la configuration Guichet Unique
 * À utiliser temporairement pour diagnostiquer les problèmes de configuration
 */

import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import { isTauriApp } from '../../lib/utils'

export function GUConfigDebug() {
  const [showSensitive, setShowSensitive] = useState(false)

  // Vérifier les variables d'environnement
  const config = {
    apiUrl: import.meta.env.VITE_GU_API_URL,
    username: import.meta.env.VITE_GU_USERNAME,
    password: import.meta.env.VITE_GU_PASSWORD,
    apiKey: import.meta.env.VITE_GU_API_KEY,
  }

  const hasApiUrl = !!config.apiUrl
  const hasUsername = !!config.username
  const hasPassword = !!config.password
  const isFullyConfigured = hasApiUrl && hasUsername && hasPassword

  const maskValue = (value: string | undefined) => {
    if (!value) return 'Non défini'
    if (!showSensitive) return '••••••••'
    return value
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Configuration Guichet Unique
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSensitive(!showSensitive)}
          >
            {showSensitive ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Masquer
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Afficher
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Diagnostic de la configuration pour le Guichet Unique INPI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut global */}
        <Alert variant={isFullyConfigured ? 'default' : 'destructive'}>
          {isFullyConfigured ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {isFullyConfigured
              ? '✅ Configuration complète'
              : '❌ Configuration incomplète - certaines variables manquent'}
          </AlertDescription>
        </Alert>

        {/* Détails */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="font-mono text-sm">VITE_GU_API_URL</span>
            <div className="flex items-center gap-2">
              <code className="text-sm">{config.apiUrl || 'Non défini'}</code>
              {hasApiUrl ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="font-mono text-sm">VITE_GU_USERNAME</span>
            <div className="flex items-center gap-2">
              <code className="text-sm">{maskValue(config.username)}</code>
              {hasUsername ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="font-mono text-sm">VITE_GU_PASSWORD</span>
            <div className="flex items-center gap-2">
              <code className="text-sm">{maskValue(config.password)}</code>
              {hasPassword ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="font-mono text-sm">VITE_GU_API_KEY</span>
            <div className="flex items-center gap-2">
              <code className="text-sm">{maskValue(config.apiKey) || 'Optionnel'}</code>
              <span className="text-xs text-muted-foreground">(optionnel)</span>
            </div>
          </div>
        </div>

        {/* Instructions si configuration manquante */}
        {!isFullyConfigured && (
          <Alert>
            <AlertDescription>
              <p className="font-semibold mb-2">Comment corriger :</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Créez un fichier <code>.env</code> à la racine du projet</li>
                <li>Ajoutez les variables manquantes (voir <code>.env.example</code>)</li>
                <li>Rebuilder l'application : <code>npm run tauri:build</code></li>
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                Note : Les variables d'environnement sont compilées au moment du build.
                Toute modification nécessite un rebuild.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Info environnement */}
        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
          <p>Mode: {import.meta.env.MODE}</p>
          <p>Production: {import.meta.env.PROD ? 'Oui' : 'Non'}</p>
          <p>Dev: {import.meta.env.DEV ? 'Oui' : 'Non'}</p>
          <p>
            Environnement:{' '}
            {isTauriApp() ? 'Tauri Desktop' : 'Navigateur Web'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

