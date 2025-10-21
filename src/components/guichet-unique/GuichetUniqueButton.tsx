/**
 * Composant bouton pour créer une formalité sur le Guichet Unique INPI
 *
 * Permet de :
 * - Vérifier la configuration du GU
 * - Créer une formalité en brouillon
 * - Afficher la progression
 * - Rediriger vers le portail GU
 */

import { useState } from 'react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Alert, AlertDescription } from '../ui/alert'
import { Building2, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useGuichetUnique } from '../../hooks/useGuichetUnique'
import type { Dossier } from '../../types'
import type { StatutsData } from '../../types/statuts'

export interface GuichetUniqueButtonProps {
  dossier: Dossier
  statutsData: Partial<StatutsData>
  disabled?: boolean
  onSuccess?: (formalityId: string, url?: string) => void
}

/**
 * Composant bouton Guichet Unique
 */
export function GuichetUniqueButton({
  dossier,
  statutsData,
  disabled,
  onSuccess,
}: GuichetUniqueButtonProps) {
  const gu = useGuichetUnique()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [progressStep, setProgressStep] = useState('')
  const [progressValue, setProgressValue] = useState(0)

  // Vérifier si une formalité existe déjà
  const hasFormalite = !!dossier.guichetUnique?.formalityId

  /**
   * Ouvre la modal de confirmation
   */
  const handleOpenModal = () => {
    setIsModalOpen(true)
    setProgressStep('')
    setProgressValue(0)
    gu.reset()
  }

  /**
   * Crée la formalité
   */
  const handleCreateFormality = async () => {
    const response = await gu.createFormality(dossier, statutsData, {
      onProgress: (step, progress) => {
        setProgressStep(step)
        setProgressValue(progress)
      },
    })

    if (response) {
      onSuccess?.(response.formalityId, response.url)
      // Garder la modal ouverte pour afficher le résultat
    }
  }

  /**
   * Ouvre la formalité sur le portail GU
   */
  const handleOpenGU = () => {
    if (gu.formalityUrl || dossier.guichetUnique?.url) {
      window.open(gu.formalityUrl || dossier.guichetUnique?.url, '_blank')
    }
  }

  /**
   * Ferme la modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    gu.reset()
  }

  // État de configuration
  if (!gu.isConfigured) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Le Guichet Unique n'est pas configuré. Ajoutez vos credentials dans le fichier{' '}
          <code>.env</code> (voir <code>.env.example</code>).
        </AlertDescription>
      </Alert>
    )
  }

  // Si une formalité existe déjà
  if (hasFormalite) {
    return (
      <Button
        variant="outline"
        onClick={handleOpenGU}
        disabled={!dossier.guichetUnique?.url}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Voir sur le Guichet Unique
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="default"
        onClick={handleOpenModal}
        disabled={disabled || gu.isLoading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {gu.isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Création en cours...
          </>
        ) : (
          <>
            <Building2 className="mr-2 h-4 w-4" />
            Saisir au Guichet Unique
          </>
        )}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {gu.formalityId ? 'Formalité créée !' : 'Créer une formalité sur le Guichet Unique'}
            </DialogTitle>
            <DialogDescription>
              {gu.formalityId
                ? 'Votre formalité a été créée avec succès sur le Guichet Unique.'
                : 'Les données de votre dossier seront transmises au Guichet Unique de l\'INPI pour créer une formalité en brouillon.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* État : En cours */}
            {gu.isLoading && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="font-medium">{progressStep}</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            )}

            {/* État : Succès */}
            {gu.formalityId && !gu.isLoading && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 rounded-lg border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="font-medium text-green-900">Formalité créée avec succès</p>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>
                        <strong>ID :</strong> {gu.formalityId}
                      </p>
                      {dossier.guichetUnique?.reference && (
                        <p>
                          <strong>Référence :</strong> {dossier.guichetUnique.reference}
                        </p>
                      )}
                      {dossier.guichetUnique?.status && (
                        <p>
                          <strong>Statut :</strong> {dossier.guichetUnique.status}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {gu.formalityUrl && (
                  <Button
                    variant="default"
                    onClick={handleOpenGU}
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ouvrir sur le Guichet Unique
                  </Button>
                )}
              </div>
            )}

            {/* État : Erreur */}
            {gu.error && !gu.isLoading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-line">
                  {gu.error}
                </AlertDescription>
              </Alert>
            )}

            {/* État : Initial */}
            {!gu.isLoading && !gu.formalityId && !gu.error && (
              <div className="space-y-3">
                <Alert>
                  <Building2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Société :</strong> {dossier.societe.denomination} ({dossier.societe.formeJuridique})
                    <br />
                    <strong>Capital :</strong>{' '}
                    {(dossier.societe.capitalSocial || statutsData.capitalSocial || 0).toLocaleString('fr-FR')} €
                  </AlertDescription>
                </Alert>

                <p className="text-sm text-gray-600">
                  Une formalité en brouillon sera créée. Vous pourrez la compléter et la déposer depuis
                  le portail du Guichet Unique.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {!gu.formalityId ? (
              <>
                <Button variant="outline" onClick={handleCloseModal} disabled={gu.isLoading}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateFormality}
                  disabled={gu.isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {gu.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer la formalité'
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleCloseModal}>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
