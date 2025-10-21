import { createWorker } from 'tesseract.js'
import type { OCRResult } from '../types'
import { parseCNIText, validateCNIData } from '../utils/cni-parser'
import { extractWithGoogleVision, isGoogleVisionConfigured } from './google-vision-ocr'

/**
 * Service OCR pour extraire les données d'une CNI française
 * Supporte 2 moteurs : Tesseract.js (gratuit, local) et Google Cloud Vision (précis, cloud)
 */

export type OCREngine = 'tesseract' | 'google-vision' | 'auto'

/**
 * Compresse une image si elle est trop grande
 */
async function compressImage(file: File, maxSizeMB = 5): Promise<File> {
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Redimensionner si trop grand
        const maxDimension = 2000
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Impossible de créer le context canvas'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Erreur lors de la compression'))
            }
          },
          'image/jpeg',
          0.85
        )
      }
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
    reader.readAsDataURL(file)
  })
}

/**
 * Pré-traite l'image pour améliorer la qualité OCR
 */
async function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Impossible de créer le context canvas'))
          return
        }

        // Dessiner l'image
        ctx.drawImage(img, 0, 0)

        // Améliorer le contraste
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Conversion en niveaux de gris et amélioration du contraste
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          const enhanced = avg < 128 ? 0 : 255 // Seuillage binaire
          data[i] = enhanced     // R
          data[i + 1] = enhanced // G
          data[i + 2] = enhanced // B
        }

        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
    reader.readAsDataURL(file)
  })
}

/**
 * Extrait les données d'une CNI via OCR avec Tesseract.js
 * (version locale, gratuite, moins précise)
 */
async function extractWithTesseract(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const startTime = Date.now()

  try {
    // Vérifier le type de fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic']
    if (!validTypes.includes(imageFile.type.toLowerCase())) {
      return {
        success: false,
        error: 'Format de fichier non supporté. Utilisez JPG, PNG ou HEIC.'
      }
    }

    onProgress?.(5)

    // Comprimer l'image si nécessaire
    const compressedFile = await compressImage(imageFile)
    onProgress?.(15)

    // Pré-traiter l'image
    const preprocessedImage = await preprocessImage(compressedFile)
    onProgress?.(25)

    // Créer un worker Tesseract
    const worker = await createWorker('fra', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const progress = 25 + (m.progress * 65) // 25% à 90%
          onProgress?.(Math.round(progress))
        }
      }
    })

    onProgress?.(90)

    // Effectuer l'OCR
    const { data } = await worker.recognize(preprocessedImage)
    await worker.terminate()

    onProgress?.(95)

    const rawText = data.text

    if (!rawText || rawText.trim().length < 20) {
      return {
        success: false,
        error: 'Aucun texte détecté. Assurez-vous que l\'image est claire et lisible.',
        rawText
      }
    }

    // Parser le texte extrait
    const { data: cniData, fieldConfidence } = parseCNIText(rawText)

    // Valider les données
    const validation = validateCNIData(cniData)

    onProgress?.(100)

    const processingTime = Date.now() - startTime

    if (!validation.valid) {
      return {
        success: false,
        data: cniData,
        fieldConfidence,
        rawText,
        error: `Extraction incomplète : ${validation.errors.join(', ')}`,
        processingTime
      }
    }

    return {
      success: true,
      data: cniData,
      fieldConfidence,
      rawText,
      processingTime
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Erreur OCR:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'analyse de l\'image',
      processingTime
    }
  }
}

/**
 * Extrait les données d'une CNI via OCR (fonction principale)
 * Choisit automatiquement le meilleur moteur disponible
 *
 * @param imageFile - Fichier image de la CNI (JPG, PNG, HEIC)
 * @param onProgress - Callback pour suivre la progression (0-100)
 * @param engine - Moteur à utiliser : 'auto' (défaut), 'tesseract', 'google-vision'
 * @returns Promise avec le résultat de l'extraction
 */
export async function extractCNIData(
  imageFile: File,
  onProgress?: (progress: number) => void,
  engine: OCREngine = 'auto'
): Promise<OCRResult> {
  // Mode auto : choisir Google Vision si configuré, sinon Tesseract
  if (engine === 'auto') {
    if (isGoogleVisionConfigured()) {
      console.log('🚀 Utilisation de Google Cloud Vision (haute précision)')
      return extractWithGoogleVision(imageFile, onProgress)
    } else {
      console.log('🔧 Utilisation de Tesseract.js (local, gratuit)')
      return extractWithTesseract(imageFile, onProgress)
    }
  }

  // Mode explicite
  if (engine === 'google-vision') {
    if (!isGoogleVisionConfigured()) {
      return {
        success: false,
        error: 'Google Cloud Vision non configuré. Ajoutez VITE_GOOGLE_CLOUD_VISION_API_KEY dans .env'
      }
    }
    return extractWithGoogleVision(imageFile, onProgress)
  }

  if (engine === 'tesseract') {
    return extractWithTesseract(imageFile, onProgress)
  }

  return {
    success: false,
    error: 'Moteur OCR invalide'
  }
}

/**
 * Retourne le moteur OCR qui sera utilisé
 */
export function getActiveOCREngine(): { engine: OCREngine; name: string; precision: string } {
  if (isGoogleVisionConfigured()) {
    return {
      engine: 'google-vision',
      name: 'Google Cloud Vision',
      precision: '95%+'
    }
  }
  return {
    engine: 'tesseract',
    name: 'Tesseract.js',
    precision: '75-85%'
  }
}

/**
 * Valide qu'une image est de bonne qualité pour l'OCR
 */
export async function validateImageQuality(file: File): Promise<{
  valid: boolean
  warnings: string[]
}> {
  const warnings: string[] = []

  // Vérifier la taille
  if (file.size < 50 * 1024) {
    warnings.push('Image très petite - la qualité OCR pourrait être réduite')
  }

  if (file.size > 10 * 1024 * 1024) {
    warnings.push('Image très grande - le traitement pourrait être lent')
  }

  // Vérifier les dimensions
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        if (img.width < 800 || img.height < 500) {
          warnings.push('Résolution faible - essayez une image de meilleure qualité')
        }

        if (img.width > 4000 || img.height > 4000) {
          warnings.push('Résolution très élevée - l\'image sera redimensionnée')
        }

        resolve({
          valid: warnings.length === 0,
          warnings
        })
      }
      img.onerror = () => {
        resolve({
          valid: false,
          warnings: ['Impossible de charger l\'image']
        })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
