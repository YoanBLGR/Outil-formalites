import { useEffect, useState } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  latestVersion?: string
  downloading: boolean
  downloaded: boolean
  downloadProgress?: number
  downloadSize?: number
  error?: string
}

export function useAutoUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    currentVersion: '1.0.0',
    downloading: false,
    downloaded: false,
  })

  const checkForUpdates = async () => {
    try {
      const update = await check()

      if (update) {
        setUpdateInfo(prev => ({
          ...prev,
          available: true,
          latestVersion: update.version,
        }))
        return update
      }

      return null
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Impossible de vérifier les mises à jour. Vérifiez votre connexion internet.'
      setUpdateInfo(prev => ({
        ...prev,
        error: errorMessage,
      }))
      return null
    }
  }

  const downloadAndInstall = async () => {
    try {
      setUpdateInfo(prev => ({ ...prev, downloading: true, error: undefined, downloadProgress: 0 }))

      const update = await check()

      if (!update) {
        setUpdateInfo(prev => ({
          ...prev,
          downloading: false,
          error: 'Aucune mise à jour disponible',
        }))
        return false
      }

      let totalSize = 0
      let downloadedSize = 0

      // Télécharger et installer la mise à jour
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          totalSize = event.data.contentLength || 0
          console.log(`Téléchargement démarré - Taille: ${totalSize} octets`)
          setUpdateInfo(prev => ({
            ...prev,
            downloadSize: totalSize,
            downloadProgress: 0
          }))
        } else if (event.event === 'Progress') {
          downloadedSize += event.data.chunkLength
          const progress = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0
          console.log(`Téléchargement: ${downloadedSize}/${totalSize} octets (${progress}%)`)
          setUpdateInfo(prev => ({
            ...prev,
            downloadProgress: progress
          }))
        } else if (event.event === 'Finished') {
          console.log('Téléchargement terminé !')
          setUpdateInfo(prev => ({
            ...prev,
            downloadProgress: 100
          }))
        }
      })

      setUpdateInfo(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
      }))

      // Redémarrer l'application
      await relaunch()

      return true
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      setUpdateInfo(prev => ({
        ...prev,
        downloading: false,
        error: error instanceof Error ? error.message : 'Erreur de téléchargement',
      }))
      return false
    }
  }

  // Vérification automatique au démarrage (après 5 secondes)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return {
    updateInfo,
    checkForUpdates,
    downloadAndInstall,
  }
}

