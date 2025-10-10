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
import { StepperCompact } from '../components/ui/stepper-compact'
import { ResizablePanels } from '../components/ui/resizable-panels'
import { getDatabase } from '../db/database'
import type { Dossier } from '../types'
import type { StatutsData, TypeApport, AssociePersonnePhysique, AssociePersonneMorale, ApportNumeraire, ApportNature, ApportMixte, ApportFondsCommerce, ApportBienCommun, ApportBienIndivis } from '../types/statuts'
import { TYPE_APPORT_LABELS, OPTION_FISCALE_LABELS } from '../types/statuts'
import { generateStatuts, calculateProgression } from '../utils/template-engine'
import { ArrowLeft, Save, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { TrackedInput, TrackedTextarea } from '../components/ui/tracked-input'
import { AIChat, AIChatButton } from '../components/ai/AIChat'
import { ObjetSocialSuggestions, AIStatusIndicator } from '../components/ai/InlineSuggestions'
import { REDACTION_STEPS, STEP_SECTIONS, isStepComplete, getStepValidationErrors } from '../config/redaction-steps'

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

  // Charger le dossier
  useEffect(() => {
    if (id) {
      loadDossier(id)
    }
  }, [id])

  // Fonction pour obtenir les valeurs par défaut
  const getDefaultStatutsData = (dossierData: Dossier): Partial<StatutsData> => {
    const isSASU = dossierData.societe.formeJuridique === 'SASU' || dossierData.societe.formeJuridique === 'SAS'

    const baseDefaults: Partial<StatutsData> = {
            // Section 0: Associé unique
            associeUnique: {
              type: 'PERSONNE_PHYSIQUE',
              civilite: dossierData.client.civilite,
              nom: dossierData.client.nom,
              prenom: dossierData.client.prenom,
              dateNaissance: '',
              lieuNaissance: '',
              nationalite: 'française',
              adresse: '',
            },

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

            // Section 5: Nantissement
            nantissement: {
              agrementRequis: false,
            },

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
        // Article 11: Admission de nouveaux associés
        admissionAssocies: {
          regimeCession: 'LIBRE_FAMILIAL_AGREMENT_TIERS',
          majoriteCessionTiers: 'la moitié',
          majoriteMutation: 'la moitié',
          modalitesPrixRachat: '',
          agrementDeces: false,
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

  // Sauvegarde automatique DÉSACTIVÉE
  // useEffect(() => {
  //   if (!dossier || !id) return
  //
  //   // Ne pas sauvegarder au premier chargement
  //   if (isInitialMount.current) {
  //     isInitialMount.current = false
  //     return
  //   }
  //
  //   const timer = setTimeout(() => {
  //     saveDraft()
  //   }, 5000) // Sauvegarde après 5 secondes d'inactivité (au lieu de 2)
  //
  //   return () => clearTimeout(timer)
  // }, [statutsData, dossier, id, saveDraft])

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!dossier) {
      toast.error('Aucun dossier chargé')
      return
    }

    try {
      const filename = `Statuts_${dossier.societe.denomination.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`

      toast.loading(`Génération du fichier ${format.toUpperCase()}...`, { id: 'export' })

      const { exportStatuts } = await import('../utils/export-utils')
      await exportStatuts(previewContent, format, filename, 'document-preview-content')

      toast.success(`Document ${format.toUpperCase()} généré avec succès`, { id: 'export' })
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast.error(`Erreur lors de l'export ${format.toUpperCase()}`, { id: 'export' })
    }
  }

  const updateStatutsData = useCallback((updates: Partial<StatutsData>) => {
    setStatutsData((prev) => ({ ...prev, ...updates }))
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
      'section-8': 'article-23',
      'section-9': 'article-24',
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
            {/* Section 0: Type d'associé unique */}
            {shouldShowSection('section-0') && (
              <FormSection
                title="0. Associé unique (Préambule)"
                subtitle="Type d'associé (personne physique ou morale)"
                completed={!!statutsData.associeUnique}
                defaultOpen={!statutsData.associeUnique}
                sectionId="section-0"
                onSectionClick={handleSectionClick}
              >
              <div className="space-y-4">
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
                              [titresField]: nombreTitres,
                            },
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
                              [titresField]: nombreTitres,
                            },
                          })
                          break
                        case 'NATURE_SEUL':
                          updateStatutsData({
                            apportDetaille: {
                              type: 'NATURE_SEUL',
                              description: '',
                              valeur: montant,
                              [titresField]: nombreTitres,
                              commissaireAuxApports: { requis: false },
                            },
                          })
                          break
                        case 'MIXTE_NUMERAIRE_NATURE':
                          updateStatutsData({
                            apportDetaille: {
                              type: 'MIXTE_NUMERAIRE_NATURE',
                              numeraire: { montant: montant / 2, montantLibere: montant / 2 },
                              nature: { description: '', valeur: montant / 2 },
                              [titresField]: nombreTitres,
                              commissaireAuxApports: { requis: false },
                            },
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
                              [titresField]: nombreTitres,
                              commissaireAuxApports: { requis: false },
                            },
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
                              [titresField]: nombreTitres,
                            },
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
                              [titresField]: nombreTitres,
                            },
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

            {/* Section 5: Nantissement */}
            {shouldShowSection('section-5') && (
              <FormSection
                title="5. Nantissement (Article 13)"
              subtitle="Règles de nantissement des parts"
              completed={!!statutsData.nantissement}
              sectionId="section-5"
              onSectionClick={handleSectionClick}
            >
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={statutsData.nantissement?.agrementRequis || false}
                      onChange={(e) =>
                        updateStatutsData({
                          nantissement: {
                            agrementRequis: e.target.checked,
                          },
                        })
                      }
                    />
                    Nantissement soumis à agrément
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Si coché, le nantissement de parts sociales nécessitera l'agrément préalable de l'associé unique.
                    <br />
                    Si non coché, le nantissement sera libre.
                  </p>
                </div>
              </div>
            </FormSection>
            )}

            {/* Section 5bis: Admission/Transmission (Article 11) */}
            {shouldShowSection('section-5bis') && (
              <FormSection
                title={isSASU ? "5bis. Transmission des actions (Articles 11-12)" : "5bis. Admission de nouveaux associés (Article 11)"}
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
                    <Label>Régime de cession *</Label>
                    <Select
                      value={statutsData.admissionAssocies?.regimeCession || 'LIBRE_FAMILIAL_AGREMENT_TIERS'}
                      onChange={(e) =>
                        updateStatutsData({
                          admissionAssocies: {
                            ...(statutsData.admissionAssocies || {
                              regimeCession: 'LIBRE_FAMILIAL_AGREMENT_TIERS',
                              majoriteCessionTiers: 'la moitié',
                            }),
                            regimeCession: e.target.value as 'LIBRE_FAMILIAL_AGREMENT_TIERS' | 'AGREMENT_TOUTES_MUTATIONS',
                          },
                        })
                      }
                    >
                      <option value="LIBRE_FAMILIAL_AGREMENT_TIERS">
                        Libre pour la famille, agrément pour les tiers (régime légal)
                      </option>
                      <option value="AGREMENT_TOUTES_MUTATIONS">
                        Agrément pour toutes les mutations
                      </option>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Le régime légal prévoit la liberté des cessions familiales et l'agrément pour les tiers
                    </p>
                  </div>

                  {statutsData.admissionAssocies?.regimeCession === 'LIBRE_FAMILIAL_AGREMENT_TIERS' && (
                    <div>
                      <Label>Majorité pour cessions aux tiers *</Label>
                      <TrackedInput
                        fieldName="admissionAssocies"
                        value={statutsData.admissionAssocies.majoriteCessionTiers || 'la moitié'}
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
                    </div>
                  )}

                  {statutsData.admissionAssocies?.regimeCession === 'AGREMENT_TOUTES_MUTATIONS' && (
                    <>
                      <div>
                        <Label>Majorité pour toutes mutations *</Label>
                        <TrackedInput
                          fieldName="admissionAssocies"
                          value={statutsData.admissionAssocies.majoriteMutation || 'la moitié'}
                          onChange={(e) =>
                            updateStatutsData({
                              admissionAssocies: {
                                ...statutsData.admissionAssocies!,
                                majoriteMutation: e.target.value,
                              },
                            })
                          }
                          placeholder="Ex: la moitié, les deux tiers..."
                        />
                      </div>
                      <div>
                        <Label>Modalités de détermination du prix de rachat</Label>
                        <TrackedTextarea
                          fieldName="admissionAssocies"
                          value={statutsData.admissionAssocies.modalitesPrixRachat || ''}
                          onChange={(e) =>
                            updateStatutsData({
                              admissionAssocies: {
                                ...statutsData.admissionAssocies!,
                                modalitesPrixRachat: e.target.value,
                              },
                            })
                          }
                          placeholder="Méthode de calcul du prix en cas de refus d'agrément"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={statutsData.admissionAssocies.agrementDeces || false}
                            onChange={(e) =>
                              updateStatutsData({
                                admissionAssocies: {
                                  ...statutsData.admissionAssocies!,
                                  agrementDeces: e.target.checked,
                                },
                              })
                            }
                          />
                          Agrément d'office en cas de décès
                        </Label>
                        {statutsData.admissionAssocies.agrementDeces && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <Label>Bénéficiaires de la continuation</Label>
                              <TrackedInput
                                fieldName="admissionAssocies"
                                value={statutsData.admissionAssocies.beneficiairesContinuation || ''}
                                onChange={(e) =>
                                  updateStatutsData({
                                    admissionAssocies: {
                                      ...statutsData.admissionAssocies!,
                                      beneficiairesContinuation: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Ex: les héritiers, le conjoint survivant..."
                              />
                            </div>
                            <div>
                              <Label>Modalités de valorisation des droits</Label>
                              <TrackedInput
                                fieldName="admissionAssocies"
                                value={statutsData.admissionAssocies.modalitesValeurDroits || ''}
                                onChange={(e) =>
                                  updateStatutsData({
                                    admissionAssocies: {
                                      ...statutsData.admissionAssocies!,
                                      modalitesValeurDroits: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Méthode de calcul de la valeur des droits"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </FormSection>
            )}

            {/* Section 6: Gérance (EURL) ou Présidence (SASU) */}
            {shouldShowSection('section-6') && (
              <FormSection
                title={`6. ${labels.Direction} (Articles 12-20)`}
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
                  <Label htmlFor="dirigeant-associe">Le {labels.dirigeant} est l'associé unique</Label>
                </div>

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

                {/* Champs spécifiques EURL : Durée du mandat */}
                {!isSASU && (
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

                {/* Champs spécifiques EURL : Majorités et modalités (Articles 14-15-16) */}
                {!isSASU && (
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
              </div>
            </FormSection>
            )}

            {/* Section 6bis: Comptes courants (Article 21) */}
            {shouldShowSection('section-6bis') && (
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
              title="7. Exercice social (Article 23)"
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

            {/* Section 8: Commissaires aux comptes */}
            {shouldShowSection('section-8') && (
              <FormSection
              title="8. Commissaires aux comptes (Article 18)"
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
              </div>
            </FormSection>
            )}

            {/* Section 9: Conventions réglementées */}
            {shouldShowSection('section-9') && (
              <FormSection
                title="9. Conventions réglementées (Article 19)"
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

            {/* Section 10: Options */}
            {shouldShowSection('section-10') && (
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
              title="11. Actes en formation (Article 29)"
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
                title="12. Nomination du premier gérant (Article 30 + Conclusion)"
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
                        Le gérant est l'associé unique
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
