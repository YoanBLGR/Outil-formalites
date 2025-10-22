import { useState } from 'react'
import { useTauriUpdater } from '../hooks/useTauriUpdater'
import { type Update } from '@tauri-apps/plugin-updater'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Download, RefreshCw, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

export function TauriUpdatePanel() {
  const { updateInfo, checkForUpdates, downloadAndInstall } = useTauriUpdater()
  const [isExpanded, setIsExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null)

  const handleCheckForUpdates = async () => {
    const update = await checkForUpdates()
    if (update) {
      setPendingUpdate(update)
    }
  }

  const handleDownloadAndInstall = async () => {
    if (pendingUpdate) {
      await downloadAndInstall(pendingUpdate)
    }
  }

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
                {(updateInfo.checking || updateInfo.downloading) && (
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
              {updateInfo.downloading ? (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                    <span>Téléchargement en cours...</span>
                    <span>{updateInfo.downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${updateInfo.downloadProgress || 0}%` }}
                    />
                  </div>
                </div>
              ) : updateInfo.downloaded ? (
                <div className="text-xs text-blue-700 mt-2 space-y-1">
                  <p>✅ Téléchargement et installation terminés</p>
                  <p>🔄 Redémarrage de l'application...</p>
                </div>
              ) : (
                <div className="text-xs text-blue-700 mt-2 space-y-1">
                  <p>📥 Cliquez sur "Mettre à jour" ci-dessous</p>
                  <p>⚙️ Le téléchargement et l'installation se feront automatiquement</p>
                  <p>🔄 L'application redémarrera automatiquement</p>
                </div>
              )}
            </div>
          </CardContent>
        )}

        {updateInfo.error && (
          <CardContent className="pb-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900 font-medium">
                ❌ Erreur
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
                  Logs de mise à jour
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
            onClick={handleCheckForUpdates}
            disabled={updateInfo.checking || updateInfo.downloading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${updateInfo.checking ? 'animate-spin' : ''}`} />
            {updateInfo.checking ? 'Vérification...' : 'Vérifier maintenant'}
          </Button>

          {updateInfo.available && !updateInfo.downloaded && (
            <Button
              size="sm"
              onClick={handleDownloadAndInstall}
              disabled={updateInfo.downloading}
              className="gap-2"
            >
              {updateInfo.downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Téléchargement... {updateInfo.downloadProgress}%
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Mettre à jour v{updateInfo.latestVersion}
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

