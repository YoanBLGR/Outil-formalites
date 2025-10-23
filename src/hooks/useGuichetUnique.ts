/**
 * Hook React pour gérer l'intégration avec le Guichet Unique INPI
 *
 * Gère la création de formalités en brouillon et la synchronisation
 * avec le dossier Formalyse.
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Dossier } from '../types'
import type { StatutsData } from '../types/statuts'
import type { GUCreateFormalityResponse } from '../types/guichet-unique'
import {
  isGuichetUniqueConfigured,
  createDraftFormality,
  testConnection,
  GUApiError,
  GUValidationError,
  GUAuthenticationError,
} from '../services/guichet-unique-api'
import {
  mapDossierToGUFormality,
  validateDossierForGU,
} from '../utils/gu-mapper'
import {
  mapDossierEIToGUFormality,
  validateDossierEIForGU,
} from '../utils/gu-mapper-ei'
import { getDatabase } from '../db/database'

// ==============================================
// TYPES
// ==============================================

export interface GuichetUniqueState {
  isConfigured: boolean
  isLoading: boolean
  error: string | null
  formalityId: string | null
  formalityUrl: string | null
}

export interface CreateFormalityOptions {
  onProgress?: (step: string, progress: number) => void
}

// ==============================================
// HOOK
// ==============================================

/**
 * Hook pour gérer l'intégration avec le Guichet Unique
 */
export function useGuichetUnique() {
  const [state, setState] = useState<GuichetUniqueState>({
    isConfigured: isGuichetUniqueConfigured(),
    isLoading: false,
    error: null,
    formalityId: null,
    formalityUrl: null,
  })

  /**
   * Met à jour l'état
   */
  const updateState = useCallback((updates: Partial<GuichetUniqueState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * Teste la connexion au Guichet Unique
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!state.isConfigured) {
      toast.error('Le Guichet Unique n\'est pas configuré')
      return false
    }

    updateState({ isLoading: true, error: null })

    try {
      const result = await testConnection()

      if (result.success) {
        toast.success('Connexion au Guichet Unique réussie')
        updateState({ isLoading: false })
        return true
      } else {
        toast.error(`Échec de connexion : ${result.error}`)
        updateState({ isLoading: false, error: result.error })
        return false
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      toast.error(`Erreur lors du test de connexion : ${message}`)
      updateState({ isLoading: false, error: message })
      return false
    }
  }, [state.isConfigured, updateState])

  /**
   * Crée une formalité en brouillon sur le Guichet Unique
   */
  const createFormality = useCallback(
    async (
      dossier: Dossier,
      statutsData: Partial<StatutsData>,
      options?: CreateFormalityOptions
    ): Promise<GUCreateFormalityResponse | null> => {
      // Vérifier la configuration
      if (!state.isConfigured) {
        toast.error(
          'Le Guichet Unique n\'est pas configuré. Ajoutez vos credentials dans le fichier .env'
        )
        return null
      }

      // Démarrer le chargement
      updateState({ isLoading: true, error: null })
      options?.onProgress?.('Validation des données', 10)

      try {
        // Étape 1 : Validation des données
        let validation: { valid: boolean; errors: string[] }
        
        if (dossier.typeDossier === 'EI') {
          validation = validateDossierEIForGU(dossier)
        } else {
          validation = validateDossierForGU(dossier, statutsData)
        }
        
        if (!validation.valid) {
          const errorMessage = `Données incomplètes :\n${validation.errors.join('\n')}`
          toast.error(errorMessage, { duration: 8000 })
          updateState({ isLoading: false, error: errorMessage })
          return null
        }

        options?.onProgress?.('Préparation des données', 30)

        // Étape 2 : Mapper les données
        let formalityData
        
        if (dossier.typeDossier === 'EI') {
          formalityData = await mapDossierEIToGUFormality(dossier)
        } else {
          formalityData = await mapDossierToGUFormality(dossier, statutsData)
        }

        options?.onProgress?.('Connexion au Guichet Unique', 50)

        // Étape 3 : Créer la formalité
        const response = await createDraftFormality(formalityData)

        options?.onProgress?.('Formalité créée', 80)

        // Étape 4 : Mettre à jour le dossier dans la base de données
        await updateDossierWithGUData(dossier.id, response)

        options?.onProgress?.('Terminé', 100)

        // Mettre à jour l'état
        updateState({
          isLoading: false,
          formalityId: response.formalityId,
          formalityUrl: response.url,
        })

        // Afficher un message de succès
        toast.success(
          `Formalité créée avec succès !${response.url ? ' Vous pouvez la consulter sur le Guichet Unique.' : ''}`,
          { duration: 6000 }
        )

        // Afficher des warnings si présents
        if (response.warnings && response.warnings.length > 0) {
          response.warnings.forEach((warning) => {
            toast.warning(warning.message, { duration: 5000 })
          })
        }

        return response
      } catch (error) {
        options?.onProgress?.('Erreur', 0)

        // Gérer les différents types d'erreurs
        let errorMessage = 'Une erreur est survenue'

        if (error instanceof GUAuthenticationError) {
          errorMessage = 'Échec de l\'authentification. Vérifiez vos identifiants Guichet Unique dans le fichier .env'
        } else if (error instanceof GUValidationError) {
          errorMessage = `Erreur de validation :\n${error.errors?.map((e) => `- ${e.message}`).join('\n') || error.message}`
        } else if (error instanceof GUApiError) {
          errorMessage = error.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        toast.error(errorMessage, { duration: 8000 })
        updateState({ isLoading: false, error: errorMessage })
        return null
      }
    },
    [state.isConfigured, updateState]
  )

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setState({
      isConfigured: isGuichetUniqueConfigured(),
      isLoading: false,
      error: null,
      formalityId: null,
      formalityUrl: null,
    })
  }, [])

  return {
    ...state,
    checkConnection,
    createFormality,
    reset,
  }
}

// ==============================================
// HELPERS
// ==============================================

/**
 * Met à jour le dossier avec les données de la formalité GU créée
 */
async function updateDossierWithGUData(
  dossierId: string,
  response: GUCreateFormalityResponse
): Promise<void> {
  try {
    const db = await getDatabase()
    const dossier = await db.dossiers.findOne(dossierId).exec()

    if (!dossier) {
      console.warn(`Dossier ${dossierId} non trouvé pour mise à jour GU`)
      return
    }

    // Mettre à jour les données GU dans le dossier
    await dossier.patch({
      guichetUnique: {
        formalityId: response.formalityId,
        status: response.status,
        createdAt: response.createdAt,
        url: response.url,
        reference: response.reference,
      },
      updatedAt: new Date().toISOString(),
    })

    // Ajouter une entrée dans la timeline
    await dossier.patch({
      timeline: [
        ...dossier.timeline,
        {
          id: `gu-${Date.now()}`,
          type: 'AUTRE',
          description: `Formalité créée sur le Guichet Unique (${response.reference || response.formalityId})`,
          createdAt: new Date().toISOString(),
          createdBy: 'Système',
          metadata: {
            formalityId: response.formalityId,
            status: response.status,
            url: response.url,
          },
        },
      ],
    })

    // Optionnel : Passer le statut à FORMALITE_SAISIE si c'est pertinent
    if (dossier.statut !== 'FORMALITE_SAISIE') {
      await dossier.patch({
        statut: 'FORMALITE_SAISIE',
      })
    }

    console.log(`✅ Dossier ${dossierId} mis à jour avec les données GU`)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du dossier avec les données GU:', error)
    // Ne pas faire échouer la création si la mise à jour du dossier échoue
  }
}
