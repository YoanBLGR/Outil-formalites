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
import { DossierDetailSkeleton } from '../components/ui/loading-states'
import { getDatabase } from '../db/database'
import type { Dossier } from '../types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Save, Upload, CheckCircle2, Circle, Clock, FileEdit } from 'lucide-react'

export function DossierDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('informations')
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (id) {
      loadDossier(id)
    }
  }, [id])

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

  return (
    <Layout title={dossier.numero} subtitle={dossier.societe.denomination}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dossiers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-4">
            <StatusBadge status={dossier.statut} />
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
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Modifier
              </Button>
            )}
          </div>
        </div>

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
            <TabsTrigger value="checklist" active={activeTab === 'checklist'}>
              Checklist
            </TabsTrigger>
            <TabsTrigger value="documents" active={activeTab === 'documents'}>
              Documents
            </TabsTrigger>
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
                  <CardTitle>Société</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Dénomination sociale</Label>
                        <Input
                          value={dossier.societe.denomination}
                          onChange={(e) =>
                            setDossier({
                              ...dossier,
                              societe: {
                                ...dossier.societe,
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
                              societe: { ...dossier.societe, siege: e.target.value },
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
                                ...dossier.societe,
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
                                ...dossier.societe,
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
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checklist" active={activeTab === 'checklist'}>
            <Card>
              <CardHeader>
                <CardTitle>Checklist du dossier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dossier.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`${
                            item.completed
                              ? 'line-through text-muted-foreground'
                              : 'font-medium'
                          }`}
                        >
                          {item.label}
                          {item.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </p>
                        {item.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Complété le{' '}
                            {format(new Date(item.completedAt), 'dd MMMM yyyy à HH:mm', {
                              locale: fr,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" active={activeTab === 'documents'}>
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

                {dossier.documents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucun document uploadé</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dossier.documents.map((doc) => (
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
      </div>
    </Layout>
  )
}
