import { useEffect, useState } from 'react'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { open } from '@tauri-apps/plugin-shell'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  latestVersion?: string
  downloadUrl?: string
  error?: string
  logs: string[]
  checking: boolean
  lastCheck?: Date
}

const CURRENT_VERSION = '2.0.1' // À mettre à jour à chaque release
const GITHUB_API_URL = 'https://api.github.com/repos/yoyoboul/formalyse/releases/latest'

export function useSimpleUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    currentVersion: CURRENT_VERSION,
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
      
      addLog('🔍 Démarrage de la vérification des mises à jour...')
      addLog(`📍 Version actuelle: ${CURRENT_VERSION}`)
      addLog(`🌐 API GitHub: ${GITHUB_API_URL}`)

      // Utiliser l'API HTTP de Tauri pour éviter les problèmes CORS
      let response: Response
      try {
        addLog('📡 Utilisation de l\'API Tauri HTTP...')
        response = await tauriFetch(GITHUB_API_URL, {
          method: 'GET',
          connectTimeout: 10,
        })
      } catch (tauriError) {
        // Fallback vers fetch natif si Tauri n'est pas disponible
        addLog('⚠️ Tauri HTTP non disponible, utilisation de fetch natif...')
        response = await fetch(GITHUB_API_URL)
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      addLog('✅ Connexion API GitHub réussie')

      const releaseData = await response.json()
      addLog('✅ Données de release reçues')

      // Extraire la version (format: v2.0.0 ou 2.0.0)
      const latestVersion = releaseData.tag_name?.replace(/^v/, '') || releaseData.name
      
      if (!latestVersion) {
        throw new Error('Version non trouvée dans la release GitHub')
      }

      addLog(`📦 Version disponible sur GitHub: ${latestVersion}`)

      // Chercher l'installateur Windows dans les assets
      const windowsAsset = releaseData.assets?.find((asset: any) => 
        asset.name.includes('x64-setup.exe') || asset.name.includes('setup.exe')
      )

      if (!windowsAsset) {
        throw new Error('Installateur Windows non trouvé dans la release')
      }

      const downloadUrl = windowsAsset.browser_download_url
      addLog(`📥 Installateur trouvé: ${windowsAsset.name}`)

      // Comparer les versions (simple comparaison de chaînes)
      if (latestVersion !== CURRENT_VERSION) {
        addLog(`🎉 Mise à jour disponible! ${CURRENT_VERSION} → ${latestVersion}`)
        addLog(`📥 URL de téléchargement prête`)

        setUpdateInfo(prev => ({
          ...prev,
          available: true,
          currentVersion: CURRENT_VERSION,
          latestVersion,
          downloadUrl,
          checking: false,
          lastCheck: new Date()
        }))
      } else {
        addLog('✅ Application à jour - Aucune mise à jour nécessaire')
        setUpdateInfo(prev => ({
          ...prev,
          available: false,
          currentVersion: CURRENT_VERSION,
          checking: false,
          lastCheck: new Date()
        }))
      }

      return latestVersion !== CURRENT_VERSION
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Impossible de vérifier les mises à jour'
      
      addLog(`❌ Erreur: ${errorMessage}`)
      
      setUpdateInfo(prev => ({
        ...prev,
        error: errorMessage,
        checking: false,
        lastCheck: new Date()
      }))
      
      return false
    }
  }

  const openDownloadPage = async () => {
    const url = updateInfo.downloadUrl || 'https://github.com/yoyoboul/formalyse/releases/latest'
    
    try {
      addLog(`🌐 Ouverture du navigateur: ${url}`)
      await open(url)
      addLog('✅ Navigateur ouvert avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du navigateur:', error)
      addLog(`❌ Erreur: Impossible d'ouvrir le navigateur`)
      
      // Fallback: copier l'URL dans le presse-papier (si disponible)
      try {
        await navigator.clipboard.writeText(url)
        addLog('📋 URL copiée dans le presse-papier')
        alert(`URL copiée dans le presse-papier :\n${url}\n\nCollez-la dans votre navigateur pour télécharger.`)
      } catch {
        alert(`Impossible d'ouvrir le navigateur.\nURL de téléchargement :\n${url}`)
      }
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
    openDownloadPage,
  }
}

