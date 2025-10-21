import type { OCRResult } from '../types'
import { parseCNIText, validateCNIData } from '../utils/cni-parser'

/**
 * Service OCR utilisant Google Cloud Vision API
 * Plus précis que Tesseract, supporte CNI, passeports, permis de conduire
 */

const GOOGLE_VISION_API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate'

/**
 * Convertit un fichier en base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Vérifie si la clé API Google Cloud Vision est configurée
 */
export function isGoogleVisionConfigured(): boolean {
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY
  return !!apiKey && apiKey.length > 0
}

/**
 * Obtient la clé API depuis les variables d'environnement
 */
function getApiKey(): string {
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY
  if (!apiKey) {
    throw new Error(
      'Clé API Google Cloud Vision manquante. Ajoutez VITE_GOOGLE_CLOUD_VISION_API_KEY dans votre fichier .env'
    )
  }
  return apiKey
}

/**
 * Extrait les données d'un document d'identité via Google Cloud Vision API
 *
 * @param imageFile - Fichier image (CNI, passeport, permis)
 * @param onProgress - Callback pour suivre la progression (0-100)
 * @returns Promise avec le résultat de l'extraction
 */
export async function extractWithGoogleVision(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const startTime = Date.now()

  try {
    onProgress?.(10)

    // Vérifier que la clé API est configurée
    const apiKey = getApiKey()

    onProgress?.(20)

    // Convertir l'image en base64
    const base64Image = await fileToBase64(imageFile)

    onProgress?.(40)

    // Préparer la requête pour Google Vision API
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION', // Meilleur pour documents structurés
              maxResults: 1
            }
          ],
          imageContext: {
            languageHints: ['fr'] // Français
          }
        }
      ]
    }

    onProgress?.(50)

    // Appeler l'API Google Cloud Vision
    const response = await fetch(`${GOOGLE_VISION_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    onProgress?.(70)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        error.error?.message || `Erreur API Google Vision: ${response.status}`
      )
    }

    const data = await response.json()

    onProgress?.(85)

    // Extraire le texte
    const textAnnotation = data.responses?.[0]?.fullTextAnnotation
    if (!textAnnotation || !textAnnotation.text) {
      return {
        success: false,
        error: 'Aucun texte détecté dans le document',
        processingTime: Date.now() - startTime
      }
    }

    const rawText = textAnnotation.text

    onProgress?.(90)

    // Parser le texte extrait avec notre parser CNI
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
    console.error('Erreur Google Vision:', error)

    // Messages d'erreur spécifiques
    let errorMessage = 'Erreur lors de l\'analyse de l\'image'

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Clé API invalide ou non configurée'
      } else if (error.message.includes('quota')) {
        errorMessage = 'Quota API dépassé. Réessayez plus tard.'
      } else if (error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permissions insuffisantes. Vérifiez votre clé API.'
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: errorMessage,
      processingTime
    }
  }
}

/**
 * Détecte le type de document (CNI, passeport, permis)
 * Peut être utilisé pour adapter le parsing
 */
export async function detectDocumentType(
  imageFile: File
): Promise<'CNI' | 'PASSPORT' | 'DRIVER_LICENSE' | 'UNKNOWN'> {
  try {
    const apiKey = getApiKey()
    const base64Image = await fileToBase64(imageFile)

    const requestBody = {
      requests: [
        {
          image: { content: base64Image },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 10
            }
          ]
        }
      ]
    }

    const response = await fetch(`${GOOGLE_VISION_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()
    const text = data.responses?.[0]?.fullTextAnnotation?.text || ''

    // Détection par mots-clés
    if (text.includes('CARTE NATIONALE') || text.includes('IDENTITE')) {
      return 'CNI'
    }
    if (text.includes('PASSEPORT') || text.includes('PASSPORT')) {
      return 'PASSPORT'
    }
    if (text.includes('PERMIS DE CONDUIRE') || text.includes('DRIVER')) {
      return 'DRIVER_LICENSE'
    }

    return 'UNKNOWN'
  } catch (error) {
    console.error('Erreur détection type:', error)
    return 'UNKNOWN'
  }
}

/**
 * Retourne les informations sur l'utilisation de l'API
 */
export function getAPIInfo() {
  return {
    provider: 'Google Cloud Vision',
    precision: '95%+',
    freeQuota: '1000 requêtes/mois',
    cost: '$1.50 / 1000 requêtes au-delà',
    docs: 'https://cloud.google.com/vision/docs',
    configured: isGoogleVisionConfigured()
  }
}
