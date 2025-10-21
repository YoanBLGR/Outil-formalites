import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { CNIDataPreview } from './CNIDataPreview'
import { extractCNIData, validateImageQuality, getActiveOCREngine } from '../../services/ocr-cni'
import type { CNIData, OCRResult } from '../../types'
import { Camera, Upload, Loader2, AlertCircle, RefreshCw, X, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface CNIUploadProps {
  onDataExtracted: (data: CNIData) => void
  onError?: (error: string) => void
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

/**
 * Composant pour uploader et extraire les données d'une CNI
 */
export function CNIUpload({ onDataExtracted, onError }: CNIUploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [activeEngine, setActiveEngine] = useState<{ engine: string; name: string; precision: string } | null>(null)

  useEffect(() => {
    const engine = getActiveOCREngine()
    setActiveEngine(engine)
  }, [])

  const processImage = useCallback(async (file: File) => {
    try {
      setState('uploading')
      setProgress(0)
      setWarnings([])

      // Créer l'aperçu de l'image
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Valider la qualité de l'image
      const quality = await validateImageQuality(file)
      if (quality.warnings.length > 0) {
        setWarnings(quality.warnings)
      }

      setState('processing')
      toast.info('Analyse de votre CNI en cours...')

      // Extraire les données
      const result = await extractCNIData(file, (p) => {
        setProgress(p)
      })

      setOcrResult(result)

      if (result.success && result.data) {
        setState('success')
        toast.success('Données extraites avec succès !', {
          description: `Confiance: ${result.data.confidence}%`
        })
      } else {
        setState('error')
        const errorMsg = result.error || 'Impossible d\'extraire les données'
        toast.error('Extraction échouée', {
          description: errorMsg
        })
        onError?.(errorMsg)
      }

    } catch (error) {
      console.error('Erreur lors du traitement:', error)
      setState('error')
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
      toast.error('Erreur', { description: errorMsg })
      onError?.(errorMsg)
    }
  }, [onError])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processImage(acceptedFiles[0])
    }
  }, [processImage])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heic': ['.heic']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const handleApplyData = (data: CNIData) => {
    onDataExtracted(data)
    toast.success('Données appliquées au formulaire !')
    handleReset()
  }

  const handleReset = () => {
    setState('idle')
    setProgress(0)
    setOcrResult(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setWarnings([])
  }

  // État idle - Zone d'upload
  if (state === 'idle') {
    return (
      <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`cursor-pointer transition-colors rounded-lg p-8 text-center ${
              isDragActive
                ? 'bg-blue-100 border-2 border-blue-400'
                : 'hover:bg-blue-100/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-blue-900">
                    💡 Gain de temps : Scannez votre CNI
                  </h3>
                  {activeEngine && (
                    <Badge
                      variant={activeEngine.engine === 'google-vision' ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {activeEngine.engine === 'google-vision' ? (
                        <Sparkles className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      {activeEngine.name} ({activeEngine.precision})
                    </Badge>
                  )}
                </div>
                {isDragActive ? (
                  <p className="text-blue-700 font-medium">
                    Déposez votre CNI ici...
                  </p>
                ) : (
                  <>
                    <p className="text-blue-700 mb-2">
                      Glissez une photo de CNI ici ou cliquez pour parcourir
                    </p>
                    <p className="text-sm text-blue-600">
                      Formats acceptés: JPG, PNG, HEIC (max 10MB)
                    </p>
                  </>
                )}
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="mr-2 h-4 w-4" />
                Parcourir
              </Button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-100/50 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              ⓘ Assurez-vous que la CNI est bien lisible et correctement éclairée pour de meilleurs résultats
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // État uploading/processing - Chargement
  if (state === 'uploading' || state === 'processing') {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {previewUrl && (
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Aperçu CNI"
                  className="max-h-48 rounded-lg border-2 border-blue-200 shadow-md"
                />
              </div>
            )}

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">
                  ✨ Analyse de votre CNI en cours...
                </h3>
                <p className="text-sm text-muted-foreground">
                  {state === 'uploading' && 'Chargement de l\'image...'}
                  {state === 'processing' && progress < 25 && 'Préparation de l\'image...'}
                  {state === 'processing' && progress >= 25 && progress < 90 && 'Extraction du texte...'}
                  {state === 'processing' && progress >= 90 && 'Analyse des données...'}
                </p>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm font-medium text-blue-700">{Math.round(progress)}%</p>
              </div>

              {warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="text-xs space-y-1">
                      {warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // État success - Affichage des données
  if (state === 'success' && ocrResult?.data) {
    return (
      <div className="space-y-4">
        {previewUrl && (
          <div className="flex justify-center">
            <img
              src={previewUrl}
              alt="Aperçu CNI"
              className="max-h-32 rounded-lg border-2 border-green-200 shadow-md"
            />
          </div>
        )}

        <CNIDataPreview
          data={ocrResult.data}
          fieldConfidence={ocrResult.fieldConfidence}
          onApply={handleApplyData}
          onCancel={handleReset}
        />
      </div>
    )
  }

  // État error - Affichage de l'erreur
  if (state === 'error') {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Extraction échouée
              </h3>
              <p className="text-sm text-red-700 mb-4">
                {ocrResult?.error || 'Impossible d\'extraire les données de la CNI'}
              </p>

              {ocrResult?.rawText && (
                <details className="text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Afficher le texte brut extrait
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {ocrResult.rawText}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={handleReset} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
              <Button onClick={handleReset} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>

            <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg text-left">
              <p className="text-xs text-orange-800">
                <strong>Conseils pour une meilleure extraction :</strong>
              </p>
              <ul className="text-xs text-orange-700 mt-2 space-y-1">
                <li>• Assurez-vous que l'image est nette et bien éclairée</li>
                <li>• Évitez les reflets et les ombres</li>
                <li>• Photographiez la CNI à plat sur un fond uni</li>
                <li>• Utilisez une résolution d'au moins 800x600 pixels</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
