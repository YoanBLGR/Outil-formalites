import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { Layout } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Progress } from '../components/ui/progress'
import { StatusBadge } from '../components/workflow/StatusBadge'
import { StatusSelector } from '../components/workflow/StatusSelector'
import { EnhancedChecklist } from '../components/checklist/EnhancedChecklist'
import { DocumentsChecklistGU } from '../components/documents/DocumentsChecklistGU'
import { DossierDetailSkeleton } from '../components/ui/loading-states'
import { Alert, AlertDescription } from '../components/ui/alert'
import { getDatabase } from '../db/database'
import type { Dossier, WorkflowStatus, DocumentType } from '../types'
import { WORKFLOW_STATUS_LABELS, FORME_JURIDIQUE_LABELS } from '../types'
import { generateDocumentsGUChecklist, updateChecklistGUItem } from '../utils/documents-gu-checklist'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Save, Upload, Clock, FileEdit, Sparkles, RefreshCw, Trash2, Pencil, X, Download, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { CardDescription } from '../components/ui/card'
import { calculateSuggestedStatus } from '../utils/status-helpers'
import { fillMandatCCI } from '../utils/mandat-cci-generator'
import { exportMandat } from '../utils/mandat-export'
import { fillAvisConstitution } from '../utils/avis-constitution-generator'
import { exportAvis } from '../utils/avis-constitution-export'
import { encodeBase64, decodeBase64 } from '../utils/encoding-helpers'
import { SaisieGuichetUniqueEI } from '../components/ei/SaisieGuichetUniqueEI'
import { GuichetUniqueButton } from '../components/guichet-unique/GuichetUniqueButton'
import { GuichetUniqueButtonEI } from '../components/guichet-unique/GuichetUniqueButtonEI'
import { GUDebugLogs } from '../components/guichet-unique/GUDebugLogs'
import type { EntrepreneurIndividuel } from '../types'

