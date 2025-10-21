import { useState } from 'react'
import { useAutoUpdate } from '../hooks/useAutoUpdate'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Download, RefreshCw, X } from 'lucide-react'

export function UpdateNotification() {
  const { updateInfo, downloadAndInstall, checkForUpdates } = useAutoUpdate()
  const [dismissed, setDismissed] = useState(false)

  // Ne rien afficher si pas de mise à jour ou si dismissed
  if (!updateInfo.available || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-lg border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Mise à jour disponible</CardTitle>
              <CardDescription>
                Version {updateInfo.latestVersion} disponible
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {updateInfo.error ? (
            <p className="text-sm text-red-600">{updateInfo.error}</p>
          ) : updateInfo.downloading ? (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Téléchargement en cours...</span>
            </div>
          ) : updateInfo.downloaded ? (
            <p className="text-sm text-green-600">
              ✓ Mise à jour téléchargée ! L'application va redémarrer.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Une nouvelle version de Formalyse est disponible. Voulez-vous la télécharger et l'installer maintenant ?
            </p>
          )}
        </CardContent>

        {!updateInfo.downloading && !updateInfo.downloaded && (
          <CardFooter className="flex gap-2">
            <Button
              onClick={() => setDismissed(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Plus tard
            </Button>
            <Button
              onClick={downloadAndInstall}
              size="sm"
              className="flex-1"
              disabled={updateInfo.downloading}
            >
              <Download className="h-4 w-4 mr-2" />
              Mettre à jour
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

