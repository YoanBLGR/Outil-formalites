import { useState } from 'react'
import { useSimpleUpdate } from '../hooks/useSimpleUpdate'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Download, RefreshCw, X, ChevronDown, ChevronUp, Loader2, ExternalLink } from 'lucide-react'

export function UpdateDebugPanel() {
  const { updateInfo, checkForUpdates, openDownloadPage } = useSimpleUpdate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Si dismissed et pas de mise à jour, ne rien afficher
  if (dismissed && !updateInfo.available) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-2xl">
      <Card className="shadow-lg border-2 border-blue-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  {updateInfo.available ? '🎉 Mise à jour disponible' : '🔄 Système de mise à jour'}
                </CardTitle>
                {updateInfo.checking && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
              </div>
              <CardDescription>
                {updateInfo.available ? (
                  <>Version {updateInfo.latestVersion} disponible (actuelle: {updateInfo.currentVersion})</>
                ) : (
                  <>Version actuelle: {updateInfo.currentVersion}</>
                )}
              </CardDescription>
              {updateInfo.lastCheck && (
                <CardDescription className="text-xs mt-1">
                  Dernière vérification: {updateInfo.lastCheck.toLocaleTimeString()}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Réduire' : 'Voir les logs'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {updateInfo.available && (
          <CardContent className="pb-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 font-medium">
                Une nouvelle version est disponible !
              </p>
              <div className="text-xs text-blue-700 mt-2 space-y-1">
                <p>📥 Cliquez sur "Télécharger" ci-dessous</p>
                <p>💾 Le fichier sera téléchargé dans votre navigateur</p>
                <p>⚙️ Fermez l'app, installez, puis relancez</p>
              </div>
            </div>
          </CardContent>
        )}

        {updateInfo.error && (
          <CardContent className="pb-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900 font-medium">
                ❌ Erreur de vérification
              </p>
              <p className="text-xs text-red-700 mt-1">
                {updateInfo.error}
              </p>
            </div>
          </CardContent>
        )}

        {isExpanded && (
          <CardContent className="pb-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Logs de vérification
                </p>
                <p className="text-xs text-muted-foreground">
                  {updateInfo.logs.length} entrées
                </p>
              </div>
              
              <ScrollArea className="h-48 w-full rounded-md border bg-slate-50 p-3">
                <div className="space-y-1 font-mono text-xs">
                  {updateInfo.logs.length === 0 ? (
                    <p className="text-muted-foreground italic">
                      Aucun log pour le moment...
                    </p>
                  ) : (
                    updateInfo.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`${
                          log.includes('❌') || log.includes('Erreur')
                            ? 'text-red-600'
                            : log.includes('✅') || log.includes('🎉')
                            ? 'text-green-600'
                            : log.includes('🔍') || log.includes('📍')
                            ? 'text-blue-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex gap-2 justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkForUpdates()}
            disabled={updateInfo.checking}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${updateInfo.checking ? 'animate-spin' : ''}`} />
            {updateInfo.checking ? 'Vérification...' : 'Vérifier maintenant'}
          </Button>

          {updateInfo.available && (
            <Button
              size="sm"
              onClick={openDownloadPage}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger v{updateInfo.latestVersion}
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

