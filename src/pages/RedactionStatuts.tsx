import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Progress } from '../components/ui/progress'
import { Select } from '../components/ui/select'
import { FormSection } from '../components/redaction/FormSection'
import { DocumentPreview, type DocumentPreviewRef } from '../components/redaction/DocumentPreview'
import { WizardNavigation } from '../components/redaction/WizardNavigation'
import { AssociesListForm } from '../components/redaction/AssociesListForm'
import { StepperCompact } from '../components/ui/stepper-compact'
import { ResizablePanels } from '../components/ui/resizable-panels'
import { getDatabase } from '../db/database'
import type { Dossier } from '../types'
import type { StatutsData, TypeApport, AssociePersonnePhysique, AssociePersonneMorale, ApportNumeraire, ApportNature, ApportMixte, ApportFondsCommerce, ApportBienCommun, ApportBienIndivis, RegimeCessionActions, RegimeCession, TransmissionDeces, LiquidationCommunaute, ExploitType } from '../types/statuts'
import { TYPE_APPORT_LABELS, OPTION_FISCALE_LABELS } from '../types/statuts'
import { generateStatuts, calculateProgression } from '../utils/template-engine'
import { fillMandatCCI } from '../utils/mandat-cci-generator'
import { fillAvisConstitution } from '../utils/avis-constitution-generator'
import { encodeBase64 } from '../utils/encoding-helpers'
import { ArrowLeft, Save, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { TrackedInput, TrackedTextarea } from '../components/ui/tracked-input'
import { AIChat, AIChatButton } from '../components/ai/AIChat'
import { ObjetSocialSuggestions, AIStatusIndicator } from '../components/ai/InlineSuggestions'
import { REDACTION_STEPS, STEP_SECTIONS, isStepComplete, getStepValidationErrors, getSectionTitle } from '../config/redaction-steps'
import { GuichetUniqueButton } from '../components/guichet-unique/GuichetUniqueButton'

export function RedactionStatuts() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [statutsData, setStatutsData] = useState<Partial<StatutsData>>({})
  const [previewContent, setPreviewContent] = useState('')
  const [progression, setProgression] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<string | undefined>(undefined)
  const [currentStep, setCurrentStep] = useState(0)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [activeField, setActiveField] = useState<{ name: string; value: string; context?: string } | undefined>()
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const previewRef = useRef<DocumentPreviewRef>(null)
  const isInitialMount = useRef(true)

  // Charger le dossier
  useEffect(() => {
    if (id) {
      loadDossier(id)
    }
  }, [id])

  // Fonction pour obtenir les valeurs par défaut
  const getDefaultStatutsData = (dossierData: Dossier): Partial<StatutsData> => {
    const isSASU = dossierData.societe.formeJuridique === 'SASU' || dossierData.societe.formeJuridique === 'SAS'
    const isSARL = dossierData.societe.formeJuridique === 'SARL' || dossierData.societe.formeJuridique === 'SAS'

    const baseDefaults: Partial<StatutsData> = {
            // Section 0: Associé unique (EURL/SASU) ou Associés (SARL/SAS)
            ...(isSARL ? {
              associes: {
                liste: [],
                nombreTotal: 0,
              },
            } : {
              associeUnique: {
                type: 'PERSONNE_PHYSIQUE',
                civilite: dossierData.client.civilite,
                nom: dossierData.client.nom,
                prenom: dossierData.client.prenom,
                dateNaissance: '',
                lieuNaissance: '',
                nationalite: 'française',
                adresse: '',
                pourcentageCapital: 100, // Associé unique détient 100% du capital
              },
            }),

            // Section 1: Identité
            formeJuridique: dossierData.societe.formeJuridique,
            denomination: dossierData.societe.denomination,
            sigle: '',
            siegeSocial: dossierData.societe.siege,
            objetSocial: dossierData.societe.objetSocial || '',

            // Section 2: Durée
            duree: 99,

            // Section 3: Capital et apports
            capitalSocial: dossierData.societe.capitalSocial || 1000,
            nombreParts: isSASU ? undefined : 100,
            nombreActions: isSASU ? 100 : undefined,
            valeurNominale: (dossierData.societe.capitalSocial || 1000) / 100,
            apportDetaille: {
              type: 'NUMERAIRE_TOTAL',
              montant: dossierData.societe.capitalSocial || 1000,
              montantLibere: dossierData.societe.capitalSocial || 1000,
              pourcentageLibere: 100,
              montantRestant: 0,
              nombreParts: isSASU ? 0 : 100,
              nombreActions: isSASU ? 100 : undefined,
            },
            depotFonds: {
              date: '',
              etablissement: '',
            },

            // Section 4: Parts sociales ou Actions
            partsSociales: {
              nombreTotal: 100,
              valeurNominale: (dossierData.societe.capitalSocial || 1000) / 100,
              repartition: [],
            },

            // Section 5 supprimée (Nantissement) - aucun template actuel ne l'utilise

            // Variables SARL spécifiques (Article 8, Article 12)
            droitPreferentielSouscription: false, // Article 8: Droit préférentiel de souscription en cas d'augmentation de capital
            repartitionVotesUsufruit: 'NU_PROPRIETAIRE', // Article 12: Répartition votes usufruit/nu-propriétaire

            // Section 7: Exercice social
            exerciceSocial: {
              dateDebut: '1er janvier',
              dateFin: '31 décembre',
              premierExerciceFin: `31 décembre ${new Date().getFullYear()}`,
            },

            // Section 8: Commissaires aux comptes
            commissairesAuxComptes: {
              obligatoire: false,
            },

            // Section 9: Conventions réglementées
            conventionsReglementees: {
              presente: true, // Toujours présent dans les statuts
            },

            // Section 11: Actes en formation
            actesFormation: {
              presents: false,
            },

            // Autres champs communs
            affectationResultats: {
              reserveLegale: 5,
              reportNouveau: true,
              dividendes: 'Le solde est mis en réserve ou distribué selon la décision de l\'associé unique.',
            },
            modalitesDecisions: 'Décisions prises par l\'associé unique',
            dissolutionLiquidation: {
              causes: ['Arrivée du terme', 'Décision de l\'associé unique', 'Dissolution judiciaire'],
              liquidateur: isSASU ? 'le Président' : 'le gérant',
              modalites: 'Selon les dispositions légales',
            },
            formalites: {
              depot: 'Greffe du tribunal de commerce',
              publicite: 'Journal d\'annonces légales',
            },

            // Signature
            nombreExemplaires: 3,
    }

    // Ajouter les champs spécifiques EURL/SARL
    if (!isSASU) {
      return {
        ...baseDefaults,
        // Section 6: Gérance
        gerant: {
          isAssocieUnique: true,
          dureeMandat: 'durée de la société',
          remuneration: {
            type: 'AUCUNE',
          },
          pouvoirs: 'Pouvoirs les plus étendus',
        },
        nominationGerant: {
          gerantDansStatuts: true,
          gerantEstAssocie: true,
          dureeNomination: 'indéterminée',
          remunerationFixee: false,
        },
        // Section 10: Options (EURL uniquement)
        clauseCompromissoire: {
          presente: false,
        },
        optionFiscale: 'IMPOT_SOCIETES',
        delaiArbitrage: 6,
        // Article 11 (EURL) / Article 13 (SARL): Admission de nouveaux associés / Cessions
        admissionAssocies: {
          regimeCession: 'LIBRE_ASSOCIES_FAMILIAL', // Libre entre associés et famille, agrément pour tiers
          exploitType: 'HUISSIER',
          majoriteCessionTiers: 'la moitié',
          majoriteMutation: 'la moitié',
          modalitesPrixRachat: '',
          transmissionDeces: 'HERITIERS_SANS_AGREMENT',
          liquidationCommunaute: 'NON_APPLICABLE',
          locationParts: 'INTERDITE', // Pour SARL uniquement (Article 13.5)
        },
        // Articles 14-15: Gérance (majorités et délais)
        majoriteNominationGerant: 'la moitié',
        majoriteRevocationGerant: 'la moitié',
        delaiPreavisGerant: 3,
        // Article 16: Limitations de pouvoirs
        limitationsPouvoirs: false,
        // Article 21: Comptes courants
        compteCourant: {
          seuilMinimum: 5,
        },
        transmissionParts: {
          agrementRequis: true,
          droitPreemption: false,
        },
        // Article 24: Décisions collectives (SARL uniquement)
        formesDecisionsCollectives: 'DIVERSES',
        decisionsOrdinaires: 'LEGALE_AVEC_SECONDE',
        majoriteOrdinairesRenforcee: 'deux tiers',
        quorumExtraordinaire1: 'le quart',
        quorumExtraordinaire2: 'le cinquième',
        majoriteExtraordinaire: 'des deux tiers',
      }
    }

    // Ajouter les champs spécifiques SASU/SAS
    return {
      ...baseDefaults,
      // Section 6: Présidence
      president: {
        isAssocieUnique: true,
        dureeMandat: 'sans limitation de durée',
        remuneration: {
          type: 'AUCUNE',
        },
        delaiPreavis: 3,
        modeRevocation: 'à tout moment',
      },
      nominationPresident: {
        presidentDansStatuts: true,
        presidentEstAssocie: true,
        dureeNomination: 'sans limitation de durée',
        remunerationFixee: false,
      },
      // Article 11: Transmission des actions
      transmissionActions: {
        regimeCession: 'LIBRE',
        majoriteAgrement: 'l\'unanimité',
        modalitesPrixRachat: '',
      },
      // Articles 17-18: Décisions collectives
      quorumDecisions: '50%',
      delaiConvocationAssemblee: 15,
      delaiConsultationEcrite: 15,
      signatairePV: 'le Président',
      delaiInformationResultat: 15,
    }
  }

  const loadDossier = async (dossierId: string) => {
    try {
      setLoading(true)
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(dossierId).exec()

      if (doc) {
        const dossierData = doc.toJSON() as Dossier
        setDossier(dossierData)

        // Obtenir les valeurs par défaut
        const defaults = getDefaultStatutsData(dossierData)

        // Auto-fill depuis le dossier ou le draft existant
        if (dossierData.statutsDraft?.data) {
          // Merger les données du draft avec les defaults pour s'assurer que les nouvelles valeurs par défaut sont présentes
          const draftData = dossierData.statutsDraft.data
          const mergedData: Partial<StatutsData> = {
            ...defaults,
            ...draftData,
            // Merger en profondeur les objets imbriqués uniquement s'ils existent
            ...(draftData.associeUnique && {
              associeUnique: {
                ...defaults.associeUnique,
                ...draftData.associeUnique,
              },
            }),
            ...(draftData.apportDetaille && {
              apportDetaille: {
                ...defaults.apportDetaille,
                ...draftData.apportDetaille,
              },
            }),
            ...(draftData.gerant && {
              gerant: {
                ...defaults.gerant,
                ...draftData.gerant,
              },
            }),
            ...(draftData.nominationGerant && {
              nominationGerant: {
                ...defaults.nominationGerant,
                ...draftData.nominationGerant,
              },
            }),
            ...(draftData.president && {
              president: {
                ...defaults.president,
                ...draftData.president,
              },
            }),
            ...(draftData.nominationPresident && {
              nominationPresident: {
                ...defaults.nominationPresident,
                ...draftData.nominationPresident,
              },
            }),
            ...(draftData.transmissionActions && {
              transmissionActions: {
                ...defaults.transmissionActions,
                ...draftData.transmissionActions,
              },
            }),
            ...(draftData.clauseCompromissoire && {
              clauseCompromissoire: {
                ...defaults.clauseCompromissoire,
                ...draftData.clauseCompromissoire,
              },
            }),
            ...(draftData.exerciceSocial && {
              exerciceSocial: {
                ...defaults.exerciceSocial,
                ...draftData.exerciceSocial,
              },
            }),
          }
          setStatutsData(mergedData)
        } else {
          // Initialiser avec les valeurs par défaut
          setStatutsData(defaults)
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du dossier')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction de sauvegarde (définie avant les useEffects)
  const saveDraft = useCallback(async () => {
    if (!id || !dossier) return

    try {
      setIsSaving(true)
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc) {
        const draft = {
          id: dossier.statutsDraft?.id || crypto.randomUUID(),
          dossierId: id,
          formeJuridique: dossier.societe.formeJuridique,
          data: statutsData,
          progression: calculateProgression(statutsData),
          sections: {
            identite: !!(statutsData.denomination && statutsData.objetSocial && statutsData.siegeSocial),
            duree: !!statutsData.duree,
            capital: !!(statutsData.capitalSocial && statutsData.apportDetaille),
            parts: !!statutsData.partsSociales,
            gerant: !!statutsData.gerant,
            exercice: !!statutsData.exerciceSocial,
            resultats: !!statutsData.affectationResultats,
            decisions: !!statutsData.modalitesDecisions,
            transmission: !!statutsData.transmissionParts,
            dissolution: !!statutsData.dissolutionLiquidation,
            formalites: !!statutsData.formalites,
          },
          version: (dossier.statutsDraft?.version || 0) + 1,
          createdAt: dossier.statutsDraft?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Sauvegarder sans déclencher de re-fetch
        await doc.patch({
          statutsDraft: draft,
          updatedAt: new Date().toISOString(),
        })

        // Mettre à jour automatiquement le mandat CCI avec les données des statuts
        const mandatCCI = dossier.documents.find((d) => d.categorie === 'MANDAT')
        
        // Vérifier si on a les infos nécessaires pour remplir le mandat
        const hasDirigeantInfo = 
          (statutsData.gerant && (statutsData.gerant.isAssocieUnique || ((statutsData.gerant as any).nom && (statutsData.gerant as any).prenom))) ||
          (statutsData.president && (statutsData.president.isAssocieUnique || ((statutsData.president as any).nom && (statutsData.president as any).prenom))) ||
          (statutsData.associeUnique && (statutsData.associeUnique.type === 'PERSONNE_PHYSIQUE' ? (statutsData.associeUnique.nom && statutsData.associeUnique.prenom) : true))
        
        if (mandatCCI && hasDirigeantInfo) {
          const updatedMandat = fillMandatCCI(dossier.societe, statutsData)
          
          const updatedDocuments = dossier.documents.map((d) =>
            d.id === mandatCCI.id
              ? {
                  ...d,
                  fichier: encodeBase64(updatedMandat), // Encoder en base64 UTF-8
                  uploadedAt: new Date().toISOString(),
                  uploadedBy: 'Système (Auto)',
                }
              : d
          )

          await doc.patch({
            documents: updatedDocuments,
          })
          
          // Notification discrète de mise à jour du mandat
          console.log('✓ Mandat CCI mis à jour automatiquement')
        }

        // Mettre à jour automatiquement l'avis de constitution avec les données des statuts
        const avisConstitution = dossier.documents.find((d) => d.categorie === 'AVIS_CONSTITUTION')
        
        if (avisConstitution && hasDirigeantInfo) {
          const updatedAvis = fillAvisConstitution(dossier.societe, statutsData)
          
          const updatedDocuments = dossier.documents.map((d) =>
            d.id === avisConstitution.id
              ? {
                  ...d,
                  fichier: encodeBase64(updatedAvis), // Encoder en base64 UTF-8
                  uploadedAt: new Date().toISOString(),
                  uploadedBy: 'Système (Auto)',
                }
              : d
          )

          await doc.patch({
            documents: updatedDocuments,
          })
          
          // Notification discrète de mise à jour de l'avis
          console.log('✓ Avis de constitution mis à jour automatiquement')
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde draft:', error)
    } finally {
      setIsSaving(false)
    }
  }, [id, dossier, statutsData])

  // Mettre à jour la prévisualisation (debounced)
  useEffect(() => {
    if (!dossier || !statutsData) return

    const timer = setTimeout(() => {
      try {
        const content = generateStatuts(dossier, statutsData)
        setPreviewContent(content)

        const prog = calculateProgression(statutsData)
        setProgression(prog)
      } catch (error) {
        console.error('Erreur génération preview:', error)
      }
    }, 300) // Debounce de 300ms pour la preview

    return () => clearTimeout(timer)
  }, [dossier, statutsData])

  // Sauvegarde automatique (mise à jour mandat CCI incluse)
  useEffect(() => {
    if (!dossier || !id) return

    // Ne pas sauvegarder au premier chargement
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const timer = setTimeout(() => {
      saveDraft()
    }, 3000) // Sauvegarde après 3 secondes d'inactivité

    return () => clearTimeout(timer)
  }, [statutsData, dossier, id, saveDraft])

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!dossier) {
      toast.error('Aucun dossier chargé')
      return
    }

    try {
      const filename = `Statuts_${dossier.societe.denomination.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`

      toast.loading(`Génération du fichier ${format.toUpperCase()}...`, { id: 'export' })

      const { exportStatuts } = await import('../utils/export-utils')
      await exportStatuts(previewContent, format, filename)

      toast.success(`Document ${format.toUpperCase()} généré avec succès`, { id: 'export' })
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast.error(`Erreur lors de l'export ${format.toUpperCase()}`, { id: 'export' })
    }
  }

  const updateStatutsData = useCallback((updates: Partial<StatutsData>) => {
    setStatutsData((prev) => {
      const newData = { ...prev, ...updates }
      
      // Si le capital social ou le nombre de parts change, recalculer les parts des associés
      // en conservant leurs pourcentages respectifs
      const capitalChanged = updates.capitalSocial !== undefined && updates.capitalSocial !== prev.capitalSocial
      const partsChanged = updates.nombreParts !== undefined && updates.nombreParts !== prev.nombreParts
      const actionsChanged = updates.nombreActions !== undefined && updates.nombreActions !== prev.nombreActions
      
      if ((capitalChanged || partsChanged || actionsChanged) && newData.associes?.liste && newData.associes.liste.length > 0) {
        const nouveauCapital = newData.capitalSocial || 0
        const nouveauNombreTitres = newData.nombreParts || newData.nombreActions || 0
        
        // Recalculer les parts de chaque associé en conservant leur pourcentage
        const nouvelleListeAssocies = newData.associes.liste.map(item => {
          const pourcentage = item.associe.pourcentageCapital || 0
          return {
            ...item,
            nombreParts: Math.round((pourcentage / 100) * nouveauNombreTitres),
            montantApport: Math.round((pourcentage / 100) * nouveauCapital),
            pourcentageCapital: pourcentage
          }
        })
        
        newData.associes = {
          ...newData.associes,
          liste: nouvelleListeAssocies
        }
      }
      
      return newData
    })
  }, [])

  // Mapping des champs vers leurs contextes (articles/sections) pour une recherche précise
  const fieldToContextMap: Record<string, string> = {
    // Section 1 - Identité
    'denomination': 'Article 2',
    'objetSocial': 'Article 3',
    'siegeSocial': 'Article 4',
    
    // Section 2 - Durée
    'duree': 'Article 5',
    
    // Section 3 - Capital
    'capitalSocial': 'Article 6',
    'nombreParts': 'Article 6',
    'valeurNominale': 'Article 6',
    
    // Section 3bis - Dépôt de fonds
    'date': 'dépôt',
    'etablissement': 'dépôt',
    
    // Section 4 - Associé unique
    'nom': 'associé unique',
    'prenom': 'associé unique',
    'nationalite': 'nationalité',
    'dateNaissance': 'naissance',
    'lieuNaissance': 'naissance',
    'adresse': 'adresse',
    
    // Section 6 - Gérance
    'dureeMandat': 'Article 12',
    'majoriteNominationGerant': 'Article 14',
    'majoriteRevocationGerant': 'Article 15',
    'delaiPreavisGerant': 'Article 15',
    'pouvoirs': 'Article 16',
    
    // Section 7 - Exercice social
    'exerciceDebut': 'Article 23',
    'exerciceFin': 'Article 23',
  }

  // Gérer le focus sur un champ pour activer le highlight dans la prévisualisation
  const handleFieldFocus = useCallback((fieldName: string, fieldValue: string) => {
    if (fieldValue && fieldValue.trim()) {
      const context = fieldToContextMap[fieldName]
      setActiveField({ 
        name: fieldName, 
        value: fieldValue.trim(),
        context: context 
      } as any)
    }
  }, [])

  // Mettre à jour le champ actif pendant la frappe
  const handleFieldChange = useCallback((fieldName: string, fieldValue: string) => {
    if (fieldValue && fieldValue.trim()) {
      const context = fieldToContextMap[fieldName]
      setActiveField({ 
        name: fieldName, 
        value: fieldValue.trim(),
        context: context 
      } as any)
    } else {
      setActiveField(undefined)
    }
  }, [])

  // Effacer le highlight quand on quitte le champ
  const handleFieldBlur = useCallback(() => {
    setActiveField(undefined)
  }, [])

  // Vérifier si une section doit être affichée selon l'étape actuelle
  const shouldShowSection = useCallback((sectionId: string): boolean => {
    const sectionsForCurrentStep = STEP_SECTIONS[currentStep]
    return sectionsForCurrentStep?.includes(sectionId) ?? false
  }, [currentStep])

  // Mapper les IDs de section du formulaire aux IDs d'articles de la prévisualisation
  const getSectionArticleId = (formSectionId: string): string => {
    const mapping: Record<string, string> = {
      'section-0': 'preambule',
      'section-1': 'article-1',
      'section-2': 'article-5',
      'section-3': 'article-6',
      'section-3bis': 'article-6',
      'section-4': 'article-8',
      'section-5': 'article-10',
      'section-5bis': 'article-11',
      'section-6': 'article-12',
      'section-6bis': 'article-21',
      'section-7': 'article-22',
      'section-7bis': 'article-17',
      'section-8': 'article-23',
      'section-9': 'article-22', // Conventions réglementées (SARL)
      'section-9bis': 'article-24', // Décisions collectives (SARL)
      'section-10': 'article-25',
      'section-11': 'article-29',
      'section-12': 'article-30',
    }
    return mapping[formSectionId] || formSectionId
  }

  // Gérer le clic sur une section du formulaire
  const handleSectionClick = useCallback((formSectionId: string) => {
    console.log('🖱️ Section clicked:', formSectionId)
    const articleId = getSectionArticleId(formSectionId)
    console.log('🎯 Mapped to article:', articleId)
    setActiveSection(articleId)

    // Auto-hide highlight after 3 seconds
    setTimeout(() => {
      setActiveSection(undefined)
    }, 3000)
  }, [])

  // Navigation du wizard
  const handleNextStep = useCallback(() => {
    const errors = getStepValidationErrors(currentStep, statutsData)

    if (errors.length > 0) {
      toast.error(`Veuillez compléter tous les champs requis avant de continuer`)
      return
    }

    if (currentStep < REDACTION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      toast.success(`Étape "${REDACTION_STEPS[currentStep].title}" complétée !`)
    }
  }, [currentStep, statutsData])

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setValidationErrors([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  const handleStepClick = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex)
    setValidationErrors([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleComplete = useCallback(() => {
    // Vérifier si tout est complet
    const allStepsComplete = REDACTION_STEPS.every((_, index) =>
      isStepComplete(index, statutsData)
    )

    if (allStepsComplete) {
      toast.success('Statuts complétés ! Vous pouvez maintenant exporter le document.')
    } else {
      toast.warning('Veuillez compléter toutes les sections avant de finaliser.')
    }
  }, [statutsData])

  // Vérifier si on peut aller à l'étape suivante
  const canGoToNextStep = useMemo(() => {
    return isStepComplete(currentStep, statutsData)
  }, [currentStep, statutsData])

  // Mettre à jour les erreurs de validation (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const errors = getStepValidationErrors(currentStep, statutsData)
      // Ne mettre à jour que si les erreurs ont changé
      setValidationErrors(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(errors)) {
          return errors
        }
        return prev
      })
    }, 500) // Debounce de 500ms pour la validation

    return () => clearTimeout(timer)
  }, [currentStep, statutsData])

  if (loading) {
    return (
      <Layout title="Chargement..." subtitle="">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du dossier...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!dossier) {
    return (
      <Layout title="Erreur" subtitle="">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Dossier introuvable</h2>
          <Button onClick={() => navigate('/dossiers')} className="mt-4">
            Retour aux dossiers
          </Button>
        </div>
      </Layout>
    )
  }

  // Variables dynamiques selon la forme juridique
  const isSASU = dossier.societe.formeJuridique === 'SASU' || dossier.societe.formeJuridique === 'SAS'
  const labels = {
    titres: isSASU ? 'actions' : 'parts sociales',
    titre: isSASU ? 'action' : 'part sociale',
    Titres: isSASU ? 'Actions' : 'Parts sociales',
    Titre: isSASU ? 'Action' : 'Part sociale',
    nombreTitres: isSASU ? 'nombreActions' : 'nombreParts',
    dirigeant: isSASU ? 'président' : 'gérant',
    Dirigeant: isSASU ? 'Président' : 'Gérant',
    direction: isSASU ? 'présidence' : 'gérance',
    Direction: isSASU ? 'Présidence' : 'Gérance',
  }

  return (
    <Layout
      title={`Rédaction des statuts - ${dossier.numero}`}
      subtitle={dossier.societe.denomination}
      compact
    >
      {/* Indicateur de statut IA */}
      <AIStatusIndicator />
      
      <div className="h-[calc(100vh-80px)] flex flex-col gap-2">
        {/* Header compact */}
        <div className="pb-2 border-b space-y-2">
          {/* Ligne 1: Titre et actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/dossiers/${id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <div>
                <h2 className="text-base font-semibold">Rédaction - {dossier.numero}</h2>
                <p className="text-xs text-muted-foreground">{dossier.societe.denomination}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveDraft()}
                disabled={isSaving}
              >
                <Save className={`h-4 w-4 mr-2 ${isSaving ? 'animate-pulse' : ''}`} />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPreview ? 'Masquer' : 'Afficher'} preview
              </Button>

              {/* Bouton Guichet Unique - affiché si progression >= 70% */}
              {progression >= 70 && (
                <GuichetUniqueButton
                  dossier={dossier}
                  statutsData={statutsData}
                  disabled={progression < 100}
                  onSuccess={(formalityId, url) => {
                    console.log('Formalité créée:', formalityId, url)
                    // Recharger le dossier pour mettre à jour l'affichage
                    if (id) {
                      loadDossier(id)
                    }
                  }}
                />
              )}

              <div className="text-xs text-muted-foreground">
                {progression}%
              </div>
              <Progress value={progression} className="h-1.5 w-20" />
            </div>
          </div>

          {/* Ligne 2: Stepper */}
          <div className="flex items-center">
            <StepperCompact
              steps={REDACTION_STEPS}
              currentStep={currentStep}
              onStepClick={handleStepClick}
              allowClickNavigation={true}
            />
          </div>
        </div>

        {/* Contenu principal avec resize */}
        <ResizablePanels
          className="flex-1 overflow-hidden"
          showRightPanel={showPreview}
          defaultLeftWidth={showPreview ? 50 : 100}
          leftPanel={
            <div className="h-full flex flex-col px-1">

          <div className="flex-1 overflow-y-auto space-y-4 px-2 py-4">
            {/* Section 0: Associé(s) */}
            {shouldShowSection('section-0') && (
              <FormSection
                title={`0. ${getSectionTitle('section-0', dossier?.societe.formeJuridique)} (Préambule)`}
                subtitle={
                  dossier?.societe.formeJuridique === 'SARL' || dossier?.societe.formeJuridique === 'SAS'
                    ? "Liste des associés (minimum 2)"
                    : "Type d'associé (personne physique ou morale)"
                }
                completed={
                  dossier?.societe.formeJuridique === 'SARL' || dossier?.societe.formeJuridique === 'SAS'
                    ? !!(statutsData.associes?.liste && statutsData.associes.liste.length >= 2)
                    : !!statutsData.associeUnique
                }
                defaultOpen={
                  dossier?.societe.formeJuridique === 'SARL' || dossier?.societe.formeJuridique === 'SAS'
                    ? !(statutsData.associes?.liste && statutsData.associes.liste.length >= 2)
                    : !statutsData.associeUnique
                }
                sectionId="section-0"
                onSectionClick={handleSectionClick}
              >
              <div className="space-y-4">
                {/* SARL/SAS : Formulaire multi-associés */}
                {(dossier?.societe.formeJuridique === 'SARL' || dossier?.societe.formeJuridique === 'SAS') ? (
                  <AssociesListForm
                    associes={statutsData.associes || { liste: [], nombreTotal: 0 }}
                    capitalSocial={statutsData.capitalSocial || 1000}
                    nombreTotalParts={dossier?.societe.formeJuridique === 'SAS' ? (statutsData.nombreActions || 100) : (statutsData.nombreParts || 100)}
                    onChange={(associes) => updateStatutsData({ associes })}
                  />
                ) : (
                  // EURL/SASU : Formulaire associé unique
                  <>
                <div>
                  <Label>Type d'associé *</Label>
                  <Select
                    value={statutsData.associeUnique?.type || 'PERSONNE_PHYSIQUE'}
                    onChange={(e) => {
                      const type = e.target.value as 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE'
                      if (type === 'PERSONNE_PHYSIQUE') {
                        updateStatutsData({
                          associeUnique: {
                            type: 'PERSONNE_PHYSIQUE',
                            civilite: dossier?.client.civilite || 'M',
                            nom: dossier?.client.nom || '',
                            prenom: dossier?.client.prenom || '',
                            dateNaissance: '',
                            lieuNaissance: '',
                            nationalite: 'française',
                            adresse: '',
                            pourcentageCapital: 100, // Associé unique détient 100% du capital
                          },
                        })
                      } else {
                        updateStatutsData({
                          associeUnique: {
                            type: 'PERSONNE_MORALE',
                            societeNom: '',
                            societeFormeJuridique: '',
                            societeCapital: 0,
                            societeRCS: '',
                            societeNumeroRCS: '',
                            societeSiege: '',
                            representantNom: '',
                            representantPrenom: '',
                            representantQualite: '',
                            pourcentageCapital: 100, // Associé unique détient 100% du capital
                          },
                        })
                      }
                    }}
                  >
                    <option value="PERSONNE_PHYSIQUE">Personne physique</option>
                    <option value="PERSONNE_MORALE">Personne morale (société)</option>
                  </Select>
                </div>

                {statutsData.associeUnique?.type === 'PERSONNE_PHYSIQUE' && statutsData.associeUnique && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Civilité *</Label>
                        <Select
                          value={statutsData.associeUnique.civilite}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: {
                                ...statutsData.associeUnique,
                                type: 'PERSONNE_PHYSIQUE',
                                civilite: e.target.value as 'M' | 'Mme',
                              } as AssociePersonnePhysique,
                            })
                          }
                        >
                          <option value="M">M.</option>
                          <option value="Mme">Mme</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Nationalité *</Label>
                        <TrackedInput
                          fieldName="nationalite"
                          value={statutsData.associeUnique.nationalite}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: {
                                ...statutsData.associeUnique!,
                                type: 'PERSONNE_PHYSIQUE',
                                nationalite: e.target.value,
                              } as AssociePersonnePhysique,
                            })
                          }
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                          placeholder="française"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nom *</Label>
                        <TrackedInput
                          fieldName="nom"
                          value={statutsData.associeUnique.nom}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: {
                                ...statutsData.associeUnique!,
                                type: 'PERSONNE_PHYSIQUE',
                                nom: e.target.value,
                              } as AssociePersonnePhysique,
                            })
                          }
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                        />
                      </div>
                      <div>
                        <Label>Prénom *</Label>
                        <TrackedInput
                          fieldName="prenom"
                          value={statutsData.associeUnique.prenom}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: {
                                ...statutsData.associeUnique!,
                                type: 'PERSONNE_PHYSIQUE',
                                prenom: e.target.value,
                              } as AssociePersonnePhysique,
                            })
                          }
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date de naissance *</Label>
                        <TrackedInput
                          fieldName="dateNaissance"
                          type="date"
                          value={statutsData.associeUnique.dateNaissance}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: {
                                ...statutsData.associeUnique!,
                                type: 'PERSONNE_PHYSIQUE',
                                dateNaissance: e.target.value,
                              } as AssociePersonnePhysique,
                            })
                          }
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                        />
                      </div>
                      <div>
                        <Label>Lieu de naissance *</Label>
                        <TrackedInput
                          fieldName="lieuNaissance"
                          value={statutsData.associeUnique.lieuNaissance}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: {
                                ...statutsData.associeUnique!,
                                type: 'PERSONNE_PHYSIQUE',
                                lieuNaissance: e.target.value,
                              } as AssociePersonnePhysique,
                            })
                          }
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                          placeholder="Ville"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Adresse *</Label>
                      <TrackedInput
                        fieldName="adresse"
                        value={statutsData.associeUnique.adresse}
                        onChange={(e) =>
                          updateStatutsData({
                            associeUnique: {
                              ...statutsData.associeUnique!,
                              type: 'PERSONNE_PHYSIQUE',
                              adresse: e.target.value,
                            } as AssociePersonnePhysique,
                          })
                        }
                        onFieldChange={handleFieldChange}
                        onFieldFocus={handleFieldFocus}
                        onFieldBlur={handleFieldBlur}
                        placeholder="Adresse complète"
                      />
                    </div>
                  </>
                )}

                {statutsData.associeUnique?.type === 'PERSONNE_MORALE' && (
                  <>
                    <div>
                      <Label>Dénomination sociale *</Label>
                      <TrackedInput
                        fieldName="societeNom"
                        value={statutsData.associeUnique.societeNom}
                        onChange={(e) =>
                          updateStatutsData({
                            associeUnique: { ...statutsData.associeUnique!, type: 'PERSONNE_MORALE', societeNom: e.target.value } as AssociePersonneMorale,
                          })
                        }
                        placeholder="Nom de la société"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Forme juridique *</Label>
                        <TrackedInput
                          fieldName="societeFormeJuridique"
                          value={statutsData.associeUnique.societeFormeJuridique}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: { ...statutsData.associeUnique!, type: 'PERSONNE_MORALE', societeFormeJuridique: e.target.value } as AssociePersonneMorale,
                            })
                          }
                          placeholder="SARL, SAS..."
                        />
                      </div>
                      <div>
                        <Label>Capital social (€) *</Label>
                        <TrackedInput
                          fieldName="societeCapital"
                          type="number"
                          value={statutsData.associeUnique.societeCapital}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: { ...statutsData.associeUnique!, type: 'PERSONNE_MORALE', societeCapital: parseFloat(e.target.value) || 0 } as AssociePersonneMorale,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Siège social *</Label>
                      <TrackedInput
                        fieldName="societeSiege"
                        value={statutsData.associeUnique.societeSiege}
                        onChange={(e) =>
                          updateStatutsData({
                            associeUnique: { ...statutsData.associeUnique!, type: 'PERSONNE_MORALE', societeSiege: e.target.value } as AssociePersonneMorale,
                          })
                        }
                        placeholder="Adresse du siège"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>RCS *</Label>
                        <TrackedInput
                          fieldName="societeRCS"
                          value={statutsData.associeUnique.societeRCS}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: { ...statutsData.associeUnique!, type: 'PERSONNE_MORALE', societeRCS: e.target.value } as AssociePersonneMorale,
                            })
                          }
                          placeholder="ex: Paris"
                        />
                      </div>
                      <div>
                        <Label>Numéro RCS *</Label>
                        <TrackedInput
                          fieldName="societeNumeroRCS"
                          value={statutsData.associeUnique.societeNumeroRCS}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: { ...statutsData.associeUnique!, type: 'PERSONNE_MORALE', societeNumeroRCS: e.target.value } as AssociePersonneMorale,
                            })
                          }
                          placeholder="Numéro d'immatriculation"
                        />
                      </div>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium mb-3">Représentant légal</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nom *</Label>
                          <TrackedInput
                            fieldName="representantNom"
                            value={statutsData.associeUnique.representantNom}
                            onChange={(e) =>
                              updateStatutsData({
                                associeUnique: { ...statutsData.associeUnique!, type: 'PERSONNE_MORALE', representantNom: e.target.value } as AssociePersonneMorale,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Prénom *</Label>
                          <TrackedInput
                            fieldName="representantPrenom"
                            value={statutsData.associeUnique.representantPrenom}
                            onChange={(e) =>
                              updateStatutsData({
                                associeUnique: { ...statutsData.associeUnique!, type: 'PERSONNE_MORALE', representantPrenom: e.target.value } as AssociePersonneMorale,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label>Qualité *</Label>
                        <TrackedInput
                          fieldName="representantQualite"
                          value={statutsData.associeUnique.representantQualite}
                          onChange={(e) =>
                            updateStatutsData({
                              associeUnique: { ...statutsData.associeUnique!, type: 'PERSONNE_MORALE', representantQualite: e.target.value } as AssociePersonneMorale,
                            })
                          }
                          placeholder="ex: Gérant, Président..."
                        />
                      </div>
                    </div>
                  </>
                )}
                  </>
                )}
              </div>
            </FormSection>
            )}

            {/* Section 1: Identité */}
            {shouldShowSection('section-1') && (
              <FormSection
                title="1. Identité de la société (Articles 1-4)"
              subtitle="Forme, Dénomination, Siège social"
              completed={!!(statutsData.denomination && statutsData.objetSocial && statutsData.siegeSocial)}
              defaultOpen={false}
              sectionId="section-1"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div>
                  <Label>Dénomination sociale *</Label>
                  <TrackedInput
                    fieldName="denomination"
                    value={statutsData.denomination || ''}
                    onChange={(e) => updateStatutsData({ denomination: e.target.value })}
                    onFieldChange={handleFieldChange}
                    onFieldFocus={handleFieldFocus}
                    onFieldBlur={handleFieldBlur}
                    placeholder="Nom de la société"
                  />
                </div>
                <div>
                  <Label>Objet social *</Label>
                  <TrackedTextarea
                    fieldName="objetSocial"
                    value={statutsData.objetSocial || ''}
                    onChange={(e) => updateStatutsData({ objetSocial: e.target.value })}
                    onFieldChange={handleFieldChange}
                    onFieldFocus={handleFieldFocus}
                    onFieldBlur={handleFieldBlur}
                    placeholder="Description de l'activité..."
                    rows={4}
                  />
                  <ObjetSocialSuggestions
                    currentValue={statutsData.objetSocial || ''}
                    onApplySuggestion={(suggestion) => updateStatutsData({ objetSocial: suggestion })}
                  />
                </div>
                <div>
                  <Label>Siège social *</Label>
                  <TrackedInput
                    fieldName="siegeSocial"
                    value={statutsData.siegeSocial || ''}
                    onChange={(e) => updateStatutsData({ siegeSocial: e.target.value })}
                    onFieldChange={handleFieldChange}
                    onFieldFocus={handleFieldFocus}
                    onFieldBlur={handleFieldBlur}
                    placeholder="Adresse complète"
                  />
                </div>
              </div>
            </FormSection>
            )}

            {/* Section 2: Durée */}
            {shouldShowSection('section-2') && (
              <FormSection
                title="2. Durée (Article 5)"
              subtitle="Durée de la société"
              completed={!!statutsData.duree}
              sectionId="section-2"
              onSectionClick={handleSectionClick}
            >
              <div>
                <Label>Durée (en années) *</Label>
                <TrackedInput
                  fieldName="duree"
                  type="number"
                  value={statutsData.duree || 99}
                  onChange={(e) => updateStatutsData({ duree: parseInt(e.target.value) || 99 })}
                  onFieldChange={handleFieldChange}
                  onFieldFocus={handleFieldFocus}
                  onFieldBlur={handleFieldBlur}
                  min={1}
                  max={99}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La durée maximale est de 99 ans
                </p>
              </div>
            </FormSection>
            )}

            {/* Section 3: Capital et apports */}
            {shouldShowSection('section-3') && (
              <FormSection
                title="3. Capital et apports (Articles 6-7)"
              subtitle="Montant et nature des apports"
              completed={!!(statutsData.capitalSocial && statutsData.apportDetaille)}
              sectionId="section-3"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Capital social (€) *</Label>
                    <TrackedInput
                      fieldName="capitalSocial"
                      type="number"
                      value={statutsData.capitalSocial || 0}
                      onChange={(e) => {
                        const capital = parseFloat(e.target.value) || 0
                        updateStatutsData({ capitalSocial: capital })
                      }}
                      onFieldChange={handleFieldChange}
                      onFieldFocus={handleFieldFocus}
                      onFieldBlur={handleFieldBlur}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label>Nombre {isSASU ? 'd\'actions' : 'de parts'} *</Label>
                    <TrackedInput
                      fieldName={isSASU ? "nombreActions" : "nombreParts"}
                      type="number"
                      value={(isSASU ? statutsData.nombreActions : statutsData.nombreParts) || 100}
                      onChange={(e) => {
                        const titres = parseInt(e.target.value) || 100
                        const valeur = (statutsData.capitalSocial || 0) / titres
                        if (isSASU) {
                          updateStatutsData({
                            nombreActions: titres,
                            valeurNominale: parseFloat(valeur.toFixed(2))
                          })
                        } else {
                          updateStatutsData({
                            nombreParts: titres,
                            valeurNominale: parseFloat(valeur.toFixed(2))
                          })
                        }
                      }}
                      onFieldChange={handleFieldChange}
                      onFieldFocus={handleFieldFocus}
                      onFieldBlur={handleFieldBlur}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label>Valeur nominale (€) *</Label>
                    <TrackedInput
                      fieldName="valeurNominale"
                      type="number"
                      value={statutsData.valeurNominale || 10}
                      onChange={(e) => {
                        const valeur = parseFloat(e.target.value) || 10
                        const titres = Math.floor((statutsData.capitalSocial || 0) / valeur)
                        if (isSASU) {
                          updateStatutsData({
                            valeurNominale: valeur,
                            nombreActions: titres > 0 ? titres : 1
                          })
                        } else {
                          updateStatutsData({
                            valeurNominale: valeur,
                            nombreParts: titres > 0 ? titres : 1
                          })
                        }
                      }}
                      onFieldChange={handleFieldChange}
                      onFieldFocus={handleFieldFocus}
                      onFieldBlur={handleFieldBlur}
                      step="0.01"
                      min="0.01"
                    />
                  </div>
                </div>

                {/* Suggestions intelligentes */}
                {statutsData.capitalSocial && statutsData.capitalSocial > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-primary mb-2">💡 Suggestions de répartition :</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const capital = statutsData.capitalSocial
                        const suggestions: Array<{parts: number, valeur: number}> = []

                        // Suggérer des combinaisons logiques
                        if (capital >= 1000) suggestions.push({ parts: 1000, valeur: capital / 1000 })
                        if (capital >= 100) suggestions.push({ parts: 100, valeur: capital / 100 })
                        if (capital >= 10) suggestions.push({ parts: 10, valeur: capital / 10 })
                        if (capital % 10 === 0) suggestions.push({ parts: capital / 10, valeur: 10 })
                        if (capital % 100 === 0) suggestions.push({ parts: capital / 100, valeur: 100 })

                        // Enlever les doublons et filtrer les valeurs absurdes
                        const unique = suggestions.filter((s, i, arr) =>
                          s.valeur >= 0.01 && s.valeur <= 10000 &&
                          arr.findIndex(a => a.parts === s.parts && a.valeur === s.valeur) === i
                        ).slice(0, 4)

                        return unique.map((s, i) => (
                          <Button
                            key={i}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => updateStatutsData({
                              [isSASU ? 'nombreActions' : 'nombreParts']: s.parts,
                              valeurNominale: parseFloat(s.valeur.toFixed(2))
                            })}
                          >
                            {s.parts} {isSASU ? 'actions' : 'parts'} × {s.valeur.toFixed(2)}€
                          </Button>
                        ))
                      })()}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <Label>Type d'apport *</Label>
                  <Select
                    value={statutsData.apportDetaille?.type || 'NUMERAIRE_TOTAL'}
                    onChange={(e) => {
                      const type = e.target.value as TypeApport
                      const montant = statutsData.capitalSocial || 1000
                      const nombreTitres = (isSASU ? statutsData.nombreActions : statutsData.nombreParts) || 100
                      const titresField = isSASU ? 'nombreActions' : 'nombreParts'

                      // Initialize apport based on type
                      switch (type) {
                        case 'NUMERAIRE_TOTAL':
                          updateStatutsData({
                            apportDetaille: {
                              type: 'NUMERAIRE_TOTAL',
                              montant,
                              montantLibere: montant,
                              pourcentageLibere: 100,
                              montantRestant: 0,
                              nombreParts: nombreTitres,
                              [titresField]: nombreTitres,
                            } as any,
                          })
                          break
                        case 'NUMERAIRE_PARTIEL':
                          updateStatutsData({
                            apportDetaille: {
                              type: 'NUMERAIRE_PARTIEL',
                              montant,
                              montantLibere: montant * 0.2,
                              pourcentageLibere: 20,
                              montantRestant: montant * 0.8,
                              nombreParts: nombreTitres,
                              [titresField]: nombreTitres,
                            } as any,
                          })
                          break
                        case 'NATURE_SEUL':
                          updateStatutsData({
                            apportDetaille: {
                              type: 'NATURE_SEUL',
                              description: '',
                              valeur: montant,
                              nombreParts: nombreTitres,
                              [titresField]: nombreTitres,
                              commissaireAuxApports: { requis: false },
                            } as any,
                          })
                          break
                        case 'MIXTE_NUMERAIRE_NATURE':
                          updateStatutsData({
                            apportDetaille: {
                              type: 'MIXTE_NUMERAIRE_NATURE',
                              numeraire: { montant: montant / 2, montantLibere: montant / 2 },
                              nature: { description: '', valeur: montant / 2 },
                              nombreParts: nombreTitres,
                              [titresField]: nombreTitres,
                              commissaireAuxApports: { requis: false },
                            } as any,
                          })
                          break
                        case 'FONDS_COMMERCE':
                          updateStatutsData({
                            apportDetaille: {
                              type: 'FONDS_COMMERCE',
                              nature: '',
                              adresse: '',
                              elementsIncorporels: 0,
                              materiel: 0,
                              marchandises: 0,
                              valeurTotale: montant,
                              nombreParts: nombreTitres,
                              [titresField]: nombreTitres,
                              commissaireAuxApports: { requis: false },
                            } as any,
                          })
                          break
                        case 'BIEN_COMMUN':
                          updateStatutsData({
                            apportDetaille: {
                              type: 'BIEN_COMMUN',
                              description: '',
                              valeur: montant,
                              regimeMatrimonial: 'COMMUNAUTE_REDUITE_AUX_ACQUETS',
                              conjointNom: '',
                              conjointPrenom: '',
                              conjointRenonciation: true,
                              nombreParts: nombreTitres,
                              [titresField]: nombreTitres,
                            } as any,
                          })
                          break
                        case 'PACS_INDIVISION':
                          updateStatutsData({
                            apportDetaille: {
                              type: 'PACS_INDIVISION',
                              description: '',
                              valeur: montant,
                              partenaireNom: '',
                              partenairePrenom: '',
                              partenaireAccord: true,
                              partenaireRenonciation: true,
                              nombreParts: nombreTitres,
                              [titresField]: nombreTitres,
                            } as any,
                          })
                          break
                      }
                    }}
                  >
                    {Object.entries(TYPE_APPORT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Apport numéraire total */}
                {statutsData.apportDetaille?.type === 'NUMERAIRE_TOTAL' && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <p className="text-sm font-medium">Apport en numéraire - Libération totale</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Montant apporté (€) *</Label>
                        <TrackedInput
                          fieldName="apportDetaille"
                          type="number"
                          value={statutsData.apportDetaille.montant}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'NUMERAIRE_TOTAL',
                                montant: parseFloat(e.target.value) || 0,
                                montantLibere: parseFloat(e.target.value) || 0,
                              } as ApportNumeraire,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Nombre de parts *</Label>
                        <TrackedInput
                          fieldName="apportDetaille"
                          type="number"
                          value={statutsData.apportDetaille.nombreParts}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                nombreParts: parseInt(e.target.value) || 100,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      L'intégralité du montant sera versée lors de la constitution.
                    </p>
                  </div>
                )}

                {/* Apport numéraire partiel */}
                {statutsData.apportDetaille?.type === 'NUMERAIRE_PARTIEL' && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <p className="text-sm font-medium">Apport en numéraire - Libération partielle</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Montant total (€) *</Label>
                        <TrackedInput
                          fieldName="apportDetaille"
                          type="number"
                          value={statutsData.apportDetaille.montant}
                          onChange={(e) => {
                            const montant = parseFloat(e.target.value) || 0
                            const libere = (statutsData.apportDetaille as ApportNumeraire).montantLibere
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'NUMERAIRE_PARTIEL',
                                montant,
                                montantRestant: montant - libere,
                                pourcentageLibere: Math.round((libere / montant) * 100),
                              } as ApportNumeraire,
                            })
                          }}
                        />
                      </div>
                      <div>
                        <Label>Montant libéré (€) *</Label>
                        <TrackedInput
                          fieldName="apportDetaille"
                          type="number"
                          value={statutsData.apportDetaille.montantLibere}
                          onChange={(e) => {
                            const libere = parseFloat(e.target.value) || 0
                            const montant = (statutsData.apportDetaille as ApportNumeraire).montant
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'NUMERAIRE_PARTIEL',
                                montantLibere: libere,
                                montantRestant: montant - libere,
                                pourcentageLibere: Math.round((libere / montant) * 100),
                              } as ApportNumeraire,
                            })
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum légal : 1/5 du capital (20%). Le solde devra être libéré dans les 5 ans.
                    </p>
                  </div>
                )}

                {/* Apport en nature seul */}
                {statutsData.apportDetaille?.type === 'NATURE_SEUL' && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <p className="text-sm font-medium">Apport en nature</p>
                    <div>
                      <Label>Description des biens apportés *</Label>
                      <TrackedTextarea
                        fieldName="apportDetaille"
                        value={statutsData.apportDetaille.description}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'NATURE_SEUL',
                              description: e.target.value,
                            } as ApportNature,
                          })
                        }
                        placeholder="Détaillez les biens (matériel, véhicule, etc.)"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Valeur estimée (€) *</Label>
                        <TrackedInput
                          fieldName="apportDetaille"
                          type="number"
                          value={statutsData.apportDetaille.valeur}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'NATURE_SEUL',
                                valeur: parseFloat(e.target.value) || 0,
                              } as ApportNature,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Nombre de parts *</Label>
                        <TrackedInput
                          fieldName="apportDetaille"
                          type="number"
                          value={statutsData.apportDetaille.nombreParts}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                nombreParts: parseInt(e.target.value) || 100,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={statutsData.apportDetaille.commissaireAuxApports.requis}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'NATURE_SEUL',
                                commissaireAuxApports: {
                                  ...(statutsData.apportDetaille as ApportNature).commissaireAuxApports,
                                  requis: e.target.checked,
                                },
                              } as ApportNature,
                            })
                          }
                        />
                        Commissaire aux apports désigné
                      </Label>
                      {statutsData.apportDetaille.commissaireAuxApports.requis && (
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <Label>Nom du commissaire</Label>
                            <TrackedInput
                              fieldName="apportDetaille"
                              value={statutsData.apportDetaille.commissaireAuxApports.nom || ''}
                              onChange={(e) =>
                                updateStatutsData({
                                  apportDetaille: {
                                    ...statutsData.apportDetaille!,
                                    type: 'NATURE_SEUL',
                                    commissaireAuxApports: {
                                      ...(statutsData.apportDetaille as ApportNature).commissaireAuxApports,
                                      nom: e.target.value,
                                    },
                                  } as ApportNature,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Prénom</Label>
                            <TrackedInput
                              fieldName="apportDetaille"
                              value={statutsData.apportDetaille.commissaireAuxApports.prenom || ''}
                              onChange={(e) =>
                                updateStatutsData({
                                  apportDetaille: {
                                    ...statutsData.apportDetaille!,
                                    type: 'NATURE_SEUL',
                                    commissaireAuxApports: {
                                      ...(statutsData.apportDetaille as ApportNature).commissaireAuxApports,
                                      prenom: e.target.value,
                                    },
                                  } as ApportNature,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Un commissaire aux apports est obligatoire si la valeur dépasse 30 000 € ou représente plus de la
                      moitié du capital.
                    </p>
                  </div>
                )}

                {/* Apport mixte (numéraire + nature) */}
                {statutsData.apportDetaille?.type === 'MIXTE_NUMERAIRE_NATURE' && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                    <p className="text-sm font-medium">Apport mixte (numéraire + nature)</p>

                    {/* Partie numéraire */}
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-3">1° Apport en numéraire</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Montant numéraire (€) *</Label>
                          <TrackedInput
                            fieldName="montant"
                            type="number"
                            value={(statutsData.apportDetaille as ApportMixte).numeraire.montant}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'MIXTE_NUMERAIRE_NATURE',
                                  numeraire: {
                                    ...(statutsData.apportDetaille as ApportMixte).numeraire,
                                    montant: parseFloat(e.target.value) || 0,
                                    montantLibere: parseFloat(e.target.value) || 0,
                                  },
                                } as ApportMixte,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Montant libéré (€) *</Label>
                          <TrackedInput
                            fieldName="montantLibere"
                            type="number"
                            value={(statutsData.apportDetaille as ApportMixte).numeraire.montantLibere}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'MIXTE_NUMERAIRE_NATURE',
                                  numeraire: {
                                    ...(statutsData.apportDetaille as ApportMixte).numeraire,
                                    montantLibere: parseFloat(e.target.value) || 0,
                                  },
                                } as ApportMixte,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Partie nature */}
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-3">2° Apport en nature</p>
                      <div>
                        <Label>Description des biens *</Label>
                        <TrackedTextarea
                          fieldName="description"
                          value={(statutsData.apportDetaille as ApportMixte).nature.description}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'MIXTE_NUMERAIRE_NATURE',
                                nature: {
                                  ...(statutsData.apportDetaille as ApportMixte).nature,
                                  description: e.target.value,
                                },
                              } as ApportMixte,
                            })
                          }
                          placeholder="Détaillez les biens apportés en nature"
                          rows={3}
                        />
                      </div>
                      <div className="mt-3">
                        <Label>Valeur des biens (€) *</Label>
                        <TrackedInput
                          fieldName="valeur"
                          type="number"
                          value={(statutsData.apportDetaille as ApportMixte).nature.valeur}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'MIXTE_NUMERAIRE_NATURE',
                                nature: {
                                  ...(statutsData.apportDetaille as ApportMixte).nature,
                                  valeur: parseFloat(e.target.value) || 0,
                                },
                              } as ApportMixte,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Commissaire aux apports */}
                    <div className="border-t pt-3">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(statutsData.apportDetaille as ApportMixte).commissaireAuxApports.requis}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'MIXTE_NUMERAIRE_NATURE',
                                commissaireAuxApports: {
                                  ...(statutsData.apportDetaille as ApportMixte).commissaireAuxApports,
                                  requis: e.target.checked,
                                },
                              } as ApportMixte,
                            })
                          }
                        />
                        Commissaire aux apports désigné
                      </Label>
                      {(statutsData.apportDetaille as ApportMixte).commissaireAuxApports.requis && (
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <Label>Nom</Label>
                            <TrackedInput
                              fieldName="nom"
                              value={(statutsData.apportDetaille as ApportMixte).commissaireAuxApports.nom || ''}
                              onChange={(e) =>
                                updateStatutsData({
                                  apportDetaille: {
                                    ...statutsData.apportDetaille!,
                                    type: 'MIXTE_NUMERAIRE_NATURE',
                                    commissaireAuxApports: {
                                      ...(statutsData.apportDetaille as ApportMixte).commissaireAuxApports,
                                      nom: e.target.value,
                                    },
                                  } as ApportMixte,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Prénom</Label>
                            <TrackedInput
                              fieldName="prenom"
                              value={(statutsData.apportDetaille as ApportMixte).commissaireAuxApports.prenom || ''}
                              onChange={(e) =>
                                updateStatutsData({
                                  apportDetaille: {
                                    ...statutsData.apportDetaille!,
                                    type: 'MIXTE_NUMERAIRE_NATURE',
                                    commissaireAuxApports: {
                                      ...(statutsData.apportDetaille as ApportMixte).commissaireAuxApports,
                                      prenom: e.target.value,
                                    },
                                  } as ApportMixte,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Nombre de parts *</Label>
                      <TrackedInput
                        fieldName="nombreParts"
                        type="number"
                        value={(statutsData.apportDetaille as ApportMixte).nombreParts}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'MIXTE_NUMERAIRE_NATURE',
                              nombreParts: parseInt(e.target.value) || 100,
                            } as ApportMixte,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Apport d'un fonds de commerce */}
                {statutsData.apportDetaille?.type === 'FONDS_COMMERCE' && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                    <p className="text-sm font-medium">Apport d'un fonds de commerce</p>

                    <div>
                      <Label>Nature du fonds (ex: boulangerie-pâtisserie) *</Label>
                      <TrackedInput
                        fieldName="nature"
                        value={(statutsData.apportDetaille as ApportFondsCommerce).nature}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'FONDS_COMMERCE',
                              nature: e.target.value,
                            } as ApportFondsCommerce,
                          })
                        }
                        placeholder="Ex: boulangerie-pâtisserie, restaurant, commerce de détail..."
                      />
                    </div>

                    <div>
                      <Label>Adresse d'exploitation *</Label>
                      <TrackedInput
                        fieldName="adresse"
                        value={(statutsData.apportDetaille as ApportFondsCommerce).adresse}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'FONDS_COMMERCE',
                              adresse: e.target.value,
                            } as ApportFondsCommerce,
                          })
                        }
                        placeholder="Adresse où le fonds est exploité"
                      />
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-3">Évaluation du fonds</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Éléments incorporels (€) *</Label>
                          <TrackedInput
                            fieldName="elementsIncorporels"
                            type="number"
                            value={(statutsData.apportDetaille as ApportFondsCommerce).elementsIncorporels}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'FONDS_COMMERCE',
                                  elementsIncorporels: parseFloat(e.target.value) || 0,
                                } as ApportFondsCommerce,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Clientèle, achalandage, droit au bail, nom commercial...
                          </p>
                        </div>
                        <div>
                          <Label>Matériel et mobilier (€) *</Label>
                          <TrackedInput
                            fieldName="materiel"
                            type="number"
                            value={(statutsData.apportDetaille as ApportFondsCommerce).materiel}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'FONDS_COMMERCE',
                                  materiel: parseFloat(e.target.value) || 0,
                                } as ApportFondsCommerce,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label>Marchandises (€) *</Label>
                        <TrackedInput
                          fieldName="marchandises"
                          type="number"
                          value={(statutsData.apportDetaille as ApportFondsCommerce).marchandises}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'FONDS_COMMERCE',
                                marchandises: parseFloat(e.target.value) || 0,
                              } as ApportFondsCommerce,
                            })
                          }
                        />
                      </div>
                      <div className="mt-3 bg-blue-50 p-2 rounded">
                        <p className="text-sm font-medium">
                          Valeur totale: {
                            ((statutsData.apportDetaille as ApportFondsCommerce).elementsIncorporels || 0) +
                            ((statutsData.apportDetaille as ApportFondsCommerce).materiel || 0) +
                            ((statutsData.apportDetaille as ApportFondsCommerce).marchandises || 0)
                          } €
                        </p>
                      </div>
                    </div>

                    {/* Commissaire aux apports */}
                    <div className="border-t pt-3">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(statutsData.apportDetaille as ApportFondsCommerce).commissaireAuxApports.requis}
                          onChange={(e) =>
                            updateStatutsData({
                              apportDetaille: {
                                ...statutsData.apportDetaille!,
                                type: 'FONDS_COMMERCE',
                                commissaireAuxApports: {
                                  ...(statutsData.apportDetaille as ApportFondsCommerce).commissaireAuxApports,
                                  requis: e.target.checked,
                                },
                              } as ApportFondsCommerce,
                            })
                          }
                        />
                        Commissaire aux apports désigné
                      </Label>
                      {(statutsData.apportDetaille as ApportFondsCommerce).commissaireAuxApports.requis && (
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <Label>Nom</Label>
                            <TrackedInput
                              fieldName="nom"
                              value={(statutsData.apportDetaille as ApportFondsCommerce).commissaireAuxApports.nom || ''}
                              onChange={(e) =>
                                updateStatutsData({
                                  apportDetaille: {
                                    ...statutsData.apportDetaille!,
                                    type: 'FONDS_COMMERCE',
                                    commissaireAuxApports: {
                                      ...(statutsData.apportDetaille as ApportFondsCommerce).commissaireAuxApports,
                                      nom: e.target.value,
                                    },
                                  } as ApportFondsCommerce,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Prénom</Label>
                            <TrackedInput
                              fieldName="prenom"
                              value={(statutsData.apportDetaille as ApportFondsCommerce).commissaireAuxApports.prenom || ''}
                              onChange={(e) =>
                                updateStatutsData({
                                  apportDetaille: {
                                    ...statutsData.apportDetaille!,
                                    type: 'FONDS_COMMERCE',
                                    commissaireAuxApports: {
                                      ...(statutsData.apportDetaille as ApportFondsCommerce).commissaireAuxApports,
                                      prenom: e.target.value,
                                    },
                                  } as ApportFondsCommerce,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Nombre de parts *</Label>
                      <TrackedInput
                        fieldName="nombreParts"
                        type="number"
                        value={(statutsData.apportDetaille as ApportFondsCommerce).nombreParts}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'FONDS_COMMERCE',
                              nombreParts: parseInt(e.target.value) || 100,
                            } as ApportFondsCommerce,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Apport d'un bien commun (marié) */}
                {statutsData.apportDetaille?.type === 'BIEN_COMMUN' && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                    <p className="text-sm font-medium">Apport d'un bien commun (régime matrimonial)</p>

                    <div>
                      <Label>Régime matrimonial *</Label>
                      <Select
                        value={(statutsData.apportDetaille as ApportBienCommun).regimeMatrimonial}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'BIEN_COMMUN',
                              regimeMatrimonial: e.target.value as any,
                            } as ApportBienCommun,
                          })
                        }
                      >
                        <option value="COMMUNAUTE_REDUITE_AUX_ACQUETS">Communauté réduite aux acquêts</option>
                        <option value="SEPARATION_BIENS">Séparation de biens</option>
                        <option value="COMMUNAUTE_UNIVERSELLE">Communauté universelle</option>
                        <option value="PARTICIPATION_AUX_ACQUETS">Participation aux acquêts</option>
                      </Select>
                    </div>

                    <div>
                      <Label>Description du bien commun *</Label>
                      <TrackedTextarea
                        fieldName="description"
                        value={(statutsData.apportDetaille as ApportBienCommun).description}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'BIEN_COMMUN',
                              description: e.target.value,
                            } as ApportBienCommun,
                          })
                        }
                        placeholder="Détaillez le bien apporté (immobilier, véhicule, etc.)"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Valeur du bien (€) *</Label>
                      <TrackedInput
                        fieldName="valeur"
                        type="number"
                        value={(statutsData.apportDetaille as ApportBienCommun).valeur}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'BIEN_COMMUN',
                              valeur: parseFloat(e.target.value) || 0,
                            } as ApportBienCommun,
                          })
                        }
                      />
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-3">Informations sur le conjoint</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nom du conjoint *</Label>
                          <TrackedInput
                            fieldName="conjointNom"
                            value={(statutsData.apportDetaille as ApportBienCommun).conjointNom}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'BIEN_COMMUN',
                                  conjointNom: e.target.value,
                                } as ApportBienCommun,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Prénom du conjoint *</Label>
                          <TrackedInput
                            fieldName="conjointPrenom"
                            value={(statutsData.apportDetaille as ApportBienCommun).conjointPrenom}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'BIEN_COMMUN',
                                  conjointPrenom: e.target.value,
                                } as ApportBienCommun,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(statutsData.apportDetaille as ApportBienCommun).conjointRenonciation}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'BIEN_COMMUN',
                                  conjointRenonciation: e.target.checked,
                                } as ApportBienCommun,
                              })
                            }
                          />
                          Le conjoint renonce à la qualité d'associé
                        </Label>
                        <p className="text-xs text-muted-foreground mt-2">
                          Le conjoint doit être informé de l'apport. Il peut revendiquer la qualité d'associé pour la moitié des parts.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Nombre de parts *</Label>
                      <TrackedInput
                        fieldName="nombreParts"
                        type="number"
                        value={(statutsData.apportDetaille as ApportBienCommun).nombreParts}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'BIEN_COMMUN',
                              nombreParts: parseInt(e.target.value) || 100,
                            } as ApportBienCommun,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Apport d'un bien indivis (PACS) */}
                {statutsData.apportDetaille?.type === 'PACS_INDIVISION' && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                    <p className="text-sm font-medium">Apport d'un bien indivis (PACS)</p>

                    <div>
                      <Label>Description du bien indivis *</Label>
                      <TrackedTextarea
                        fieldName="description"
                        value={(statutsData.apportDetaille as ApportBienIndivis).description}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'PACS_INDIVISION',
                              description: e.target.value,
                            } as ApportBienIndivis,
                          })
                        }
                        placeholder="Détaillez le bien en indivision"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Valeur du bien (€) *</Label>
                      <TrackedInput
                        fieldName="valeur"
                        type="number"
                        value={(statutsData.apportDetaille as ApportBienIndivis).valeur}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'PACS_INDIVISION',
                              valeur: parseFloat(e.target.value) || 0,
                            } as ApportBienIndivis,
                          })
                        }
                      />
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-3">Informations sur le partenaire de PACS</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nom du partenaire *</Label>
                          <TrackedInput
                            fieldName="partenaireNom"
                            value={(statutsData.apportDetaille as ApportBienIndivis).partenaireNom}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'PACS_INDIVISION',
                                  partenaireNom: e.target.value,
                                } as ApportBienIndivis,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Prénom du partenaire *</Label>
                          <TrackedInput
                            fieldName="partenairePrenom"
                            value={(statutsData.apportDetaille as ApportBienIndivis).partenairePrenom}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'PACS_INDIVISION',
                                  partenairePrenom: e.target.value,
                                } as ApportBienIndivis,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(statutsData.apportDetaille as ApportBienIndivis).partenaireAccord}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'PACS_INDIVISION',
                                  partenaireAccord: e.target.checked,
                                } as ApportBienIndivis,
                              })
                            }
                          />
                          Le partenaire consent à l'apport
                        </Label>
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(statutsData.apportDetaille as ApportBienIndivis).partenaireRenonciation}
                            onChange={(e) =>
                              updateStatutsData({
                                apportDetaille: {
                                  ...statutsData.apportDetaille!,
                                  type: 'PACS_INDIVISION',
                                  partenaireRenonciation: e.target.checked,
                                } as ApportBienIndivis,
                              })
                            }
                          />
                          Le partenaire renonce à la qualité d'associé
                        </Label>
                        <p className="text-xs text-muted-foreground mt-2">
                          L'accord du partenaire de PACS est nécessaire pour l'apport de biens indivis.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label>Nombre de parts *</Label>
                      <TrackedInput
                        fieldName="nombreParts"
                        type="number"
                        value={(statutsData.apportDetaille as ApportBienIndivis).nombreParts}
                        onChange={(e) =>
                          updateStatutsData({
                            apportDetaille: {
                              ...statutsData.apportDetaille!,
                              type: 'PACS_INDIVISION',
                              nombreParts: parseInt(e.target.value) || 100,
                            } as ApportBienIndivis,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Article 8: Droit préférentiel de souscription - uniquement pour SARL */}
                {dossier?.societe.formeJuridique === 'SARL' && (
                  <div className="border-t pt-4 mt-4">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={statutsData.droitPreferentielSouscription || false}
                        onChange={(e) =>
                          updateStatutsData({
                            droitPreferentielSouscription: e.target.checked,
                          })
                        }
                      />
                      Droit préférentiel de souscription en cas d'augmentation de capital (Article 8)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Si coché, en cas d'augmentation de capital en numéraire, chaque associé bénéficiera d'un droit préférentiel à la souscription des parts nouvelles, proportionnellement au nombre de parts qu'il possède.
                    </p>
                  </div>
                )}
              </div>
            </FormSection>
            )}

            {/* Section 3bis: Dépôt de fonds */}
            {shouldShowSection('section-3bis') && statutsData.apportDetaille?.type.includes('NUMERAIRE') && (
              <FormSection
                title="3bis. Dépôt de fonds (Article 6)"
                subtitle="Informations sur le dépôt des apports en numéraire"
                completed={!!(statutsData.depotFonds?.date && statutsData.depotFonds?.etablissement)}
                sectionId="section-3bis"
                onSectionClick={handleSectionClick}
              >
                <div className="space-y-4">
                  <div>
                    <Label>Date de dépôt *</Label>
                    <TrackedInput
                      fieldName="date"
                      type="date"
                      value={statutsData.depotFonds?.date || ''}
                      onChange={(e) =>
                        updateStatutsData({
                          depotFonds: {
                            ...(statutsData.depotFonds || { date: '', etablissement: '' }),
                            date: e.target.value,
                          },
                        })
                      }
                      onFieldChange={handleFieldChange}
                      onFieldFocus={handleFieldFocus}
                      onFieldBlur={handleFieldBlur}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Le dépôt doit être effectué dans les 8 jours de la réception des fonds
                    </p>
                  </div>
                  <div>
                    <Label>Établissement de dépôt *</Label>
                    <TrackedInput
                      fieldName="etablissement"
                      value={statutsData.depotFonds?.etablissement || ''}
                      onChange={(e) =>
                        updateStatutsData({
                          depotFonds: {
                            ...(statutsData.depotFonds || { date: '', etablissement: '' }),
                            etablissement: e.target.value,
                          },
                        })
                      }
                      onFieldChange={handleFieldChange}
                      onFieldFocus={handleFieldFocus}
                      onFieldBlur={handleFieldBlur}
                      placeholder="Nom de la banque, notaire ou Caisse des dépôts"
                    />
                  </div>
                </div>
              </FormSection>
            )}

            {/* Section 4 supprimée - doublon de section 3 */}

            {/* Section 5 supprimée - Nantissement n'est plus paramétrable dans les templates actuels (contenu fixe) */}

            {/* Section 5bis: Admission/Transmission (Article 11) */}
            {shouldShowSection('section-5bis') && (
              <FormSection
                title={isSASU ? "5bis. Transmission des actions (Article 11)" : "5bis. Admission de nouveaux associés (Article 11)"}
              subtitle={isSASU ? "Règles de transmission des actions" : "Règles de cession et transmission des parts"}
              completed={isSASU ? !!statutsData.transmissionActions : !!statutsData.admissionAssocies}
              sectionId="section-5bis"
              onSectionClick={handleSectionClick}
            >
              {isSASU ? (
                // SASU - Transmission des actions
                <div className="space-y-4">
                  <div>
                    <Label>Régime de transmission *</Label>
                    <Select
                      value={statutsData.transmissionActions?.regimeCession || 'LIBRE'}
                      onChange={(e) =>
                        updateStatutsData({
                          transmissionActions: {
                            ...(statutsData.transmissionActions || {
                              regimeCession: 'LIBRE',
                            }),
                            regimeCession: e.target.value as RegimeCessionActions,
                          },
                        })
                      }
                    >
                      <option value="LIBRE">
                        Libre (même en cas de pluralité d'associés)
                      </option>
                      <option value="AGREMENT_PLURIPERSONNELLE">
                        Agrément en cas de pluralité d'associés
                      </option>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      La cession d'actions est libre tant que la société demeure unipersonnelle
                    </p>
                  </div>

                  {statutsData.transmissionActions?.regimeCession === 'AGREMENT_PLURIPERSONNELLE' && (
                    <>
                      <div>
                        <Label>Majorité pour l'agrément *</Label>
                        <TrackedInput
                          fieldName="transmissionActions"
                          value={statutsData.transmissionActions.majoriteAgrement || 'la majorité des droits de vote'}
                          onChange={(e) =>
                            updateStatutsData({
                              transmissionActions: {
                                ...statutsData.transmissionActions!,
                                majoriteAgrement: e.target.value,
                              },
                            })
                          }
                          placeholder="Ex: la majorité des droits de vote, l'unanimité..."
                        />
                      </div>
                      <div>
                        <Label>Modalités de détermination du prix de rachat</Label>
                        <TrackedTextarea
                          fieldName="transmissionActions"
                          value={statutsData.transmissionActions.modalitesPrixRachat || ''}
                          onChange={(e) =>
                            updateStatutsData({
                              transmissionActions: {
                                ...statutsData.transmissionActions!,
                                modalitesPrixRachat: e.target.value,
                              },
                            })
                          }
                          placeholder="Méthode de calcul du prix en cas de refus d'agrément"
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // EURL - Admission de nouveaux associés
                <div className="space-y-4">
                  <div>
                    <Label>Régime de cession des parts (Article 13.1.2) *</Label>
                    <Select
                      value={statutsData.admissionAssocies?.regimeCession || 'LIBRE_ASSOCIES_FAMILIAL'}
                      onChange={(e) =>
                        updateStatutsData({
                          admissionAssocies: {
                            ...(statutsData.admissionAssocies || {
                              regimeCession: 'LIBRE_ASSOCIES_FAMILIAL',
                              exploitType: 'HUISSIER',
                              majoriteCessionTiers: 'la moitié',
                              transmissionDeces: 'HERITIERS_SANS_AGREMENT',
                              liquidationCommunaute: 'NON_APPLICABLE',
                              locationParts: 'INTERDITE',
                            }),
                            regimeCession: e.target.value as RegimeCession,
                          },
                        })
                      }
                    >
                      <option value="LIBRE_ENTRE_ASSOCIES">
                        Libre entre associés, agrément pour famille et tiers
                      </option>
                      <option value="LIBRE_FAMILIAL">
                        Libre pour la famille, agrément pour associés et tiers
                      </option>
                      <option value="LIBRE_ASSOCIES_FAMILIAL">
                        Libre entre associés et famille, agrément pour tiers (régime légal)
                      </option>
                      <option value="AGREMENT_TOTAL">
                        Agrément pour toutes les cessions
                      </option>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Le régime légal (LIBRE_ASSOCIES_FAMILIAL) prévoit la liberté des cessions entre associés et famille, et l'agrément pour les tiers
                    </p>
                  </div>

                  {/* Majorité pour l'agrément - uniquement pour EURL (variable utilisée dans template EURL Article 11) */}
                  {/* Pour SARL: la majorité est fixe dans le template ("la moitié") et n'est pas paramétrable */}
                  {dossier?.societe.formeJuridique === 'EURL' && (
                    <div>
                      <Label>Majorité pour l'agrément *</Label>
                      <TrackedInput
                        fieldName="admissionAssocies"
                        value={statutsData.admissionAssocies?.majoriteCessionTiers || 'la moitié'}
                        onChange={(e) =>
                          updateStatutsData({
                            admissionAssocies: {
                              ...statutsData.admissionAssocies!,
                              majoriteCessionTiers: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: la moitié, les deux tiers..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Majorité requise pour l'agrément d'un cessionnaire (Article 11)
                      </p>
                    </div>
                  )}

                  {/* Transmission par décès (Article 13.3) */}
                  <div className="border-t pt-4 mt-4">
                    <Label>Transmission par décès (Article 13.3) *</Label>
                    <Select
                      value={statutsData.admissionAssocies?.transmissionDeces || 'HERITIERS_SANS_AGREMENT'}
                      onChange={(e) =>
                        updateStatutsData({
                          admissionAssocies: {
                            ...statutsData.admissionAssocies!,
                            transmissionDeces: e.target.value as TransmissionDeces,
                          },
                        })
                      }
                    >
                      <option value="SURVIVANTS_SEULS">
                        Société continue avec les seuls associés survivants
                      </option>
                      <option value="HERITIERS_AVEC_AGREMENT">
                        Les héritiers deviennent associés après agrément
                      </option>
                      <option value="HERITIERS_SANS_AGREMENT">
                        Les héritiers deviennent associés sans agrément
                      </option>
                      <option value="PERSONNES_DESIGNEES">
                        Société continue avec certaines personnes désignées
                      </option>
                    </Select>
                    {statutsData.admissionAssocies?.transmissionDeces === 'PERSONNES_DESIGNEES' && (
                      <div className="mt-3">
                        <Label>Personnes désignées</Label>
                        <TrackedInput
                          fieldName="admissionAssocies"
                          value={statutsData.admissionAssocies.personnesDesignees || ''}
                          onChange={(e) =>
                            updateStatutsData({
                              admissionAssocies: {
                                ...statutsData.admissionAssocies!,
                                personnesDesignees: e.target.value,
                              },
                            })
                          }
                          placeholder="Ex: le conjoint survivant, les enfants..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Liquidation de communauté (Article 13.3) */}
                  <div>
                    <Label>Liquidation de communauté (Article 13.3) *</Label>
                    <Select
                      value={statutsData.admissionAssocies?.liquidationCommunaute || 'NON_APPLICABLE'}
                      onChange={(e) =>
                        updateStatutsData({
                          admissionAssocies: {
                            ...statutsData.admissionAssocies!,
                            liquidationCommunaute: e.target.value as LiquidationCommunaute,
                          },
                        })
                      }
                    >
                      <option value="NON_APPLICABLE">
                        Pas de clause spécifique
                      </option>
                      <option value="AVEC_AGREMENT">
                        Attribution au conjoint avec agrément
                      </option>
                      <option value="SANS_AGREMENT">
                        Attribution au conjoint sans agrément
                      </option>
                    </Select>
                  </div>

                  {/* Type d'exploit pour signification (Article 13.1.1) */}
                  <div className="border-t pt-4 mt-4">
                    <Label>Type d'exploit pour signification (Article 13.1.1) *</Label>
                    <Select
                      value={statutsData.admissionAssocies?.exploitType || 'HUISSIER'}
                      onChange={(e) =>
                        updateStatutsData({
                          admissionAssocies: {
                            ...statutsData.admissionAssocies!,
                            exploitType: e.target.value as ExploitType,
                          },
                        })
                      }
                    >
                      <option value="HUISSIER">
                        Huissier de justice
                      </option>
                      <option value="COMMISSAIRE">
                        Commissaire de justice
                      </option>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Depuis 2022, les huissiers et commissaires-priseurs fusionnent en "commissaires de justice"
                    </p>
                  </div>

                  {/* Article 12: Répartition des votes en cas d'usufruit - uniquement pour SARL */}
                  {dossier?.societe.formeJuridique === 'SARL' && (
                    <div className="border-t pt-4 mt-4">
                      <Label>Répartition des votes en cas d'usufruit (Article 12) *</Label>
                      <Select
                        value={statutsData.repartitionVotesUsufruit || 'NU_PROPRIETAIRE'}
                        onChange={(e) =>
                          updateStatutsData({
                            repartitionVotesUsufruit: e.target.value as 'NU_PROPRIETAIRE' | 'USUFRUITIER' | 'MIXTE',
                          })
                        }
                      >
                        <option value="NU_PROPRIETAIRE">
                          Droit de vote au nu-propriétaire (sauf affectation bénéfices)
                        </option>
                        <option value="USUFRUITIER">
                          Droit de vote à l'usufruitier pour toutes les décisions
                        </option>
                        <option value="MIXTE">
                          Répartition mixte (nu-propriétaire pour décisions extraordinaires, usufruitier pour ordinaires)
                        </option>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Détermine qui peut voter lorsque les parts sociales sont grevées d'usufruit (démembrement de propriété)
                      </p>
                    </div>
                  )}

                  {/* Location des parts - uniquement pour SARL */}
                  {dossier?.societe.formeJuridique === 'SARL' && (
                    <div className="border-t pt-4 mt-4">
                      <Label>Location des parts sociales (Article 13.5) *</Label>
                      <Select
                        value={statutsData.admissionAssocies?.locationParts || 'INTERDITE'}
                        onChange={(e) =>
                          updateStatutsData({
                            admissionAssocies: {
                              ...(statutsData.admissionAssocies || {
                                regimeCession: 'LIBRE_ASSOCIES_FAMILIAL',
                                exploitType: 'HUISSIER',
                                majoriteCessionTiers: 'la moitié',
                                transmissionDeces: 'HERITIERS_SANS_AGREMENT',
                                liquidationCommunaute: 'NON_APPLICABLE',
                                locationParts: 'INTERDITE',
                              }),
                              locationParts: e.target.value as 'INTERDITE' | 'AUTORISEE',
                            },
                          })
                        }
                      >
                        <option value="INTERDITE">
                          Interdite
                        </option>
                        <option value="AUTORISEE">
                          Autorisée (bail de parts)
                        </option>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Les parts sociales peuvent être données à bail au profit d'une personne physique dans les conditions légales. Cette option est rarement utilisée en pratique.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </FormSection>
            )}

            {/* Section 6: Gérance (EURL) ou Présidence (SASU) */}
            {shouldShowSection('section-6') && (
              <FormSection
                title={isSASU ? `6. ${labels.Direction} (Article 13)` : `6. ${labels.Direction} (Articles 12-16)`}
              subtitle={`Nomination et pouvoirs du ${labels.dirigeant}`}
              completed={isSASU ? !!statutsData.president : !!statutsData.gerant}
              sectionId="section-6"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dirigeant-associe"
                    checked={isSASU ? statutsData.president?.isAssocieUnique !== false : statutsData.gerant?.isAssocieUnique !== false}
                    onChange={(e) => {
                      if (isSASU) {
                        updateStatutsData({
                          president: {
                            ...(statutsData.president || {
                              isAssocieUnique: true,
                              dureeMandat: 'sans limitation de durée',
                              remuneration: { type: 'AUCUNE' },
                              delaiPreavis: 3,
                              modeRevocation: 'à tout moment',
                            }),
                            isAssocieUnique: e.target.checked,
                          },
                        })
                      } else {
                        updateStatutsData({
                          gerant: {
                            ...(statutsData.gerant || {
                              isAssocieUnique: true,
                              dureeMandat: 'durée de la société',
                              remuneration: { type: 'AUCUNE' },
                              pouvoirs: 'Pouvoirs les plus étendus',
                            }),
                            isAssocieUnique: e.target.checked,
                          },
                        })
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="dirigeant-associe">
                    Le {labels.dirigeant} est {
                      dossier?.societe.formeJuridique === 'SARL' || dossier?.societe.formeJuridique === 'SAS'
                        ? "un des associés"
                        : "l'associé unique"
                    }
                  </Label>
                </div>

                {/* Pour SARL: Sélection des premiers gérants parmi les associés */}
                {dossier?.societe.formeJuridique === 'SARL' && 
                 statutsData.gerant?.isAssocieUnique !== false &&
                 statutsData.associes?.liste && statutsData.associes.liste.length > 0 && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <p className="text-sm font-medium">Sélectionner le(s) premier(s) gérant(s)</p>
                    <p className="text-xs text-muted-foreground">
                      Cochez un ou plusieurs associés qui seront nommés comme premiers gérants dans les statuts.
                    </p>
                    
                    <div className="space-y-2">
                      {statutsData.associes.liste.map((item, index) => {
                        const associeId = `associe-${index}`
                        const isGerant = statutsData.gerantsSARLIds?.includes(associeId) || false
                        const associe = item.associe
                        const associeNom = associe.type === 'PERSONNE_PHYSIQUE' 
                          ? `${associe.prenom} ${associe.nom}`.trim()
                          : associe.societeNom || 'Associé ' + (index + 1)
                        
                        return (
                          <div key={associeId} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`gerant-${associeId}`}
                              checked={isGerant}
                              onChange={(e) => {
                                const currentGerants = statutsData.gerantsSARLIds || []
                                const newGerants = e.target.checked
                                  ? [...currentGerants, associeId]
                                  : currentGerants.filter(id => id !== associeId)
                                
                                updateStatutsData({
                                  gerantsSARLIds: newGerants
                                })
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`gerant-${associeId}`} className="cursor-pointer">
                              {associeNom}
                            </Label>
                          </div>
                        )
                      })}
                    </div>

                    {(!statutsData.gerantsSARLIds || statutsData.gerantsSARLIds.length === 0) && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ Veuillez sélectionner au moins un gérant parmi les associés.
                      </p>
                    )}
                  </div>
                )}

                {/* Formulaire pour dirigeant tiers (si dirigeant ≠ associé unique) */}
                {((isSASU && statutsData.president?.isAssocieUnique === false) ||
                  (!isSASU && statutsData.gerant?.isAssocieUnique === false)) && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                    <p className="text-sm font-medium">Informations sur le {labels.dirigeant}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Civilité *</Label>
                        <Select
                          value={(isSASU ? statutsData.president?.civilite : statutsData.gerant?.civilite) || 'M'}
                          onChange={(e) => {
                            const civilite = e.target.value as 'M' | 'Mme'
                            if (isSASU) {
                              updateStatutsData({
                                president: {
                                  ...(statutsData.president || {
                                    isAssocieUnique: false,
                                    dureeMandat: 'sans limitation de durée',
                                    remuneration: { type: 'AUCUNE' },
                                    delaiPreavis: 3,
                                    modeRevocation: 'à tout moment',
                                  }),
                                  civilite,
                                },
                              })
                            } else {
                              updateStatutsData({
                                gerant: {
                                  ...(statutsData.gerant || {
                                    isAssocieUnique: false,
                                    dureeMandat: 'durée de la société',
                                    remuneration: { type: 'AUCUNE' },
                                    pouvoirs: 'Pouvoirs les plus étendus',
                                  }),
                                  civilite,
                                },
                              })
                            }
                          }}
                        >
                          <option value="M">M.</option>
                          <option value="Mme">Mme</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Nationalité *</Label>
                        <TrackedInput
                          fieldName="nationalite"
                          value={(isSASU ? statutsData.president?.nationalite : statutsData.gerant?.nationalite) || 'française'}
                          onChange={(e) => {
                            const nationalite = e.target.value
                            if (isSASU) {
                              updateStatutsData({
                                president: {
                                  ...(statutsData.president || {
                                    isAssocieUnique: false,
                                    dureeMandat: 'sans limitation de durée',
                                    remuneration: { type: 'AUCUNE' },
                                    delaiPreavis: 3,
                                    modeRevocation: 'à tout moment',
                                  }),
                                  nationalite,
                                },
                              })
                            } else {
                              updateStatutsData({
                                gerant: {
                                  ...(statutsData.gerant || {
                                    isAssocieUnique: false,
                                    dureeMandat: 'durée de la société',
                                    remuneration: { type: 'AUCUNE' },
                                    pouvoirs: 'Pouvoirs les plus étendus',
                                  }),
                                  nationalite,
                                },
                              })
                            }
                          }}
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                          placeholder="Ex: française"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nom *</Label>
                        <TrackedInput
                          fieldName="nom"
                          value={(isSASU ? statutsData.president?.nom : statutsData.gerant?.nom) || ''}
                          onChange={(e) => {
                            const nom = e.target.value
                            if (isSASU) {
                              updateStatutsData({
                                president: { ...(statutsData.president || { isAssocieUnique: false, dureeMandat: 'sans limitation de durée', remuneration: { type: 'AUCUNE' }, delaiPreavis: 3, modeRevocation: 'à tout moment' }), nom },
                              })
                            } else {
                              updateStatutsData({
                                gerant: { ...(statutsData.gerant || { isAssocieUnique: false, dureeMandat: 'durée de la société', remuneration: { type: 'AUCUNE' }, pouvoirs: 'Pouvoirs les plus étendus' }), nom },
                              })
                            }
                          }}
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                        />
                      </div>
                      <div>
                        <Label>Prénom *</Label>
                        <TrackedInput
                          fieldName="prenom"
                          value={(isSASU ? statutsData.president?.prenom : statutsData.gerant?.prenom) || ''}
                          onChange={(e) => {
                            const prenom = e.target.value
                            if (isSASU) {
                              updateStatutsData({
                                president: { ...(statutsData.president || { isAssocieUnique: false, dureeMandat: 'sans limitation de durée', remuneration: { type: 'AUCUNE' }, delaiPreavis: 3, modeRevocation: 'à tout moment' }), prenom },
                              })
                            } else {
                              updateStatutsData({
                                gerant: { ...(statutsData.gerant || { isAssocieUnique: false, dureeMandat: 'durée de la société', remuneration: { type: 'AUCUNE' }, pouvoirs: 'Pouvoirs les plus étendus' }), prenom },
                              })
                            }
                          }}
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date de naissance *</Label>
                        <TrackedInput
                          fieldName="dateNaissance"
                          type="date"
                          value={(isSASU ? statutsData.president?.dateNaissance : statutsData.gerant?.dateNaissance) || ''}
                          onChange={(e) => {
                            const dateNaissance = e.target.value
                            if (isSASU) {
                              updateStatutsData({
                                president: { ...(statutsData.president || { isAssocieUnique: false, dureeMandat: 'sans limitation de durée', remuneration: { type: 'AUCUNE' }, delaiPreavis: 3, modeRevocation: 'à tout moment' }), dateNaissance },
                              })
                            } else {
                              updateStatutsData({
                                gerant: { ...(statutsData.gerant || { isAssocieUnique: false, dureeMandat: 'durée de la société', remuneration: { type: 'AUCUNE' }, pouvoirs: 'Pouvoirs les plus étendus' }), dateNaissance },
                              })
                            }
                          }}
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                        />
                      </div>
                      <div>
                        <Label>Lieu de naissance *</Label>
                        <TrackedInput
                          fieldName="lieuNaissance"
                          value={(isSASU ? statutsData.president?.lieuNaissance : statutsData.gerant?.lieuNaissance) || ''}
                          onChange={(e) => {
                            const lieuNaissance = e.target.value
                            if (isSASU) {
                              updateStatutsData({
                                president: { ...(statutsData.president || { isAssocieUnique: false, dureeMandat: 'sans limitation de durée', remuneration: { type: 'AUCUNE' }, delaiPreavis: 3, modeRevocation: 'à tout moment' }), lieuNaissance },
                              })
                            } else {
                              updateStatutsData({
                                gerant: { ...(statutsData.gerant || { isAssocieUnique: false, dureeMandat: 'durée de la société', remuneration: { type: 'AUCUNE' }, pouvoirs: 'Pouvoirs les plus étendus' }), lieuNaissance },
                              })
                            }
                          }}
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                          placeholder="Ville, Pays"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Adresse *</Label>
                      <TrackedInput
                        fieldName="adresse"
                        value={(isSASU ? statutsData.president?.adresse : statutsData.gerant?.adresse) || ''}
                        onChange={(e) => {
                          const adresse = e.target.value
                          if (isSASU) {
                            updateStatutsData({
                              president: { ...(statutsData.president || { isAssocieUnique: false, dureeMandat: 'sans limitation de durée', remuneration: { type: 'AUCUNE' }, delaiPreavis: 3, modeRevocation: 'à tout moment' }), adresse },
                            })
                          } else {
                            updateStatutsData({
                              gerant: { ...(statutsData.gerant || { isAssocieUnique: false, dureeMandat: 'durée de la société', remuneration: { type: 'AUCUNE' }, pouvoirs: 'Pouvoirs les plus étendus' }), adresse },
                            })
                          }
                        }}
                        onFieldChange={handleFieldChange}
                        onFieldFocus={handleFieldFocus}
                        onFieldBlur={handleFieldBlur}
                        placeholder="Adresse complète"
                      />
                    </div>
                  </div>
                )}

                {/* EURL : Durée du mandat (texte libre) */}
                {dossier?.societe.formeJuridique === 'EURL' && (
                  <div>
                    <Label>Durée du mandat *</Label>
                    <TrackedInput
                      fieldName="dureeMandat"
                      value={statutsData.gerant?.dureeMandat || 'durée de la société'}
                      onChange={(e) =>
                        updateStatutsData({
                          gerant: {
                            ...(statutsData.gerant || { isAssocieUnique: true, dureeMandat: 'durée de la société', remuneration: { type: 'AUCUNE' }, pouvoirs: 'Pouvoirs les plus étendus' }),
                            dureeMandat: e.target.value,
                          },
                        })
                      }
                      onFieldChange={handleFieldChange}
                      onFieldFocus={handleFieldFocus}
                      onFieldBlur={handleFieldBlur}
                      placeholder="Ex: durée de la société, 3 ans..."
                    />
                  </div>
                )}

                {/* SARL : Durée du mandat (choix) - Article 17 */}
                {dossier?.societe.formeJuridique === 'SARL' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Durée du mandat *</Label>
                      <Select
                        value={statutsData.dureeMandat || 'INDETERMINEE'}
                        onChange={(e) =>
                          updateStatutsData({
                            dureeMandat: e.target.value as 'INDETERMINEE' | 'DETERMINEE',
                          })
                        }
                      >
                        <option value="INDETERMINEE">Durée indéterminée</option>
                        <option value="DETERMINEE">Durée déterminée</option>
                      </Select>
                    </div>

                    {statutsData.dureeMandat === 'DETERMINEE' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Nombre d'années *</Label>
                            <TrackedInput
                              fieldName="anneesDureeMandat"
                              type="number"
                              value={statutsData.anneesDureeMandat || 5}
                              onChange={(e) =>
                                updateStatutsData({
                                  anneesDureeMandat: parseInt(e.target.value) || 5,
                                })
                              }
                              onFieldChange={handleFieldChange}
                              onFieldFocus={handleFieldFocus}
                              onFieldBlur={handleFieldBlur}
                              min={1}
                            />
                          </div>
                          <div>
                            <Label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={statutsData.reeligible !== false}
                                onChange={(e) =>
                                  updateStatutsData({
                                    reeligible: e.target.checked,
                                  })
                                }
                                className="rounded"
                              />
                              Gérants rééligibles
                            </Label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Champs spécifiques SASU : Délai préavis et mode révocation président */}
                {isSASU && (
                  <div className="space-y-3">
                    <div>
                      <Label>Délai de préavis (mois) *</Label>
                      <TrackedInput
                        fieldName="delaiPreavisPresident"
                        type="number"
                        value={statutsData.president?.delaiPreavis || 3}
                        onChange={(e) =>
                          updateStatutsData({
                            president: {
                              ...(statutsData.president || { isAssocieUnique: true, dureeMandat: 'sans limitation de durée', remuneration: { type: 'AUCUNE' }, delaiPreavis: 3, modeRevocation: 'à tout moment' }),
                              delaiPreavis: parseInt(e.target.value) || 3,
                            },
                          })
                        }
                        onFieldChange={handleFieldChange}
                        onFieldFocus={handleFieldFocus}
                        onFieldBlur={handleFieldBlur}
                        min={1}
                      />
                    </div>
                    <div>
                      <Label>Mode de révocation *</Label>
                      <TrackedInput
                        fieldName="modeRevocationPresident"
                        value={statutsData.president?.modeRevocation || 'à tout moment'}
                        onChange={(e) =>
                          updateStatutsData({
                            president: {
                              ...(statutsData.president || { isAssocieUnique: true, dureeMandat: 'sans limitation de durée', remuneration: { type: 'AUCUNE' }, delaiPreavis: 3, modeRevocation: 'à tout moment' }),
                              modeRevocation: e.target.value,
                            },
                          })
                        }
                        onFieldChange={handleFieldChange}
                        onFieldFocus={handleFieldFocus}
                        onFieldBlur={handleFieldBlur}
                        placeholder="Ex: à tout moment, pour motifs graves"
                      />
                    </div>
                  </div>
                )}

                {/* EURL : Majorités et modalités (Articles 14-15-16) */}
                {dossier?.societe.formeJuridique === 'EURL' && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium mb-3">Majorités et modalités (Articles 14-15-16)</p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Majorité nomination gérant</Label>
                          <TrackedInput
                            fieldName="majoriteNominationGerant"
                            value={statutsData.majoriteNominationGerant || 'la moitié'}
                            onChange={(e) => updateStatutsData({ majoriteNominationGerant: e.target.value })}
                            onFieldChange={handleFieldChange}
                            onFieldFocus={handleFieldFocus}
                            onFieldBlur={handleFieldBlur}
                            placeholder="Ex: la moitié, les deux tiers"
                          />
                        </div>
                        <div>
                          <Label>Majorité révocation gérant</Label>
                          <TrackedInput
                            fieldName="majoriteRevocationGerant"
                            value={statutsData.majoriteRevocationGerant || 'la moitié'}
                            onChange={(e) => updateStatutsData({ majoriteRevocationGerant: e.target.value })}
                            onFieldChange={handleFieldChange}
                            onFieldFocus={handleFieldFocus}
                            onFieldBlur={handleFieldBlur}
                            placeholder="Ex: la moitié, les deux tiers"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Délai de préavis (mois)</Label>
                        <TrackedInput
                          fieldName="delaiPreavisGerant"
                          type="number"
                          value={statutsData.delaiPreavisGerant || 3}
                          onChange={(e) => updateStatutsData({ delaiPreavisGerant: parseInt(e.target.value) || 3 })}
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                          min={1}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={statutsData.limitationsPouvoirs || false}
                            onChange={(e) => updateStatutsData({ limitationsPouvoirs: e.target.checked })}
                          />
                          Limitations de pouvoirs du gérant (Article 16)
                        </Label>
                        {statutsData.limitationsPouvoirs && (
                          <TrackedTextarea
                          fieldName="descriptionLimitationsPouvoirs"
                          className="mt-3"
                          value={statutsData.descriptionLimitationsPouvoirs || ''}
                          onChange={(e) => updateStatutsData({ descriptionLimitationsPouvoirs: e.target.value })}
                          placeholder="Décrire les limitations (emprunts, acquisitions, sûretés...)"
                          rows={3}
                        />
                      )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SARL : Majorités et modalités (Articles 17-18-20) */}
                {dossier?.societe.formeJuridique === 'SARL' && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium mb-3">Nomination et révocation (Articles 17-20)</p>
                    <div className="space-y-4">
                      {/* Majorité nomination */}
                      <div>
                        <Label>Majorité pour la nomination *</Label>
                        <Select
                          value={statutsData.majoriteNomination || 'LEGALE_AVEC_SECONDE'}
                          onChange={(e) =>
                            updateStatutsData({
                              majoriteNomination: e.target.value as any,
                            })
                          }
                        >
                          <option value="LEGALE_AVEC_SECONDE">
                            Majorité légale (moitié) avec possibilité de seconde consultation
                          </option>
                          <option value="LEGALE_SANS_SECONDE">
                            Majorité légale (moitié) sans seconde consultation
                          </option>
                          <option value="RENFORCEE_AVEC_SECONDE">
                            Majorité renforcée avec possibilité de seconde consultation
                          </option>
                          <option value="RENFORCEE_SANS_SECONDE">
                            Majorité renforcée sans seconde consultation
                          </option>
                        </Select>
                      </div>

                      {(statutsData.majoriteNomination === 'RENFORCEE_AVEC_SECONDE' ||
                        statutsData.majoriteNomination === 'RENFORCEE_SANS_SECONDE') && (
                        <div>
                          <Label>Niveau de majorité renforcée *</Label>
                          <TrackedInput
                            fieldName="niveauMajoriteRenforcee"
                            value={statutsData.niveauMajoriteRenforcee || 'deux tiers'}
                            onChange={(e) =>
                              updateStatutsData({
                                niveauMajoriteRenforcee: e.target.value,
                              })
                            }
                            onFieldChange={handleFieldChange}
                            onFieldFocus={handleFieldFocus}
                            onFieldBlur={handleFieldBlur}
                            placeholder="Ex: deux tiers, les trois quarts"
                          />
                        </div>
                      )}

                      {/* Majorité révocation */}
                      <div>
                        <Label>Majorité pour la révocation *</Label>
                        <Select
                          value={statutsData.majoriteRevocation || statutsData.majoriteNomination || 'LEGALE_AVEC_SECONDE'}
                          onChange={(e) =>
                            updateStatutsData({
                              majoriteRevocation: e.target.value as any,
                            })
                          }
                        >
                          <option value="LEGALE_AVEC_SECONDE">
                            Majorité légale (moitié) avec possibilité de seconde consultation
                          </option>
                          <option value="LEGALE_SANS_SECONDE">
                            Majorité légale (moitié) sans seconde consultation
                          </option>
                          <option value="RENFORCEE_AVEC_SECONDE">
                            Majorité renforcée avec possibilité de seconde consultation
                          </option>
                          <option value="RENFORCEE_SANS_SECONDE">
                            Majorité renforcée sans seconde consultation
                          </option>
                        </Select>
                      </div>

                      {(statutsData.majoriteRevocation === 'RENFORCEE_AVEC_SECONDE' ||
                        statutsData.majoriteRevocation === 'RENFORCEE_SANS_SECONDE') && (
                        <div>
                          <Label>Niveau de majorité renforcée pour révocation *</Label>
                          <TrackedInput
                            fieldName="niveauMajoriteRevocation"
                            value={statutsData.niveauMajoriteRevocation || statutsData.niveauMajoriteRenforcee || 'deux tiers'}
                            onChange={(e) =>
                              updateStatutsData({
                                niveauMajoriteRevocation: e.target.value,
                              })
                            }
                            onFieldChange={handleFieldChange}
                            onFieldFocus={handleFieldFocus}
                            onFieldBlur={handleFieldBlur}
                            placeholder="Ex: deux tiers, les trois quarts"
                          />
                        </div>
                      )}

                      {/* Délai de préavis */}
                      <div>
                        <Label>Délai de préavis (mois) *</Label>
                        <TrackedInput
                          fieldName="delaiPreavisGerant"
                          type="number"
                          value={statutsData.delaiPreavisGerant || 3}
                          onChange={(e) =>
                            updateStatutsData({
                              delaiPreavisGerant: parseInt(e.target.value) || 3,
                            })
                          }
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                          min={1}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Préavis de démission du gérant (Article 20)
                        </p>
                      </div>

                      {/* Limitations de pouvoirs - Article 18 */}
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-3">Pouvoirs de la Gérance (Article 18)</p>
                        
                        <Label className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            checked={statutsData.limitationsPouvoirs || false}
                            onChange={(e) =>
                              updateStatutsData({
                                limitationsPouvoirs: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          Prévoir des limitations de pouvoirs
                        </Label>

                        {statutsData.limitationsPouvoirs && (
                          <div className="space-y-3 ml-6">
                            <div>
                              <Label>Majorité requise pour les décisions soumises à autorisation *</Label>
                              <TrackedInput
                                fieldName="majoriteLimitationsPouvoirs"
                                value={statutsData.majoriteLimitationsPouvoirs || 'la moitié'}
                                onChange={(e) =>
                                  updateStatutsData({
                                    majoriteLimitationsPouvoirs: e.target.value,
                                  })
                                }
                                onFieldChange={handleFieldChange}
                                onFieldFocus={handleFieldFocus}
                                onFieldBlur={handleFieldBlur}
                                placeholder="Ex: la moitié, les deux tiers"
                              />
                            </div>
                            <div>
                              <Label>Liste des décisions nécessitant autorisation préalable *</Label>
                              <TrackedTextarea
                                fieldName="listeLimitationsPouvoirs"
                                value={statutsData.listeLimitationsPouvoirs || ''}
                                onChange={(e) =>
                                  updateStatutsData({
                                    listeLimitationsPouvoirs: e.target.value,
                                  })
                                }
                                placeholder="Ex: - Emprunts supérieurs à 50 000 €&#10;- Acquisitions ou cessions d'immeubles&#10;- Constitution de sûretés..."
                                rows={4}
                              />
                            </div>
                          </div>
                        )}

                        {/* Cogérance */}
                        <div className="border-t pt-4 mt-4">
                          <Label className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              checked={statutsData.cogerance || false}
                              onChange={(e) =>
                                updateStatutsData({
                                  cogerance: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            Prévoir une cogérance (certains actes nécessitent plusieurs gérants)
                          </Label>

                          {statutsData.cogerance && (
                            <div className="ml-6">
                              <Label>Liste des actes nécessitant l'intervention de plusieurs gérants *</Label>
                              <TrackedTextarea
                                fieldName="listeActesCogerance"
                                value={statutsData.listeActesCogerance || ''}
                                onChange={(e) =>
                                  updateStatutsData({
                                    listeActesCogerance: e.target.value,
                                  })
                                }
                                placeholder="Ex: - Cessions de fonds de commerce&#10;- Emprunts supérieurs à 100 000 €&#10;- Acquisitions immobilières..."
                                rows={4}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>
            )}

            {/* Section 6bis: Comptes courants (Article 21) - EURL uniquement */}
            {dossier?.societe.formeJuridique === 'EURL' && shouldShowSection('section-6bis') && (
              <FormSection
              title="6bis. Comptes courants (Article 21)"
              subtitle="Conditions d'avances en compte courant"
              completed={!!statutsData.compteCourant}
              sectionId="section-6bis"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div>
                  <Label>Seuil minimum de détention du capital (%)</Label>
                  <TrackedInput
                    fieldName="compteCourant"
                    type="number"
                    value={statutsData.compteCourant?.seuilMinimum || 5}
                    onChange={(e) =>
                      updateStatutsData({
                        compteCourant: {
                          ...(statutsData.compteCourant || { seuilMinimum: 5 }),
                          seuilMinimum: parseInt(e.target.value) || 5,
                        },
                      })
                    }
                    min={0}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Pourcentage minimum du capital requis pour pouvoir faire des avances (généralement 5%)
                  </p>
                </div>
                <div>
                  <Label>Conditions particulières (optionnel)</Label>
                  <TrackedTextarea
                    fieldName="compteCourant"
                    value={statutsData.compteCourant?.conditions || ''}
                    onChange={(e) =>
                      updateStatutsData({
                        compteCourant: {
                          ...(statutsData.compteCourant || { seuilMinimum: 5 }),
                          conditions: e.target.value,
                        },
                      })
                    }
                    placeholder="Conditions de remboursement et de rémunération spécifiques"
                    rows={3}
                  />
                </div>
              </div>
            </FormSection>
            )}

            {/* Section 7: Exercice social */}
            {shouldShowSection('section-7') && (
              <FormSection
              title={isSASU ? "7. Exercice social (Article 19)" : dossier?.societe.formeJuridique === 'SARL' ? "7. Exercice social (Article 26)" : "7. Exercice social (Article 23)"}
              subtitle="Dates de début et fin"
              completed={!!statutsData.exerciceSocial}
              sectionId="section-7"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div>
                  <Label>Date de début *</Label>
                  <TrackedInput
                    fieldName="exerciceSocial"
                    value={statutsData.exerciceSocial?.dateDebut || '1er janvier'}
                    onChange={(e) =>
                      updateStatutsData({
                        exerciceSocial: {
                          ...(statutsData.exerciceSocial || {
                            dateDebut: '1er janvier',
                            dateFin: '31 décembre',
                            premierExerciceFin: `31 décembre ${new Date().getFullYear()}`,
                          }),
                          dateDebut: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: 1er janvier"
                  />
                </div>
                <div>
                  <Label>Date de fin *</Label>
                  <TrackedInput
                    fieldName="exerciceSocial"
                    value={statutsData.exerciceSocial?.dateFin || '31 décembre'}
                    onChange={(e) =>
                      updateStatutsData({
                        exerciceSocial: {
                          ...(statutsData.exerciceSocial || {
                            dateDebut: '1er janvier',
                            dateFin: '31 décembre',
                            premierExerciceFin: `31 décembre ${new Date().getFullYear()}`,
                          }),
                          dateFin: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: 31 décembre"
                  />
                </div>
                <div>
                  <Label>Date de clôture du premier exercice *</Label>
                  <TrackedInput
                    fieldName="exerciceSocial"
                    value={statutsData.exerciceSocial?.premierExerciceFin || `31 décembre ${new Date().getFullYear()}`}
                    onChange={(e) =>
                      updateStatutsData({
                        exerciceSocial: {
                          ...(statutsData.exerciceSocial || {
                            dateDebut: '1er janvier',
                            dateFin: '31 décembre',
                            premierExerciceFin: `31 décembre ${new Date().getFullYear()}`,
                          }),
                          premierExerciceFin: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: 31 décembre 2025"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Par exception, le premier exercice peut avoir une durée différente
                  </p>
                </div>
              </div>
            </FormSection>
            )}

            {/* Section 7bis: Décisions collectives et modalités de consultation (Articles 17-18) - SASU uniquement */}
            {isSASU && shouldShowSection('section-7bis') && (
              <FormSection
                title="7bis. Décisions collectives (Articles 17-18)"
                subtitle="Modalités de consultation des associés"
                completed={!!statutsData.quorumDecisions}
                sectionId="section-7bis"
                onSectionClick={handleSectionClick}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ces modalités s'appliquent lorsque la société compte plusieurs associés. Elles définissent les règles de quorum,
                    les délais de convocation et de consultation.
                  </p>

                  <div>
                    <Label>Quorum requis pour les décisions collectives *</Label>
                    <TrackedInput
                      fieldName="quorumDecisions"
                      value={statutsData.quorumDecisions || '50%'}
                      onChange={(e) => updateStatutsData({ quorumDecisions: e.target.value })}
                      placeholder="Ex: 50%, 2/3, l'unanimité..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Pourcentage minimum des droits de vote requis pour que les décisions soient valables
                    </p>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium mb-3">Modalités de consultation (Article 18)</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Délai de convocation en assemblée (jours) *</Label>
                          <TrackedInput
                            fieldName="delaiConvocationAssemblee"
                            type="number"
                            value={statutsData.delaiConvocationAssemblee || 15}
                            onChange={(e) => updateStatutsData({ delaiConvocationAssemblee: parseInt(e.target.value) || 15 })}
                            min={1}
                            placeholder="Ex: 15 jours"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Délai minimum avant la tenue de l'assemblée
                          </p>
                        </div>
                        <div>
                          <Label>Délai de consultation écrite (jours) *</Label>
                          <TrackedInput
                            fieldName="delaiConsultationEcrite"
                            type="number"
                            value={statutsData.delaiConsultationEcrite || 15}
                            onChange={(e) => updateStatutsData({ delaiConsultationEcrite: parseInt(e.target.value) || 15 })}
                            min={1}
                            placeholder="Ex: 15 jours"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Délai pour émettre son vote en cas de consultation écrite
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Signataire des procès-verbaux *</Label>
                          <TrackedInput
                            fieldName="signatairePV"
                            value={statutsData.signatairePV || 'le Président'}
                            onChange={(e) => updateStatutsData({ signatairePV: e.target.value })}
                            placeholder="Ex: le Président, le Président de séance..."
                          />
                        </div>
                        <div>
                          <Label>Délai d'information des résultats (jours) *</Label>
                          <TrackedInput
                            fieldName="delaiInformationResultat"
                            type="number"
                            value={statutsData.delaiInformationResultat || 15}
                            onChange={(e) => updateStatutsData({ delaiInformationResultat: parseInt(e.target.value) || 15 })}
                            min={1}
                            placeholder="Ex: 15 jours"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Délai pour informer les associés du résultat d'une consultation
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FormSection>
            )}

            {/* Section 8: Commissaires aux comptes */}
            {shouldShowSection('section-8') && (
              <FormSection
              title={
                isSASU 
                  ? "8. Commissaires aux comptes (Article 15)" 
                  : dossier?.societe.formeJuridique === 'SARL' 
                    ? "8. Commissaires aux comptes (Articles 23 et 35bis)" 
                    : "8. Commissaires aux comptes (Article 18)"
              }
              subtitle="Nomination obligatoire ou facultative"
              completed={!!statutsData.commissairesAuxComptes}
              sectionId="section-8"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={statutsData.commissairesAuxComptes?.obligatoire || false}
                      onChange={(e) =>
                        updateStatutsData({
                          commissairesAuxComptes: {
                            ...statutsData.commissairesAuxComptes,
                            obligatoire: e.target.checked,
                          },
                        })
                      }
                    />
                    Nomination obligatoire
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Un commissaire aux comptes est obligatoire si 2 des 3 seuils sont dépassés :
                    <br />- Total bilan {'>'}4M€ | CA HT {'>'}8M€ | Salariés {'>'}50
                  </p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={statutsData.commissairesAuxComptes?.designes || false}
                      onChange={(e) =>
                        updateStatutsData({
                          commissairesAuxComptes: {
                            obligatoire: statutsData.commissairesAuxComptes?.obligatoire || false,
                            ...statutsData.commissairesAuxComptes,
                            designes: e.target.checked,
                            ...(e.target.checked && {
                              duree: '6 exercices',
                              dateFinMandat: '',
                              titulaire: { nom: '', prenom: '', adresse: '' },
                            }),
                          },
                        })
                      }
                    />
                    Désigner les commissaires aux comptes dès la constitution
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isSASU 
                      ? "Si vous souhaitez nommer les commissaires dans les statuts (Article 15)"
                      : dossier?.societe.formeJuridique === 'SARL'
                        ? "Si vous souhaitez nommer les commissaires dans les statuts (Article 35bis)"
                        : "Si vous souhaitez nommer les commissaires dans les statuts"}
                  </p>

                  {statutsData.commissairesAuxComptes?.designes && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Durée du mandat *</Label>
                          <TrackedInput
                            fieldName="dureeCommissaires"
                            value={statutsData.commissairesAuxComptes.duree || '6'}
                            onChange={(e) =>
                              updateStatutsData({
                                commissairesAuxComptes: {
                                  ...statutsData.commissairesAuxComptes!,
                                  duree: e.target.value,
                                },
                              })
                            }
                            placeholder="Ex: 6"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Durée en nombre d'exercices (généralement 6)
                          </p>
                        </div>
                        <div>
                          <Label>Date de fin du mandat *</Label>
                          <TrackedInput
                            fieldName="dateFinMandatCAC"
                            type="date"
                            value={statutsData.commissairesAuxComptes.dateFinMandat || ''}
                            onChange={(e) =>
                              updateStatutsData({
                                commissairesAuxComptes: {
                                  ...statutsData.commissairesAuxComptes!,
                                  dateFinMandat: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <p className="text-sm font-medium">Commissaire aux comptes titulaire</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Nom *</Label>
                            <TrackedInput
                              fieldName="commissaireTitulaireNom"
                              value={statutsData.commissairesAuxComptes?.titulaire?.nom || ''}
                              onChange={(e) =>
                                updateStatutsData({
                                  commissairesAuxComptes: {
                                    ...statutsData.commissairesAuxComptes!,
                                    titulaire: {
                                      ...(statutsData.commissairesAuxComptes?.titulaire || { nom: '', prenom: '', adresse: '' }),
                                      nom: e.target.value,
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Prénom *</Label>
                            <TrackedInput
                              fieldName="commissaireTitulairePrenom"
                              value={statutsData.commissairesAuxComptes?.titulaire?.prenom || ''}
                              onChange={(e) =>
                                updateStatutsData({
                                  commissairesAuxComptes: {
                                    ...statutsData.commissairesAuxComptes!,
                                    titulaire: {
                                      ...(statutsData.commissairesAuxComptes?.titulaire || { nom: '', prenom: '', adresse: '' }),
                                      prenom: e.target.value,
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Adresse complète *</Label>
                          <TrackedInput
                            fieldName="commissaireTitulaireAdresse"
                            value={statutsData.commissairesAuxComptes?.titulaire?.adresse || ''}
                            onChange={(e) =>
                              updateStatutsData({
                                commissairesAuxComptes: {
                                  ...statutsData.commissairesAuxComptes!,
                                  titulaire: {
                                    ...(statutsData.commissairesAuxComptes?.titulaire || { nom: '', prenom: '', adresse: '' }),
                                    adresse: e.target.value,
                                  },
                                },
                              })
                            }
                            placeholder="Adresse professionnelle du commissaire"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Label className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            checked={!!statutsData.commissairesAuxComptes?.suppleant}
                            onChange={(e) =>
                              updateStatutsData({
                                commissairesAuxComptes: {
                                  ...statutsData.commissairesAuxComptes!,
                                  suppleant: e.target.checked ? { nom: '', prenom: '', adresse: '' } : undefined,
                                },
                              })
                            }
                          />
                          Désigner un commissaire aux comptes suppléant (optionnel)
                        </Label>

                        {statutsData.commissairesAuxComptes?.suppleant && (
                          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <p className="text-sm font-medium">Commissaire aux comptes suppléant</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Nom *</Label>
                                <TrackedInput
                                  fieldName="commissaireSuppleantNom"
                                  value={statutsData.commissairesAuxComptes?.suppleant?.nom || ''}
                                  onChange={(e) =>
                                    updateStatutsData({
                                      commissairesAuxComptes: {
                                        ...statutsData.commissairesAuxComptes!,
                                        suppleant: {
                                          ...(statutsData.commissairesAuxComptes?.suppleant || { nom: '', prenom: '', adresse: '' }),
                                          nom: e.target.value,
                                        },
                                      },
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Prénom *</Label>
                                <TrackedInput
                                  fieldName="commissaireSuppleantPrenom"
                                  value={statutsData.commissairesAuxComptes?.suppleant?.prenom || ''}
                                  onChange={(e) =>
                                    updateStatutsData({
                                      commissairesAuxComptes: {
                                        ...statutsData.commissairesAuxComptes!,
                                        suppleant: {
                                          ...(statutsData.commissairesAuxComptes?.suppleant || { nom: '', prenom: '', adresse: '' }),
                                          prenom: e.target.value,
                                        },
                                      },
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Adresse complète *</Label>
                              <TrackedInput
                                fieldName="commissaireSuppleantAdresse"
                                value={statutsData.commissairesAuxComptes?.suppleant?.adresse || ''}
                                onChange={(e) =>
                                  updateStatutsData({
                                    commissairesAuxComptes: {
                                      ...statutsData.commissairesAuxComptes!,
                                      suppleant: {
                                        ...(statutsData.commissairesAuxComptes?.suppleant || { nom: '', prenom: '', adresse: '' }),
                                        adresse: e.target.value,
                                      },
                                    },
                                  })
                                }
                                placeholder="Adresse professionnelle du commissaire"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </FormSection>
            )}

            {/* Section 9: Conventions réglementées */}
            {shouldShowSection('section-9') && (
              <FormSection
                title={isSASU ? "9. Conventions réglementées (Article 16)" : "9. Conventions réglementées (Article 22)"}
              subtitle="Article obligatoire - toujours inclus"
              completed={true}
              sectionId="section-9"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ✓ L'article sur les conventions réglementées est toujours inclus dans les statuts conformément au Code de
                  commerce. Il encadre les conventions entre la société et ses dirigeants ou associés.
                </p>
                <p className="text-xs text-green-600 font-medium">
                  Cette section est automatiquement validée car aucune saisie n'est requise.
                </p>
              </div>
            </FormSection>
            )}

            {/* Section 9bis: Décisions collectives - SARL uniquement */}
            {dossier?.societe.formeJuridique === 'SARL' && shouldShowSection('section-9bis') && (
              <FormSection
                title="9bis. Décisions collectives (Article 24)"
                subtitle="Modalités de consultation et de vote des associés"
                completed={!!(
                  statutsData.formesDecisionsCollectives &&
                  statutsData.decisionsOrdinaires &&
                  statutsData.quorumExtraordinaire1 &&
                  statutsData.quorumExtraordinaire2 &&
                  statutsData.majoriteExtraordinaire
                )}
                sectionId="section-9bis"
                onSectionClick={handleSectionClick}
              >
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    L'article 24 définit les règles de prise de décision collective des associés de la SARL.
                  </p>

                  {/* 24.1: Forme des décisions collectives */}
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-medium text-sm mb-3">24.1 Forme des décisions collectives</h4>
                    <div>
                      <Label>Mode de consultation des associés *</Label>
                      <Select
                        value={statutsData.formesDecisionsCollectives || 'DIVERSES'}
                        onChange={(e) =>
                          updateStatutsData({
                            formesDecisionsCollectives: e.target.value as 'DIVERSES' | 'ASSEMBLEE_SEULE' | 'SANS_CE_UNANIME_COMPTES',
                          })
                        }
                      >
                        <option value="DIVERSES">
                          Diverses formes (assemblée, consultation écrite ou consentement unanime)
                        </option>
                        <option value="ASSEMBLEE_SEULE">
                          Assemblée générale uniquement
                        </option>
                        <option value="SANS_CE_UNANIME_COMPTES">
                          Sans consentement unanime pour les comptes
                        </option>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Définit les modalités selon lesquelles les associés prennent leurs décisions
                      </p>
                    </div>
                  </div>

                  {/* 24.2: Décisions ordinaires */}
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-medium text-sm mb-3">24.2 Décisions ordinaires</h4>
                    <div className="space-y-4">
                      <div>
                        <Label>Majorité pour les décisions ordinaires *</Label>
                        <Select
                          value={statutsData.decisionsOrdinaires || 'LEGALE_AVEC_SECONDE'}
                          onChange={(e) =>
                            updateStatutsData({
                              decisionsOrdinaires: e.target.value as 'LEGALE_AVEC_SECONDE' | 'LEGALE_SANS_SECONDE' | 'RENFORCEE_AVEC_SECONDE' | 'RENFORCEE_SANS_SECONDE',
                            })
                          }
                        >
                          <option value="LEGALE_AVEC_SECONDE">
                            Majorité légale (+ moitié) avec seconde consultation possible
                          </option>
                          <option value="LEGALE_SANS_SECONDE">
                            Majorité légale (+ moitié) sans seconde consultation
                          </option>
                          <option value="RENFORCEE_AVEC_SECONDE">
                            Majorité renforcée avec seconde consultation possible
                          </option>
                          <option value="RENFORCEE_SANS_SECONDE">
                            Majorité renforcée sans seconde consultation
                          </option>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Les décisions ordinaires concernent la gestion courante (approbation des comptes, nomination gérants, etc.)
                        </p>
                      </div>

                      {(statutsData.decisionsOrdinaires === 'RENFORCEE_AVEC_SECONDE' ||
                        statutsData.decisionsOrdinaires === 'RENFORCEE_SANS_SECONDE') && (
                        <div>
                          <Label>Seuil de majorité renforcée *</Label>
                          <TrackedInput
                            fieldName="majoriteOrdinairesRenforcee"
                            value={statutsData.majoriteOrdinairesRenforcee || 'deux tiers'}
                            onChange={(e) =>
                              updateStatutsData({
                                majoriteOrdinairesRenforcee: e.target.value,
                              })
                            }
                            placeholder="Ex: deux tiers, trois quarts"
                          />
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Indiquez la fraction (ex: deux tiers, trois quarts)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 24.3: Décisions extraordinaires */}
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-medium text-sm mb-3">24.3 Décisions extraordinaires</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Les décisions extraordinaires portent sur les modifications statutaires (changement dénomination, siège, objet, forme, etc.)
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label>Quorum sur première convocation *</Label>
                        <TrackedInput
                          fieldName="quorumExtraordinaire1"
                          value={statutsData.quorumExtraordinaire1 || 'le quart'}
                          onChange={(e) =>
                            updateStatutsData({
                              quorumExtraordinaire1: e.target.value,
                            })
                          }
                          placeholder="Ex: le quart, le tiers"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Fraction minimale de parts sociales représentées pour délibérer valablement (ex: le quart)
                        </p>
                      </div>

                      <div>
                        <Label>Quorum sur deuxième convocation *</Label>
                        <TrackedInput
                          fieldName="quorumExtraordinaire2"
                          value={statutsData.quorumExtraordinaire2 || 'le cinquième'}
                          onChange={(e) =>
                            updateStatutsData({
                              quorumExtraordinaire2: e.target.value,
                            })
                          }
                          placeholder="Ex: le cinquième, le sixième"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Quorum réduit pour la seconde convocation (ex: le cinquième)
                        </p>
                      </div>

                      <div>
                        <Label>Majorité requise pour adoption *</Label>
                        <TrackedInput
                          fieldName="majoriteExtraordinaire"
                          value={statutsData.majoriteExtraordinaire || 'des deux tiers'}
                          onChange={(e) =>
                            updateStatutsData({
                              majoriteExtraordinaire: e.target.value,
                            })
                          }
                          placeholder="Ex: des deux tiers, des trois quarts"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Majorité des parts détenues par les associés présents ou représentés (ex: des deux tiers)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </FormSection>
            )}

            {/* Section 10: Options - EURL uniquement */}
            {dossier?.societe.formeJuridique === 'EURL' && shouldShowSection('section-10') && (
              <FormSection
                title="10. Options (Articles 25-28)"
              subtitle="Choix fiscaux et clause d'arbitrage"
              completed={!!statutsData.optionFiscale}
              sectionId="section-10"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div>
                  <Label>Option fiscale *</Label>
                  <Select
                    value={statutsData.optionFiscale || 'IMPOT_SOCIETES'}
                    onChange={(e) =>
                      updateStatutsData({
                        optionFiscale: e.target.value as 'IMPOT_SOCIETES' | 'IMPOT_REVENU',
                      })
                    }
                  >
                    {Object.entries(OPTION_FISCALE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Par défaut, l'EURL peut opter pour l'IS. Sans option, elle reste à l'IR.
                  </p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={statutsData.clauseCompromissoire?.presente || false}
                      onChange={(e) =>
                        updateStatutsData({
                          clauseCompromissoire: {
                            presente: e.target.checked,
                            ...(e.target.checked && {
                              institutionArbitrage: '',
                              lieuArbitrage: '',
                            }),
                          },
                        })
                      }
                    />
                    Inclure une clause compromissoire (optionnel)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Permet de soumettre les litiges à un arbitrage plutôt qu'aux tribunaux.
                  </p>

                  {statutsData.clauseCompromissoire?.presente && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label>Délai de décision des arbitres (mois)</Label>
                        <TrackedInput
                          fieldName="delaiArbitrage"
                          type="number"
                          value={statutsData.delaiArbitrage || 6}
                          onChange={(e) => updateStatutsData({ delaiArbitrage: parseInt(e.target.value) || 6 })}
                          min={1}
                          placeholder="Ex: 6 mois"
                        />
                      </div>
                      <div>
                        <Label>Institution d'arbitrage (optionnel)</Label>
                        <TrackedInput
                          fieldName="clauseCompromissoire"
                          value={statutsData.clauseCompromissoire.institutionArbitrage || ''}
                          onChange={(e) =>
                            updateStatutsData({
                              clauseCompromissoire: {
                                ...statutsData.clauseCompromissoire!,
                                institutionArbitrage: e.target.value,
                              },
                            })
                          }
                          placeholder="ex: Chambre de Commerce et d'Industrie"
                        />
                      </div>
                      <div>
                        <Label>Lieu d'arbitrage (optionnel)</Label>
                        <TrackedInput
                          fieldName="clauseCompromissoire"
                          value={statutsData.clauseCompromissoire.lieuArbitrage || ''}
                          onChange={(e) =>
                            updateStatutsData({
                              clauseCompromissoire: {
                                ...statutsData.clauseCompromissoire!,
                                lieuArbitrage: e.target.value,
                              },
                            })
                          }
                          placeholder="ex: Paris"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </FormSection>
            )}

            {/* Section 11: Actes en formation */}
            {shouldShowSection('section-11') && (
              <FormSection
              title={isSASU ? "11. Actes en formation (Article 25)" : "11. Actes en formation (Article 29)"}
              subtitle="Actes accomplis avant immatriculation"
              completed={!!statutsData.actesFormation}
              sectionId="section-11"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={statutsData.actesFormation?.presents || false}
                      onChange={(e) =>
                        updateStatutsData({
                          actesFormation: {
                            presents: e.target.checked,
                            ...(e.target.checked && { liste: '' }),
                          },
                        })
                      }
                    />
                    Des actes ont été accomplis pour le compte de la société en formation
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Si oui, listez les actes (ex: bail commercial, commandes de matériel, etc.)
                  </p>

                  {statutsData.actesFormation?.presents && (
                    <div className="mt-4">
                      <Label>Liste des actes *</Label>
                      <TrackedTextarea
                        fieldName="actesFormation"
                        value={statutsData.actesFormation.liste || ''}
                        onChange={(e) =>
                          updateStatutsData({
                            actesFormation: {
                              ...statutsData.actesFormation!,
                              liste: e.target.value,
                            },
                          })
                        }
                        placeholder="Décrivez les actes accomplis (bail, contrats, etc.)"
                        rows={4}
                      />
                    </div>
                  )}
                </div>
              </div>
            </FormSection>
            )}

            {/* Section 12: Nomination du premier gérant et signatures (Article 30) */}
            {shouldShowSection('section-12') && (
              <FormSection
                title={isSASU ? "12. Signatures (Conclusion)" : "12. Nomination du premier gérant (Article 30 + Conclusion)"}
              subtitle="Nomination dans les statuts et signatures"
              completed={!!statutsData.nominationGerant}
              sectionId="section-12"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={statutsData.nominationGerant?.gerantDansStatuts !== false}
                      onChange={(e) =>
                        updateStatutsData({
                          nominationGerant: {
                            ...(statutsData.nominationGerant || {
                              gerantDansStatuts: true,
                              gerantEstAssocie: true,
                            }),
                            gerantDansStatuts: e.target.checked,
                          },
                        })
                      }
                    />
                    Nommer le gérant dans les statuts
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Si non coché, le gérant sera nommé par acte séparé ultérieur
                  </p>
                </div>

                {statutsData.nominationGerant?.gerantDansStatuts && (
                  <>
                    <div>
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={statutsData.nominationGerant?.gerantEstAssocie !== false}
                          onChange={(e) =>
                            updateStatutsData({
                              nominationGerant: {
                                ...statutsData.nominationGerant!,
                                gerantEstAssocie: e.target.checked,
                              },
                            })
                          }
                        />
                        {dossier?.societe.formeJuridique === 'SARL' || dossier?.societe.formeJuridique === 'SAS'
                          ? "Le gérant est un des associés"
                          : "Le gérant est l'associé unique"}
                      </Label>
                    </div>

                    <div>
                      <Label>Durée de nomination</Label>
                      <TrackedInput
                        fieldName="nominationGerant"
                        value={statutsData.nominationGerant?.dureeNomination || 'indéterminée'}
                        onChange={(e) =>
                          updateStatutsData({
                            nominationGerant: {
                              ...statutsData.nominationGerant!,
                              dureeNomination: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: indéterminée, durée de la société..."
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={statutsData.nominationGerant?.remunerationFixee || false}
                          onChange={(e) =>
                            updateStatutsData({
                              nominationGerant: {
                                ...statutsData.nominationGerant!,
                                remunerationFixee: e.target.checked,
                              },
                            })
                          }
                        />
                        Fixer la rémunération du gérant dans les statuts
                      </Label>
                      {statutsData.nominationGerant?.remunerationFixee && (
                        <div className="mt-3">
                          <Label>Description de la rémunération</Label>
                          <TrackedTextarea
                            fieldName="nominationGerant"
                            value={statutsData.nominationGerant?.descriptionRemuneration || ''}
                            onChange={(e) =>
                              updateStatutsData({
                                nominationGerant: {
                                  ...statutsData.nominationGerant!,
                                  descriptionRemuneration: e.target.value,
                                },
                              })
                            }
                            placeholder="Ex: 3000€ brut mensuel, ou fixée par décision de l'associé unique..."
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-3">Signatures</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Lieu de signature *</Label>
                      <TrackedInput
                        fieldName="lieuSignature"
                        value={statutsData.lieuSignature || ''}
                        onChange={(e) => updateStatutsData({ lieuSignature: e.target.value })}
                        placeholder="Ville"
                      />
                    </div>
                    <div>
                      <Label>Date de signature</Label>
                      <TrackedInput
                        fieldName="dateSignature"
                        type="date"
                        value={statutsData.dateSignature || ''}
                        onChange={(e) => updateStatutsData({ dateSignature: e.target.value })}
                      
                          onFieldChange={handleFieldChange}
                          onFieldFocus={handleFieldFocus}
                          onFieldBlur={handleFieldBlur}
                      />
                    </div>
                    <div>
                      <Label>Nombre d'exemplaires</Label>
                      <TrackedInput
                        fieldName="nombreExemplaires"
                        type="number"
                        value={statutsData.nombreExemplaires || 3}
                        onChange={(e) => updateStatutsData({ nombreExemplaires: parseInt(e.target.value) || 3 })}
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>
            )}

            {/* Navigation du wizard */}
            <WizardNavigation
              currentStep={currentStep}
              totalSteps={REDACTION_STEPS.length}
              onPrevious={handlePreviousStep}
              onNext={handleNextStep}
              onComplete={handleComplete}
              canGoNext={canGoToNextStep}
              canGoPrevious={currentStep > 0}
              isLastStep={currentStep === REDACTION_STEPS.length - 1}
              errors={validationErrors}
            />
          </div>
        </div>
          }
          rightPanel={
            <DocumentPreview
              ref={previewRef}
              content={previewContent}
              onExport={handleExport}
              isGenerating={false}
              activeSection={activeSection}
              activeField={activeField}
            />
          }
        />
      </div>
      
      {/* Chat IA */}
      <AIChat 
        statutsData={statutsData as StatutsData}
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />
      
      {/* Bouton pour ouvrir le chat IA */}
      <AIChatButton 
        onClick={() => setIsAIChatOpen(!isAIChatOpen)}
        isOpen={isAIChatOpen}
      />
    </Layout>
  )
}
