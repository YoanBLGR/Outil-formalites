import { useEffect, useState } from 'react'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  latestVersion?: string
  downloading: boolean
  downloadProgress?: number
  downloaded: boolean
  error?: string
  logs: string[]
  checking: boolean
  lastCheck?: Date
}

const CURRENT_VERSION = '2.0.7' // � mettre � jour � chaque release

export function useTauriUpdater() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    currentVersion: CURRENT_VERSION,
    downloading: false,
    downloaded: false,
    logs: [],
    checking: false,
  })

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setUpdateInfo(prev => ({
      ...prev,
      logs: [...prev.logs, logMessage]
    }))
  }

  const checkForUpdates = async () => {
    try {
      setUpdateInfo(prev => ({ ...prev, checking: true, error: undefined }))
      
      addLog('?? V�rification des mises � jour (API Tauri Updater)...')
      addLog(`?? Version actuelle: ${CURRENT_VERSION}`)

      // Utilisation de l'API officielle Tauri v2
      const update = await check()

      if (update?.available) {
        addLog(`?? Mise � jour disponible! ${CURRENT_VERSION} ? ${update.version}`)
        addLog(`?? Notes: ${update.body || 'Aucune note'}`)
        
        setUpdateInfo(prev => ({
          ...prev,
          available: true,
          latestVersion: update.version,
          checking: false,
          lastCheck: new Date()
        }))
        
        return update
      } else {
        addLog('? Application � jour - Aucune mise � jour n�cessaire')
        setUpdateInfo(prev => ({
          ...prev,
          available: false,
          checking: false,
          lastCheck: new Date()
        }))
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Impossible de v�rifier les mises � jour'
      
      addLog(`? Erreur: ${errorMessage}`)
      
      setUpdateInfo(prev => ({
        ...prev,
        error: errorMessage,
        checking: false,
        lastCheck: new Date()
      }))
      
      return null
    }
  }

  const downloadAndInstall = async (update: Update) => {
    try {
      addLog('?? D�marrage du t�l�chargement et installation...')
      setUpdateInfo(prev => ({ ...prev, downloading: true, downloadProgress: 0 }))

      let downloaded = 0
      let contentLength: number | undefined

      // T�l�charger et installer avec suivi de progression
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          contentLength = event.data.contentLength
          addLog(`?? T�l�chargement d�marr� - Taille: ${(contentLength! / 1024 / 1024).toFixed(2)} MB`)
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength
          const progress = contentLength ? Math.round((downloaded / contentLength) * 100) : 0
          
          if (progress % 10 === 0) {
            addLog(`?? Progression: ${progress}%`)
          }
          
          setUpdateInfo(prev => ({
            ...prev,
            downloadProgress: progress
          }))
        } else if (event.event === 'Finished') {
          addLog('? T�l�chargement termin�!')
        }
      })

      addLog('?? Installation termin�e')
      addLog('?? Red�marrage de l\'application...')
      
      setUpdateInfo(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
      }))

      // Red�marrer l'application pour appliquer la mise � jour
      await relaunch()
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erreur lors du t�l�chargement/installation'
      
      addLog(`? Erreur: ${errorMessage}`)
      
      setUpdateInfo(prev => ({
        ...prev,
        downloading: false,
        error: errorMessage,
      }))
      
      return false
    }
  }

  // V�rification automatique au d�marrage (apr�s 5 secondes)
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

