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
import { SaisieGuichetUniqueEI } from '../components/ei/SaisieGuichetUniqueEI'
import { getDatabase, generateDossierNumero } from '../db/database'
import type { Client, EntrepreneurIndividuel, CNIData } from '../types'
import { generateChecklistEI } from '../utils/checklist-templates'
import { v4 as uuidv4 } from 'uuid'

export function DossierCreateEI() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const [clientData, setClientData] = useState<Client>({
    civilite: 'M',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
  })

  const [eiData, setEIData] = useState<Partial<EntrepreneurIndividuel>>({
    genre: 'M',
    prenoms: '',
    nomNaissance: '',
    nomUsage: '',
    dateNaissance: '',
    villeNaissance: '',
    paysNaissance: 'France',
    nationalite: 'Française',
    situationMatrimoniale: 'Célibataire',
    commercantAmbulant: false,
    declarationType: 'mensuelle',
    adresseEntrepreneur: '',
    adresseEtablissement: '',
    email: '',
    telephone: '',
    numeroSecuriteSociale: '',
    nomCommercial: '',
    domiciliationDomicile: true,
    adresseDomicile: '',
    nombreActivites: 1,
    descriptionActivites: '',
    optionVersementLiberatoire: false,
  })

  const handleClientChange = (field: keyof Client, value: string) => {
    const updatedClient = { ...clientData, [field]: value }
    setClientData(updatedClient)
    
    // Synchroniser automatiquement les données client vers l'entrepreneur individuel
    if (field === 'nom') {
      setEIData({ ...eiData, nomNaissance: value })
    } else if (field === 'prenom') {
      setEIData({ ...eiData, prenoms: value })
    } else if (field === 'email') {
      setEIData({ ...eiData, email: value })
    } else if (field === 'telephone') {
      setEIData({ ...eiData, telephone: value })
    } else if (field === 'civilite') {
      setEIData({ ...eiData, genre: value as 'M' | 'Mme' })
    }
  }

  const handleEIChange = (field: keyof EntrepreneurIndividuel, value: any) => {
    setEIData({ ...eiData, [field]: value })
  }

  const handleCNIDataExtracted = (cniData: CNIData) => {
    // Pré-remplir les données client
    setClientData({
      ...clientData,
      civilite: cniData.civilite || clientData.civilite,
      nom: cniData.nom,
      prenom: cniData.prenom,
    })

    // Pré-remplir les données EI
    setEIData({
      ...eiData,
      genre: cniData.civilite || eiData.genre,
      prenoms: cniData.prenom,
      nomNaissance: cniData.nom,
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
      eiData.genre &&
      eiData.prenoms &&
      eiData.nomNaissance &&
      eiData.dateNaissance &&
      eiData.villeNaissance &&
      eiData.paysNaissance &&
      eiData.nationalite &&
      eiData.situationMatrimoniale &&
      eiData.adresseEntrepreneur &&
      eiData.email &&
      eiData.telephone &&
      eiData.numeroSecuriteSociale &&
      eiData.adresseDomicile &&
      eiData.nombreActivites &&
      eiData.descriptionActivites &&
      eiData.declarationType !== undefined &&
      eiData.commercantAmbulant !== undefined &&
      eiData.domiciliationDomicile !== undefined &&
      eiData.optionVersementLiberatoire !== undefined
    )
  }

  const handleSubmit = async () => {
    if (!canProceedStep2()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const db = await getDatabase()
      const displayName = eiData.nomCommercial || `${eiData.prenoms} ${eiData.nomNaissance}`
      const numero = await generateDossierNumero(displayName, 'EI')
      const now = new Date().toISOString()

      const entrepreneurIndividuel: EntrepreneurIndividuel = {
        genre: eiData.genre!,
        prenoms: eiData.prenoms!,
        nomNaissance: eiData.nomNaissance!,
        nomUsage: eiData.nomUsage,
        dateNaissance: eiData.dateNaissance!,
        villeNaissance: eiData.villeNaissance,
        lieuNaissance: eiData.lieuNaissance,
        paysNaissance: eiData.paysNaissance!,
        nationalite: eiData.nationalite!,
        situationMatrimoniale: eiData.situationMatrimoniale!,
        commercantAmbulant: eiData.commercantAmbulant!,
        declarationType: eiData.declarationType!,
        adresseEntrepreneur: eiData.adresseEntrepreneur!,
        adresseEtablissement: eiData.adresseEtablissement,
        email: eiData.email!,
        telephone: eiData.telephone!,
        numeroSecuriteSociale: eiData.numeroSecuriteSociale!,
        nomCommercial: eiData.nomCommercial,
        domiciliationDomicile: eiData.domiciliationDomicile!,
        adresseDomicile: eiData.adresseDomicile!,
        nombreActivites: eiData.nombreActivites!,
        descriptionActivites: eiData.descriptionActivites!,
        optionVersementLiberatoire: eiData.optionVersementLiberatoire!,
        codeInseeNaissance: eiData.codeInseeNaissance,
      }

      const checklist = generateChecklistEI()

      const newDossier = {
        id: uuidv4(),
        numero,
        createdAt: now,
        updatedAt: now,
        typeDossier: 'EI' as const,
        client: clientData,
        entrepreneurIndividuel,
        statut: 'NOUVEAU' as const,
        documents: [],
        checklist,
        timeline: [
          {
            id: uuidv4(),
            type: 'CREATION' as const,
            description: 'Dossier EI créé',
            createdAt: now,
            createdBy: 'Utilisateur',
          },
        ],
      }

      await db.dossiers.insert(newDossier)
      
      toast.success(`Dossier ${numero} créé avec succès !`, {
        description: 'Vous pouvez maintenant renseigner les informations pour le Guichet Unique',
        duration: 5000,
      })
      
      navigate(`/dossiers/${newDossier.id}`)
    } catch (error) {
      toast.error('Une erreur est survenue lors de la création du dossier')
      console.error(error)
    }
  }

  return (
    <Layout title="Nouveau dossier EI" subtitle="Création d'un dossier Entrepreneur Individuel">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Progress value={(step / totalSteps) * 100} className="mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            Étape {step} sur {totalSteps}
          </p>
        </div>

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
                  Renseignez les informations de contact du client
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
                  <Button 
                    onClick={() => {
                      // Synchroniser les données client vers l'entrepreneur individuel avant de passer à l'étape 2
                      setEIData({
                        ...eiData,
                        genre: clientData.civilite,
                        prenoms: clientData.prenom,
                        nomNaissance: clientData.nom,
                        email: clientData.email,
                        telephone: clientData.telephone,
                      })
                      setStep(2)
                    }} 
                    disabled={!canProceedStep1()}
                  >
                    Suivant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 2 && (
          <div>
            <SaisieGuichetUniqueEI data={eiData} onChange={handleEIChange} />
            
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2()}>
                Suivant
              </Button>
            </div>
          </div>
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
                <h3 className="font-semibold mb-2">Entrepreneur Individuel</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    {eiData.prenoms} {eiData.nomNaissance}
                    {eiData.nomUsage && ` (usage: ${eiData.nomUsage})`}
                  </p>
                  {eiData.nomCommercial && (
                    <p className="text-muted-foreground">Nom commercial: {eiData.nomCommercial}</p>
                  )}
                  <p className="text-muted-foreground">
                    Né(e) le {eiData.dateNaissance} - {eiData.nationalite}
                  </p>
                  <p className="text-muted-foreground">{eiData.situationMatrimoniale}</p>
                  <p className="text-muted-foreground">{eiData.adresseEntrepreneur}</p>
                  <p className="text-muted-foreground">
                    {eiData.nombreActivites} activité(s) - Déclaration {eiData.declarationType}
                  </p>
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