export function DossierDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('informations')
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [statusSelectorOpen, setStatusSelectorOpen] = useState(false)
  const [showStatusSuggestion, setShowStatusSuggestion] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRedactionSuggestion, setShowRedactionSuggestion] = useState(true)
  const [editingEI, setEditingEI] = useState(false)

  useEffect(() => {
    if (id) {
      loadDossier(id)
    }
  }, [id])

  // Vérifier si le statut suggéré a changé
  useEffect(() => {
    if (dossier) {
      const suggestedStatus = calculateSuggestedStatus(dossier.checklist)
      if (suggestedStatus && suggestedStatus !== dossier.statut) {
        setShowStatusSuggestion(true)
      } else {
        setShowStatusSuggestion(false)
      }
    }
  }, [dossier])

  const loadDossier = async (dossierId: string) => {
    const db = await getDatabase()
    const doc = await db.dossiers.findOne(dossierId).exec()
    if (doc) {
      setDossier(doc.toJSON() as Dossier)
    }
  }

  const handleSave = async () => {
    if (!id || !dossier) return

    try {
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc) {
        await doc.patch({
          client: dossier.client,
          societe: dossier.societe,
          updatedAt: new Date().toISOString(),
        })
        toast.success('Modifications enregistrées avec succès')
      }

      setIsEditing(false)
      loadDossier(id)
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
      console.error(error)
    }
  }

  const handleEIChange = (field: keyof EntrepreneurIndividuel, value: any) => {
    if (!dossier || !dossier.entrepreneurIndividuel) return
    setDossier({
      ...dossier,
      entrepreneurIndividuel: {
        ...dossier.entrepreneurIndividuel,
        [field]: value,
      },
    })
  }

  const handleSaveEI = async () => {
    if (!id || !dossier) return

    try {
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc) {
        await doc.patch({
          entrepreneurIndividuel: dossier.entrepreneurIndividuel,
          updatedAt: new Date().toISOString(),
        })
        toast.success('Informations entrepreneur enregistrées avec succès')
      }

      setEditingEI(false)
      loadDossier(id)
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
      console.error(error)
    }
  }

  const handleStatusChange = async (newStatus: WorkflowStatus) => {
    if (!id || !dossier) return

    try {
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc) {
        const newTimelineEvent = {
          id: crypto.randomUUID(),
          type: 'STATUS_CHANGE' as const,
          description: `Statut changé : ${WORKFLOW_STATUS_LABELS[dossier.statut]} → ${WORKFLOW_STATUS_LABELS[newStatus]}`,
          createdAt: new Date().toISOString(),
          createdBy: 'Utilisateur',
          metadata: {
            oldStatus: dossier.statut,
            newStatus: newStatus,
          },
        }

        await doc.patch({
          statut: newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [...dossier.timeline, newTimelineEvent],
        })

        toast.success(`Statut mis à jour : ${WORKFLOW_STATUS_LABELS[newStatus]}`)
        loadDossier(id)
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut')
      console.error(error)
    }
  }

  const toggleChecklistItem = async (itemId: string) => {
    if (!id || !dossier) return

    try {
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc) {
        const item = dossier.checklist.find((i) => i.id === itemId)
        const updatedChecklist = dossier.checklist.map((i) =>
          i.id === itemId
            ? {
                ...i,
                completed: !i.completed,
                completedAt: !i.completed ? new Date().toISOString() : undefined,
              }
            : i
        )

        const newTimelineEvent = {
          id: crypto.randomUUID(),
          type: 'CHECKLIST_UPDATE' as const,
          description: item ? `${item.completed ? 'Décochée' : 'Cochée'}: ${item.label}` : 'Checklist mise à jour',
          createdAt: new Date().toISOString(),
          createdBy: 'Utilisateur',
        }

        await doc.patch({
          checklist: updatedChecklist,
          updatedAt: new Date().toISOString(),
          timeline: [...dossier.timeline, newTimelineEvent],
        })

        if (item) {
          toast.success(item.completed ? 'Tâche décochée' : 'Tâche complétée !')
        }

        loadDossier(id)
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      console.error(error)
    }
  }

  const toggleDocumentGUItem = async (itemId: string) => {
    if (!id || !dossier || dossier.typeDossier !== 'SOCIETE' || !dossier.societe) return

    try {
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc) {
        // Initialiser la checklist GU si elle n'existe pas
        const currentChecklist = dossier.checklistDocumentsGU || generateDocumentsGUChecklist(dossier.societe.formeJuridique)
        const item = currentChecklist.find((i) => i.id === itemId)
        const updatedChecklist = updateChecklistGUItem(currentChecklist, itemId, {
          completed: item ? !item.completed : true,
        })

        const newTimelineEvent = {
          id: crypto.randomUUID(),
          type: 'CHECKLIST_UPDATE' as const,
          description: item
            ? `Document GU ${item.completed ? 'non complété' : 'complété'}: ${item.label}`
            : 'Checklist Documents GU mise à jour',
          createdAt: new Date().toISOString(),
          createdBy: 'Utilisateur',
        }

        await doc.patch({
          checklistDocumentsGU: updatedChecklist,
          updatedAt: new Date().toISOString(),
          timeline: [...dossier.timeline, newTimelineEvent],
        })

        if (item) {
          toast.success(item.completed ? 'Document marqué comme non complété' : 'Document complété !')
        }

        loadDossier(id)
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      console.error(error)
    }
  }

  const addDocumentGUNote = async (itemId: string, note: string) => {
    if (!id || !dossier || dossier.typeDossier !== 'SOCIETE' || !dossier.societe) return

    try {
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc) {
        const currentChecklist = dossier.checklistDocumentsGU || generateDocumentsGUChecklist(dossier.societe.formeJuridique)
        const updatedChecklist = updateChecklistGUItem(currentChecklist, itemId, {
          notes: note,
        })

        await doc.patch({
          checklistDocumentsGU: updatedChecklist,
          updatedAt: new Date().toISOString(),
        })

        toast.success('Note ajoutée')
        loadDossier(id)
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la note')
      console.error(error)
    }
  }

  const viewDocument = (documentId: string) => {
    // Navigation vers le document ou ouverture d'un modal
    const document = dossier?.documents.find((d) => d.id === documentId)
    if (document) {
      // TODO: Implémenter la visualisation du document
      toast.info(`Visualisation du document: ${document.nom}`)
    }
  }

  const handleUploadForDocumentType = (documentType: DocumentType) => {
    // TODO: Implémenter l'upload spécifique pour un type de document
    toast.info(`Upload pour le type: ${documentType}`)
    // On pourrait ouvrir un modal d'upload ou rediriger vers l'onglet documents
    setActiveTab('documents')
  }

  const handleFileUpload = useCallback(
    async (acceptedFiles: File[]) => {
      if (!id || !dossier) return

      try {
        const db = await getDatabase()
        const doc = await db.dossiers.findOne(id).exec()

        if (doc) {
          const newDocuments = acceptedFiles.map((file) => ({
            id: crypto.randomUUID(),
            nom: file.name,
            type: 'AUTRE' as const,
            url: URL.createObjectURL(file), // In a real app, this would be uploaded to storage
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'Utilisateur',
          }))

          const newTimelineEvent = {
            id: crypto.randomUUID(),
            type: 'DOCUMENT_UPLOAD' as const,
            description: `${acceptedFiles.length} document(s) ajouté(s)`,
            createdAt: new Date().toISOString(),
            createdBy: 'Utilisateur',
          }

          await doc.patch({
            documents: [...dossier.documents, ...newDocuments],
            updatedAt: new Date().toISOString(),
            timeline: [...dossier.timeline, newTimelineEvent],
          })

          toast.success(`${acceptedFiles.length} document(s) ajouté(s) avec succès`)
          loadDossier(id)
        }
      } catch (error) {
        toast.error('Erreur lors de l\'ajout des documents')
        console.error(error)
      }
    },
    [id, dossier]
  )

  const handleDelete = async () => {
    if (!id || !dossier) return

    try {
      setIsDeleting(true)
      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc) {
        await doc.remove()
        toast.success('Dossier supprimé avec succès')
        navigate('/dossiers')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression du dossier')
      console.error(error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Gestion du mandat CCI
  const mandatCCI = dossier?.documents.find((doc) => doc.categorie === 'MANDAT')

  // Gestion de l'avis de constitution
  const avisConstitution = dossier?.documents.find((doc) => doc.categorie === 'AVIS_CONSTITUTION')

  const handleExportMandat = async (format: 'docx' | 'pdf') => {
    if (!mandatCCI || !dossier) return

    try {
      const mandatContent = decodeBase64(mandatCCI.fichier as unknown as string) // Décoder base64 UTF-8
      const filename = `Mandat_CCI_${dossier.societe.denomination.replace(/\s+/g, '_')}`

      await exportMandat(mandatContent, format, filename)
      toast.success(`Mandat exporté en ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(`Erreur lors de l'export du mandat`)
      console.error(error)
    }
  }

  const handleUpdateMandat = async () => {
    if (!id || !dossier || !dossier.statutsDraft) return

    try {
      const updatedMandat = fillMandatCCI(dossier.societe, dossier.statutsDraft.data)

      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc && mandatCCI) {
        // Mettre à jour le document mandat dans la liste des documents
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
          updatedAt: new Date().toISOString(),
        })

        toast.success('Mandat mis à jour avec les données des statuts')
        loadDossier(id)
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du mandat')
      console.error(error)
    }
  }

  const handleExportAvis = async (format: 'docx' | 'pdf') => {
    if (!avisConstitution || !dossier) return

    try {
      const avisContent = decodeBase64(avisConstitution.fichier as unknown as string) // Décoder base64 UTF-8
      const filename = `Avis_Constitution_${dossier.societe.denomination.replace(/\s+/g, '_')}`

      await exportAvis(avisContent, format, filename)
      toast.success(`Avis de constitution exporté en ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(`Erreur lors de l'export de l'avis de constitution`)
      console.error(error)
    }
  }

  const handleUpdateAvis = async () => {
    if (!id || !dossier || !dossier.statutsDraft) return

    try {
      const updatedAvis = fillAvisConstitution(dossier.societe, dossier.statutsDraft.data)

      const db = await getDatabase()
      const doc = await db.dossiers.findOne(id).exec()

      if (doc && avisConstitution) {
        // Mettre à jour le document avis dans la liste des documents
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
          updatedAt: new Date().toISOString(),
        })

        toast.success('Avis de constitution mis à jour avec les données des statuts')
        loadDossier(id)
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'avis de constitution')
      console.error(error)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    multiple: true,
  })

  if (!dossier) {
    return (
      <Layout title="Chargement..." subtitle="">
        <DossierDetailSkeleton />
      </Layout>
    )
  }

  const completedItems = dossier.checklist.filter((item) => item.completed).length
  const totalItems = dossier.checklist.length
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  const suggestedStatus = dossier ? calculateSuggestedStatus(dossier.checklist) : null
  
  const dossierSubtitle = dossier.typeDossier === 'EI' && dossier.entrepreneurIndividuel
    ? (dossier.entrepreneurIndividuel.nomCommercial || 
       `${dossier.entrepreneurIndividuel.prenoms} ${dossier.entrepreneurIndividuel.nomNaissance}`)
    : dossier.societe?.denomination || 'N/A'

  return (
    <Layout title={dossier.numero} subtitle={dossierSubtitle}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dossiers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={dossier.statut} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatusSelectorOpen(true)}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Changer
              </Button>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Suggestion pour commencer la rédaction des statuts (nouveaux dossiers société uniquement) */}
        {showRedactionSuggestion && dossier.typeDossier === 'SOCIETE' && dossier.statut === 'NOUVEAU' && !dossier.statutsDraft && (
          <Alert className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 relative">
            <Pencil className="h-4 w-4 text-purple-600" />
            <button
              onClick={() => setShowRedactionSuggestion(false)}
              className="absolute top-3 right-3 text-purple-400 hover:text-purple-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <AlertDescription className="flex items-center justify-between pr-8">
              <div>
                <p className="font-medium text-purple-900">Commencez la rédaction des statuts</p>
                <p className="text-sm text-purple-700 mt-1">
                  Votre dossier est prêt ! Lancez-vous dans la rédaction des statuts avec notre assistant intelligent.
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => navigate(`/dossiers/${id}/redaction`)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <FileEdit className="mr-2 h-4 w-4" />
                  Rédiger les statuts
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestion automatique de changement de statut */}
        {showStatusSuggestion && suggestedStatus && (
          <Alert className="bg-blue-50 border-blue-200">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Suggestion de changement de statut</p>
                <p className="text-sm text-blue-700 mt-1">
                  Basé sur la progression de votre checklist, nous vous suggérons de passer au statut :{' '}
                  <strong>{WORKFLOW_STATUS_LABELS[suggestedStatus]}</strong>
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStatusSuggestion(false)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Ignorer
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowStatusSuggestion(false)
                    setStatusSelectorOpen(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Ouvrir
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Progression du dossier</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {completedItems} sur {totalItems} tâches complétées
                </p>
              </div>
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} />
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="informations" active={activeTab === 'informations'}>
              Informations
            </TabsTrigger>
            {dossier.typeDossier === 'EI' && (
              <TabsTrigger value="saisie-gu" active={activeTab === 'saisie-gu'}>
                📝 Saisie Guichet Unique
              </TabsTrigger>
            )}
            <TabsTrigger value="checklist" active={activeTab === 'checklist'}>
              Checklist
            </TabsTrigger>
            {dossier.typeDossier === 'SOCIETE' && (
              <>
                <TabsTrigger value="documents-gu" active={activeTab === 'documents-gu'}>
                  📋 Documents à fournir
                </TabsTrigger>
                <TabsTrigger value="documents" active={activeTab === 'documents'}>
                  ✍️ Rédaction & Documents
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="timeline" active={activeTab === 'timeline'}>
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="informations" active={activeTab === 'informations'}>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Civilité</Label>
                        <Select
                          value={dossier.client.civilite}
                          onChange={(e) =>
                            setDossier({
                              ...dossier,
                              client: {
                                ...dossier.client,
                                civilite: e.target.value as 'M' | 'Mme',
                              },
                            })
                          }
                        >
                          <option value="M">M.</option>
                          <option value="Mme">Mme</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={dossier.client.nom}
                          onChange={(e) =>
                            setDossier({
                              ...dossier,
                              client: { ...dossier.client, nom: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prénom</Label>
                        <Input
                          value={dossier.client.prenom}
                          onChange={(e) =>
                            setDossier({
                              ...dossier,
                              client: { ...dossier.client, prenom: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={dossier.client.email}
                          onChange={(e) =>
                            setDossier({
                              ...dossier,
                              client: { ...dossier.client, email: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input
                          type="tel"
                          value={dossier.client.telephone}
                          onChange={(e) =>
                            setDossier({
                              ...dossier,
                              client: { ...dossier.client, telephone: e.target.value },
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Nom complet</p>
                        <p className="font-medium">
                          {dossier.client.civilite} {dossier.client.prenom}{' '}
                          {dossier.client.nom}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{dossier.client.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Téléphone</p>
                        <p className="font-medium">{dossier.client.telephone}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{dossier.typeDossier === 'EI' ? 'Entrepreneur Individuel' : 'Société'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dossier.typeDossier === 'SOCIETE' && dossier.societe ? (
                    isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label>Dénomination sociale</Label>
                          <Input
                            value={dossier.societe.denomination}
                            onChange={(e) =>
                              setDossier({
                                ...dossier,
                                societe: {
                                  ...dossier.societe!,
                                  denomination: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Siège social</Label>
                          <Input
                            value={dossier.societe.siege}
                            onChange={(e) =>
                              setDossier({
                                ...dossier,
                                societe: { ...dossier.societe!, siege: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Capital social (€)</Label>
                          <Input
                            type="number"
                            value={dossier.societe.capitalSocial || ''}
                            onChange={(e) =>
                              setDossier({
                                ...dossier,
                                societe: {
                                  ...dossier.societe!,
                                  capitalSocial: parseFloat(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Objet social</Label>
                          <Input
                            value={dossier.societe.objetSocial || ''}
                            onChange={(e) =>
                              setDossier({
                                ...dossier,
                                societe: {
                                  ...dossier.societe!,
                                  objetSocial: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Forme juridique</p>
                          <p className="font-medium">{dossier.societe.formeJuridique}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Dénomination</p>
                          <p className="font-medium">{dossier.societe.denomination}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Siège social</p>
                          <p className="font-medium">{dossier.societe.siege}</p>
                        </div>
                        {dossier.societe.capitalSocial && (
                          <div>
                            <p className="text-sm text-muted-foreground">Capital social</p>
                            <p className="font-medium">{dossier.societe.capitalSocial} €</p>
                          </div>
                        )}
                        {dossier.societe.objetSocial && (
                          <div>
                            <p className="text-sm text-muted-foreground">Objet social</p>
                            <p className="font-medium">{dossier.societe.objetSocial}</p>
                          </div>
                        )}
                      </div>
                    )
                  ) : dossier.entrepreneurIndividuel ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Nom complet</p>
                        <p className="font-medium">
                          {dossier.entrepreneurIndividuel.prenoms} {dossier.entrepreneurIndividuel.nomNaissance}
                          {dossier.entrepreneurIndividuel.nomUsage && ` (usage: ${dossier.entrepreneurIndividuel.nomUsage})`}
                        </p>
                      </div>
                      {dossier.entrepreneurIndividuel.nomCommercial && (
                        <div>
                          <p className="text-sm text-muted-foreground">Nom commercial</p>
                          <p className="font-medium">{dossier.entrepreneurIndividuel.nomCommercial}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Date de naissance</p>
                        <p className="font-medium">{dossier.entrepreneurIndividuel.dateNaissance}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Adresse</p>
                        <p className="font-medium">{dossier.entrepreneurIndividuel.adresseEntrepreneur}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Activité(s)</p>
                        <p className="font-medium">{dossier.entrepreneurIndividuel.descriptionActivites}</p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {dossier.typeDossier === 'EI' && dossier.entrepreneurIndividuel && (
            <TabsContent value="saisie-gu" active={activeTab === 'saisie-gu'}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Saisie Guichet Unique</CardTitle>
                      <CardDescription className="mt-1">
                        Informations complètes pour la déclaration au Guichet Unique
                      </CardDescription>
                    </div>
                    {editingEI ? (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditingEI(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleSaveEI}>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => setEditingEI(true)}>
                        Modifier
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <SaisieGuichetUniqueEI
                    data={dossier.entrepreneurIndividuel}
                    onChange={handleEIChange}
                    readOnly={!editingEI}
                  />

                  {/* Bouton Guichet Unique pour EI */}
                  {!editingEI && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Transmission au Guichet Unique</h3>
                          <p className="text-sm text-muted-foreground">
                            Créez automatiquement une formalité en brouillon sur le Guichet Unique INPI
                          </p>
                        </div>
                      </div>
                      <GuichetUniqueButtonEI
                        dossier={dossier}
                        onSuccess={async (formalityId, url) => {
                          console.log('Formalité EI créée:', formalityId, url)
                          toast.success('Formalité créée avec succès sur le Guichet Unique')
                          // Recharger le dossier pour voir les données GU
                          await loadDossier(dossier.id)
                        }}
                      />
                      
                      {/* Logs de débogage Guichet Unique */}
                      <GUDebugLogs />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="checklist" active={activeTab === 'checklist'}>
            <EnhancedChecklist
              items={dossier.checklist}
              onToggle={toggleChecklistItem}
            />
          </TabsContent>

          <TabsContent value="documents-gu" active={activeTab === 'documents-gu'}>
            {dossier.typeDossier === 'SOCIETE' && dossier.societe ? (
              <DocumentsChecklistGU
                items={dossier.checklistDocumentsGU || generateDocumentsGUChecklist(dossier.societe.formeJuridique)}
                formeJuridique={dossier.societe.formeJuridique}
                onToggle={toggleDocumentGUItem}
                onAddNote={addDocumentGUNote}
                onViewDocument={viewDocument}
                onUploadDocument={handleUploadForDocumentType}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                La checklist des documents GU est disponible uniquement pour les dossiers société.
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" active={activeTab === 'documents'}>
            {/* Section Rédaction des Statuts - Mise en avant - Uniquement pour les sociétés */}
            {dossier.typeDossier === 'SOCIETE' && dossier.societe && (
            <Card className="mb-6 border-2 border-purple-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                      <FileEdit className="h-6 w-6 text-purple-600" />
                      Rédaction des Statuts
                    </CardTitle>
                    <CardDescription className="mt-2 text-purple-700">
                      {dossier.statutsDraft
                        ? "Vos statuts sont en cours de rédaction. Continuez ou modifiez-les ici."
                        : "Commencez la rédaction des statuts avec notre assistant intelligent et guidé."
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {dossier.statutsDraft ? (
                  // Si les statuts sont déjà en cours de rédaction
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-indigo-50">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-purple-600 flex items-center justify-center">
                          <FileEdit className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-purple-900">Statuts en cours</p>
                          <p className="text-sm text-purple-700">
                            Progression : {Math.round(dossier.statutsDraft.progression || 0)}%
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            Dernière modification : {format(new Date(dossier.statutsDraft.updatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/dossiers/${id}/redaction`)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <FileEdit className="mr-2 h-4 w-4" />
                          Continuer la rédaction
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{Math.round(dossier.statutsDraft.progression || 0)}%</p>
                        <p className="text-xs text-blue-700 mt-1">Complété</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {Object.values(dossier.statutsDraft.sections || {}).filter(Boolean).length}
                        </p>
                        <p className="text-xs text-green-700 mt-1">Sections validées</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{FORME_JURIDIQUE_LABELS[dossier.societe.formeJuridique]}</p>
                        <p className="text-xs text-purple-700 mt-1">Forme juridique</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Si les statuts ne sont pas encore commencés
                  <div className="text-center py-8 space-y-6">
                    <div>
                      <div className="text-6xl mb-4">✍️</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Commencez la rédaction des statuts
                      </h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Notre assistant intelligent vous guide étape par étape pour rédiger des statuts conformes
                        pour votre {FORME_JURIDIQUE_LABELS[dossier.societe.formeJuridique]}.
                        Toutes les informations du dossier seront pré-remplies automatiquement.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        onClick={() => navigate(`/dossiers/${id}/redaction`)}
                        size="lg"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                      >
                        <FileEdit className="mr-2 h-5 w-5" />
                        Démarrer la rédaction
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm max-w-2xl mx-auto mt-8">
                      <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg">
                        <Sparkles className="h-6 w-6 text-blue-600" />
                        <p className="font-medium text-blue-900">Assistant intelligent</p>
                        <p className="text-xs text-blue-700 text-center">Guidage pas à pas personnalisé</p>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg">
                        <Save className="h-6 w-6 text-green-600" />
                        <p className="font-medium text-green-900">Sauvegarde auto</p>
                        <p className="text-xs text-green-700 text-center">Progression enregistrée en temps réel</p>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg">
                        <Download className="h-6 w-6 text-purple-600" />
                        <p className="font-medium text-purple-900">Export facile</p>
                        <p className="text-xs text-purple-700 text-center">PDF et DOCX disponibles</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Section Mandat CCI */}
            {mandatCCI && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Mandat CCI
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Document de pouvoir pour les formalités auprès de la Chambre de Commerce et d'Industrie
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">{mandatCCI.nom}</p>
                        <p className="text-sm text-blue-700">
                          Dernière mise à jour : {format(new Date(mandatCCI.uploadedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExportMandat('docx')}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        DOCX
                      </Button>
                      <Button
                        onClick={() => handleExportMandat('pdf')}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                      {dossier.statutsDraft && (
                        <Button
                          onClick={handleUpdateMandat}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Mettre à jour
                        </Button>
                      )}
                    </div>
                  </div>
                  {!dossier.statutsDraft && (
                    <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Le mandat sera automatiquement rempli lors de la rédaction des statuts
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Section Avis de constitution */}
            {avisConstitution && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Avis de constitution
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Avis légal de constitution de la société pour publication
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">{avisConstitution.nom}</p>
                        <p className="text-sm text-green-700">
                          Dernière mise à jour : {format(new Date(avisConstitution.uploadedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExportAvis('docx')}
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        DOCX
                      </Button>
                      <Button
                        onClick={() => handleExportAvis('pdf')}
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                      {dossier.statutsDraft && (
                        <Button
                          onClick={handleUpdateAvis}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Mettre à jour
                        </Button>
                      )}
                    </div>
                  </div>
                  {!dossier.statutsDraft && (
                    <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      L'avis sera automatiquement rempli lors de la rédaction des statuts
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Section Documents généraux */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Documents</CardTitle>
                  <Button
                    onClick={() => navigate(`/dossiers/${id}/redaction`)}
                    variant="outline"
                  >
                    <FileEdit className="mr-2 h-4 w-4" />
                    Rédiger les statuts
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  {isDragActive ? (
                    <p className="text-lg font-medium">Déposez les fichiers ici...</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        Glissez-déposez des fichiers ici
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ou cliquez pour sélectionner des fichiers
                      </p>
                    </div>
                  )}
                </div>

                {dossier.documents.filter(doc => doc.categorie !== 'MANDAT' && doc.categorie !== 'AVIS_CONSTITUTION').length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucun document uploadé</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dossier.documents.filter(doc => doc.categorie !== 'MANDAT' && doc.categorie !== 'AVIS_CONSTITUTION').map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.nom}</p>
                            <p className="text-xs text-muted-foreground">{doc.type}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(doc.uploadedAt), 'dd/MM/yyyy', {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" active={activeTab === 'timeline'}>
            <Card>
              <CardHeader>
                <CardTitle>Historique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...dossier.timeline]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((event) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 pb-4 border-b last:border-0">
                          <p className="font-medium">{event.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(
                              new Date(event.createdAt),
                              'dd MMMM yyyy à HH:mm',
                              { locale: fr }
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sélecteur de statut */}
        <StatusSelector
          currentStatus={dossier.statut}
          checklist={dossier.checklist}
          onStatusChange={handleStatusChange}
          open={statusSelectorOpen}
          onOpenChange={setStatusSelectorOpen}
        />

        {/* Dialog de confirmation de suppression */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer le dossier <strong>{dossier.numero}</strong> ?
              </DialogDescription>
              <div className="text-sm text-muted-foreground mt-2">
                Cette action est irréversible et supprimera définitivement :
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Toutes les informations du dossier</li>
                  <li>Les documents associés</li>
                  <li>L'historique complet</li>
                </ul>
              </div>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                variant="default"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
