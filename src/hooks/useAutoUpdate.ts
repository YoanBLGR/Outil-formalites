import { useEffect, useState } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  latestVersion?: string
  downloading: boolean
  downloaded: boolean
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
      setUpdateInfo(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }))
      return null
    }
  }

  const downloadAndInstall = async () => {
    try {
      setUpdateInfo(prev => ({ ...prev, downloading: true, error: undefined }))

      const update = await check()

      if (!update) {
        setUpdateInfo(prev => ({
          ...prev,
          downloading: false,
          error: 'Aucune mise à jour disponible',
        }))
        return false
      }

      // Télécharger et installer la mise à jour
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          console.log(`Téléchargement démarré - Taille: ${event.data.contentLength || '?'} octets`)
        } else if (event.event === 'Progress') {
          console.log(`Téléchargement en cours: ${event.data.chunkLength} octets`)
        } else if (event.event === 'Finished') {
          console.log('Téléchargement terminé !')
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

