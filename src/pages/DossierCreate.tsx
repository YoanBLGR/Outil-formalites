import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Layout } from '../components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Progress } from '../components/ui/progress'
import { CNIUpload } from '../components/cni/CNIUpload'
import { getDatabase, generateDossierNumero } from '../db/database'
import type { FormeJuridique, Client, Societe, CNIData } from '../types'
import { generateChecklist } from '../utils/checklist-templates'
import { generateMandatCCITemplate } from '../utils/mandat-cci-generator'
import { generateAvisConstitutionTemplate } from '../utils/avis-constitution-generator'
import { encodeBase64 } from '../utils/encoding-helpers'
import { v4 as uuidv4 } from 'uuid'

export function DossierCreate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // Start at 0 for type selection
  const totalSteps = 4 // Now includes type selection step
  const [dossierType, setDossierType] = useState<'SOCIETE' | 'EI' | null>(null)

  const [clientData, setClientData] = useState<Client>({
    civilite: 'M',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
  })

  const [societeData, setSocieteData] = useState<Partial<Societe>>({
    formeJuridique: 'SARL',
    denomination: '',
    siege: '',
    capitalSocial: undefined,
    objetSocial: '',
  })

  const handleClientChange = (field: keyof Client, value: string) => {
    setClientData({ ...clientData, [field]: value })
  }

  const handleSocieteChange = (field: keyof Societe, value: string | number) => {
    setSocieteData({ ...societeData, [field]: value })
  }

  const handleCNIDataExtracted = (cniData: CNIData) => {
    setClientData({
      ...clientData,
      civilite: cniData.civilite || clientData.civilite,
      nom: cniData.nom,
      prenom: cniData.prenom,
    })
    toast.success('Données appliquées !', {
      description: 'Les informations ont été pré-remplies depuis votre CNI'
    })
  }

  const canProceedStep1 = () => {
    return (
      clientData.nom &&
      clientData.prenom &&
      clientData.email &&
      clientData.telephone
    )
  }

  const canProceedStep2 = () => {
    return (
      societeData.formeJuridique &&
      societeData.denomination &&
      societeData.siege
    )
  }

  const handleSubmit = async () => {
    if (!societeData.formeJuridique || !societeData.denomination || !societeData.siege) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const db = await getDatabase()
      const numero = await generateDossierNumero(societeData.denomination)
      const now = new Date().toISOString()

      const societe: Societe = {
        formeJuridique: societeData.formeJuridique as FormeJuridique,
        denomination: societeData.denomination,
        siege: societeData.siege,
        capitalSocial: societeData.capitalSocial,
        objetSocial: societeData.objetSocial,
      }

      const checklist = generateChecklist(societe.formeJuridique)

      // Générer le mandat CCI template
      const mandatTemplate = generateMandatCCITemplate()
      const mandatDoc = {
        id: uuidv4(),
        nom: 'Mandat CCI (Personne morale).txt',
        type: 'MANDAT' as const,
        categorie: 'MANDAT',
        fichier: encodeBase64(mandatTemplate), // Encoder en base64 UTF-8
        uploadedAt: now,
        uploadedBy: 'Système',
      }

      // Générer l'avis de constitution template
      const avisTemplate = generateAvisConstitutionTemplate(societe.formeJuridique)
      const avisDoc = {
        id: uuidv4(),
        nom: 'Avis de constitution.txt',
        type: 'AVIS_CONSTITUTION' as const,
        categorie: 'AVIS_CONSTITUTION',
        fichier: encodeBase64(avisTemplate), // Encoder en base64 UTF-8
        uploadedAt: now,
        uploadedBy: 'Système',
      }

      const newDossier = {
        id: uuidv4(),
        numero,
        createdAt: now,
        updatedAt: now,
        typeDossier: 'SOCIETE' as const,
        client: clientData,
        societe,
        statut: 'NOUVEAU' as const,
        documents: [mandatDoc, avisDoc],
        checklist,
        timeline: [
          {
            id: uuidv4(),
            type: 'CREATION' as const,
            description: 'Dossier créé',
            createdAt: now,
            createdBy: 'Utilisateur',
          },
        ],
      }

      await db.dossiers.insert(newDossier)
      
      // Toast avec action pour rediriger vers la rédaction des statuts
      toast.success(`Dossier ${numero} créé avec succès !`, {
        description: 'Vous pouvez maintenant rédiger les statuts',
        duration: 8000,
        action: {
          label: 'Rédiger les statuts',
          onClick: () => navigate(`/dossiers/${newDossier.id}/redaction`),
        },
      })
      
      navigate(`/dossiers/${newDossier.id}`)
    } catch (error) {
      toast.error('Une erreur est survenue lors de la création du dossier')
      console.error(error)
    }
  }

  // Redirect to EI workflow if EI is selected
  const handleTypeSelection = (type: 'SOCIETE' | 'EI') => {
    setDossierType(type)
    if (type === 'EI') {
      navigate('/dossiers/nouveau-ei')
    } else {
      setStep(1)
    }
  }

  return (
    <Layout title="Nouveau dossier" subtitle="Création d'un nouveau dossier client">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Progress value={(step / totalSteps) * 100} className="mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            Étape {step} sur {totalSteps}
          </p>
        </div>

        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Type de dossier</CardTitle>
              <CardDescription>
                Choisissez le type de dossier à créer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => handleTypeSelection('SOCIETE')}
                  className="p-6 border-2 rounded-lg hover:border-primary hover:bg-accent transition-all text-left group"
                >
                  <div className="text-4xl mb-3">🏢</div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary">Société</h3>
                  <p className="text-sm text-muted-foreground">
                    EURL, SARL, SASU, SAS - Création avec rédaction des statuts
                  </p>
                </button>

                <button
                  onClick={() => handleTypeSelection('EI')}
                  className="p-6 border-2 rounded-lg hover:border-primary hover:bg-accent transition-all text-left group"
                >
                  <div className="text-4xl mb-3">👤</div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary">Entrepreneur Individuel</h3>
                  <p className="text-sm text-muted-foreground">
                    EI - Saisie directe pour le Guichet Unique
                  </p>
                </button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => navigate('/dossiers')}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <>
            <div className="mb-6">
              <CNIUpload
                onDataExtracted={handleCNIDataExtracted}
                onError={(error) => console.error('Erreur OCR:', error)}
              />
            </div>

            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-gray-300 w-full"></div>
              <span className="px-4 bg-background text-sm text-muted-foreground whitespace-nowrap">
                ou remplissez manuellement
              </span>
              <div className="border-t border-gray-300 w-full"></div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informations client</CardTitle>
                <CardDescription>
                  Renseignez les informations du client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="civilite">Civilité</Label>
                <Select
                  id="civilite"
                  value={clientData.civilite}
                  onChange={(e) => handleClientChange('civilite', e.target.value as 'M' | 'Mme')}
                >
                  <option value="M">M.</option>
                  <option value="Mme">Mme</option>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={clientData.nom}
                    onChange={(e) => handleClientChange('nom', e.target.value)}
                    placeholder="Dupont"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={clientData.prenom}
                    onChange={(e) => handleClientChange('prenom', e.target.value)}
                    placeholder="Jean"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientData.email}
                  onChange={(e) => handleClientChange('email', e.target.value)}
                  placeholder="jean.dupont@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone *</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={clientData.telephone}
                  onChange={(e) => handleClientChange('telephone', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1()}>
                  Suivant
                </Button>
              </div>
            </CardContent>
          </Card>
          </>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Informations société</CardTitle>
              <CardDescription>
                Renseignez les informations de la société à créer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formeJuridique">Forme juridique *</Label>
                <Select
                  id="formeJuridique"
                  value={societeData.formeJuridique}
                  onChange={(e) =>
                    handleSocieteChange('formeJuridique', e.target.value)
                  }
                >
                  <option value="EURL">EURL</option>
                  <option value="SARL">SARL</option>
                  <option value="SASU">SASU</option>
                  <option value="SAS" disabled>SAS (en cours d'implémentation)</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Note : Le template SAS est en cours d'implémentation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="denomination">Dénomination sociale *</Label>
                <Input
                  id="denomination"
                  value={societeData.denomination}
                  onChange={(e) =>
                    handleSocieteChange('denomination', e.target.value)
                  }
                  placeholder="Ma Société"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siege">Siège social *</Label>
                <Input
                  id="siege"
                  value={societeData.siege}
                  onChange={(e) => handleSocieteChange('siege', e.target.value)}
                  placeholder="1 rue de la Paix, 75000 Paris"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capitalSocial">Capital social (€)</Label>
                <Input
                  id="capitalSocial"
                  type="number"
                  value={societeData.capitalSocial || ''}
                  onChange={(e) =>
                    handleSocieteChange('capitalSocial', parseFloat(e.target.value))
                  }
                  placeholder="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objetSocial">Objet social</Label>
                <Input
                  id="objetSocial"
                  value={societeData.objetSocial}
                  onChange={(e) => handleSocieteChange('objetSocial', e.target.value)}
                  placeholder="Toutes activités de..."
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Retour
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceedStep2()}>
                  Suivant
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
              <CardDescription>
                Vérifiez les informations avant de créer le dossier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Client</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    {clientData.civilite} {clientData.prenom} {clientData.nom}
                  </p>
                  <p className="text-muted-foreground">{clientData.email}</p>
                  <p className="text-muted-foreground">{clientData.telephone}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Société</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    {societeData.formeJuridique} - {societeData.denomination}
                  </p>
                  <p className="text-muted-foreground">{societeData.siege}</p>
                  {societeData.capitalSocial && (
                    <p className="text-muted-foreground">
                      Capital: {societeData.capitalSocial} €
                    </p>
                  )}
                  {societeData.objetSocial && (
                    <p className="text-muted-foreground">{societeData.objetSocial}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Retour
                </Button>
                <Button onClick={handleSubmit}>Créer le dossier</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
