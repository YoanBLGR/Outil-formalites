import { useState, useEffect } from 'react'
import { useAutoUpdate } from '../hooks/useAutoUpdate'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Download, RefreshCw, X, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'

export function UpdatePanel() {
  const { updateInfo, downloadAndInstall, checkForUpdates } = useAutoUpdate()
  const [dismissed, setDismissed] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  // Ajouter un log
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  // Surveiller les changements d'état et logger
  useEffect(() => {
    if (updateInfo.available && !dismissed) {
      addLog(`🔍 Mise à jour disponible : v${updateInfo.latestVersion}`)
    }
  }, [updateInfo.available])

  useEffect(() => {
    if (updateInfo.downloading && updateInfo.downloadProgress === 0) {
      addLog('📥 Démarrage du téléchargement...')
    }
  }, [updateInfo.downloading])

  // Logger la progression du téléchargement
  useEffect(() => {
    if (updateInfo.downloading && updateInfo.downloadProgress) {
      if (updateInfo.downloadProgress === 25 || updateInfo.downloadProgress === 50 || 
          updateInfo.downloadProgress === 75 || updateInfo.downloadProgress === 100) {
        addLog(`📊 Progression : ${updateInfo.downloadProgress}%`)
      }
    }
  }, [updateInfo.downloadProgress])

  useEffect(() => {
    if (updateInfo.downloaded) {
      addLog('✅ Téléchargement terminé !')
      addLog('🔄 Installation en cours...')
    }
  }, [updateInfo.downloaded])

  useEffect(() => {
    if (updateInfo.error) {
      addLog(`❌ Erreur : ${updateInfo.error}`)
    }
  }, [updateInfo.error])

  // Vérification initiale au montage
  useEffect(() => {
    addLog('🔍 Vérification des mises à jour...')
    checkForUpdates().then(() => {
      if (!updateInfo.available) {
        addLog('✅ Aucune mise à jour disponible - Application à jour')
      }
    })
  }, [])

  const handleUpdate = async () => {
    addLog('🚀 Lancement de la mise à jour...')
    setShowLogs(true)
    await downloadAndInstall()
  }

  const handleCheckNow = async () => {
    setLogs([])
    addLog('🔍 Vérification manuelle des mises à jour...')
    setShowLogs(true)
    await checkForUpdates()
  }

  // Ne rien afficher si dismissed et pas de mise à jour
  if (dismissed && !updateInfo.available) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-2xl">
      <Card className="shadow-2xl border-2 border-blue-300 bg-white">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {updateInfo.downloading ? (
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              ) : updateInfo.downloaded ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : updateInfo.error ? (
                <AlertCircle className="h-6 w-6 text-red-600" />
              ) : updateInfo.available ? (
                <Download className="h-6 w-6 text-blue-600" />
              ) : (
                <RefreshCw className="h-6 w-6 text-gray-600" />
              )}
              
              <div>
                <CardTitle className="text-lg">
                  {updateInfo.downloading
                    ? 'Téléchargement en cours...'
                    : updateInfo.downloaded
                    ? 'Mise à jour prête !'
                    : updateInfo.available
                    ? 'Mise à jour disponible'
                    : 'Gestionnaire de mises à jour'}
                </CardTitle>
                <CardDescription>
                  {updateInfo.available && (
                    <>
                      Version actuelle : {updateInfo.currentVersion} → Nouvelle : {updateInfo.latestVersion}
                    </>
                  )}
                  {!updateInfo.available && !updateInfo.error && (
                    <>Version actuelle : {updateInfo.currentVersion}</>
                  )}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowLogs(!showLogs)}
                title={showLogs ? "Masquer les logs" : "Afficher les logs"}
              >
                {showLogs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              
              {!updateInfo.downloading && !updateInfo.downloaded && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 pt-4">
          {/* Message principal */}
          {updateInfo.error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                ❌ {updateInfo.error}
              </p>
            </div>
          ) : updateInfo.downloading ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Téléchargement de la mise à jour en cours...</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${updateInfo.downloadProgress || 0}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{updateInfo.downloadProgress || 0}% téléchargé</span>
                {updateInfo.downloadSize && (
                  <span>{Math.round(updateInfo.downloadSize / 1024 / 1024)} MB</span>
                )}
              </div>
            </div>
          ) : updateInfo.downloaded ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✅ Mise à jour téléchargée avec succès !
              </p>
              <p className="text-xs text-green-700 mt-1">
                L'application va redémarrer pour appliquer la mise à jour.
              </p>
            </div>
          ) : updateInfo.available ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Une nouvelle version de Formalyse est disponible. La mise à jour inclut des améliorations et corrections de bugs.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Voulez-vous la télécharger et l'installer maintenant ?
              </p>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                ✅ Votre application est à jour.
              </p>
            </div>
          )}

          {/* Panneau des logs */}
          {showLogs && logs.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700">Logs de mise à jour</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogs([])}
                  className="h-6 text-xs"
                >
                  Effacer
                </Button>
              </div>
              <ScrollArea className="h-32 w-full rounded border bg-gray-900 p-2">
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <p key={index} className="text-xs font-mono text-green-400">
                      {log}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 bg-gray-50">
          {!updateInfo.downloading && !updateInfo.downloaded && (
            <>
              {updateInfo.available ? (
                <>
                  <Button
                    onClick={() => setDismissed(true)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Plus tard
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Mettre à jour maintenant
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleCheckNow}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Vérifier maintenant
                </Button>
              )}
            </>
          )}

          {updateInfo.downloading && (
            <div className="w-full text-center">
              <p className="text-xs text-muted-foreground">
                Téléchargement en cours... Merci de patienter.
              </p>
            </div>
          )}

          {updateInfo.downloaded && (
            <div className="w-full text-center">
              <p className="text-xs text-muted-foreground">
                Redémarrage automatique dans quelques instants...
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

