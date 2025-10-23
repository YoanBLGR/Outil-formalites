import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Textarea } from '../ui/textarea'
import type { EntrepreneurIndividuel } from '../../types'

interface SaisieGuichetUniqueEIProps {
  data: Partial<EntrepreneurIndividuel>
  onChange: (field: keyof EntrepreneurIndividuel, value: any) => void
  readOnly?: boolean
}

export function SaisieGuichetUniqueEI({ data, onChange, readOnly = false }: SaisieGuichetUniqueEIProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Informations d'identité de l'entrepreneur individuel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Select
                id="genre"
                value={data.genre || 'M'}
                onChange={(e) => onChange('genre', e.target.value as 'M' | 'Mme')}
                disabled={readOnly}
              >
                <option value="M">Masculin</option>
                <option value="Mme">Féminin</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prenoms">Prénoms *</Label>
              <Input
                id="prenoms"
                value={data.prenoms || ''}
                onChange={(e) => onChange('prenoms', e.target.value)}
                placeholder="Tous les prénoms"
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nomNaissance">Nom de naissance *</Label>
              <Input
                id="nomNaissance"
                value={data.nomNaissance || ''}
                onChange={(e) => onChange('nomNaissance', e.target.value)}
                placeholder="Nom de naissance"
                disabled={readOnly}
              />
            </div>

            {data.genre === 'Mme' && (
              <div className="space-y-2">
                <Label htmlFor="nomUsage">Nom d'usage</Label>
                <Input
                  id="nomUsage"
                  value={data.nomUsage || ''}
                  onChange={(e) => onChange('nomUsage', e.target.value)}
                  placeholder="Nom d'usage (optionnel)"
                  disabled={readOnly}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dateNaissance">Date de naissance *</Label>
              <Input
                id="dateNaissance"
                type="date"
                value={data.dateNaissance || ''}
                onChange={(e) => onChange('dateNaissance', e.target.value)}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="villeNaissance">Ville de naissance *</Label>
              <Input
                id="villeNaissance"
                value={data.villeNaissance || ''}
                onChange={(e) => onChange('villeNaissance', e.target.value)}
                placeholder="ex: Paris, Lyon, Marseille"
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paysNaissance">Pays de naissance *</Label>
              <Select
                id="paysNaissance"
                value={data.paysNaissance || 'France'}
                onChange={(e) => onChange('paysNaissance', e.target.value)}
                disabled={readOnly}
              >
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Suisse">Suisse</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Autre">Autre</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationalite">Nationalité *</Label>
            <Select
              id="nationalite"
              value={data.nationalite || 'Française'}
              onChange={(e) => onChange('nationalite', e.target.value)}
              disabled={readOnly}
            >
              <option value="Française">Française</option>
              <option value="Belge">Belge</option>
              <option value="Suisse">Suisse</option>
              <option value="Luxembourgeoise">Luxembourgeoise</option>
              <option value="Autre UE">Autre UE</option>
              <option value="Hors UE">Hors UE</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="situationMatrimoniale">Situation matrimoniale *</Label>
            <Select
              id="situationMatrimoniale"
              value={data.situationMatrimoniale || 'Célibataire'}
              onChange={(e) => onChange('situationMatrimoniale', e.target.value)}
              disabled={readOnly}
            >
              <option value="Célibataire">Célibataire</option>
              <option value="Marié">Marié</option>
              <option value="Pacsé">Pacsé</option>
              <option value="Concubinage">Concubinage</option>
              <option value="Divorcé">Divorcé</option>
              <option value="Veuf">Veuf</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numeroSecuriteSociale">Numéro de sécurité sociale *</Label>
            <Input
              id="numeroSecuriteSociale"
              value={data.numeroSecuriteSociale || ''}
              onChange={(e) => onChange('numeroSecuriteSociale', e.target.value)}
              placeholder="1 23 45 67 890 123 45"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
          <CardDescription>
            Informations de contact de l'entrepreneur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={data.email || ''}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder="email@exemple.fr"
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                type="tel"
                value={data.telephone || ''}
                onChange={(e) => onChange('telephone', e.target.value)}
                placeholder="06 12 34 56 78"
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresseEntrepreneur">Adresse de l'entrepreneur *</Label>
            <Textarea
              id="adresseEntrepreneur"
              value={data.adresseEntrepreneur || ''}
              onChange={(e) => onChange('adresseEntrepreneur', e.target.value)}
              placeholder="Numéro, rue, code postal, ville"
              rows={3}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domiciliation</CardTitle>
          <CardDescription>
            Informations sur la domiciliation de l'activité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Domiciliation au domicile ? *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="domiciliationDomicile"
                  checked={data.domiciliationDomicile === true}
                  onChange={() => onChange('domiciliationDomicile', true)}
                  disabled={readOnly}
                />
                <span>Oui</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="domiciliationDomicile"
                  checked={data.domiciliationDomicile === false}
                  onChange={() => onChange('domiciliationDomicile', false)}
                  disabled={readOnly}
                />
                <span>Non</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresseDomicile">
              {data.domiciliationDomicile ? 'Adresse du domicile *' : 'Adresse de domiciliation *'}
            </Label>
            <Textarea
              id="adresseDomicile"
              value={data.adresseDomicile || ''}
              onChange={(e) => onChange('adresseDomicile', e.target.value)}
              placeholder="Numéro, rue, code postal, ville"
              rows={3}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresseEtablissement">
              Adresse de l'établissement {!data.domiciliationDomicile && '*'}
            </Label>
            <Textarea
              id="adresseEtablissement"
              value={data.adresseEtablissement || ''}
              onChange={(e) => onChange('adresseEtablissement', e.target.value)}
              placeholder={data.domiciliationDomicile 
                ? "Laisser vide si identique au domicile" 
                : "Numéro, rue, code postal, ville"
              }
              rows={3}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">
              {data.domiciliationDomicile 
                ? "Si votre établissement est à une adresse différente de votre domicile, précisez-la ici."
                : "Adresse où l'activité est exercée (obligatoire si différente du domicile)."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activité professionnelle</CardTitle>
          <CardDescription>
            Informations sur l'activité exercée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomCommercial">Nom commercial (facultatif)</Label>
            <Input
              id="nomCommercial"
              value={data.nomCommercial || ''}
              onChange={(e) => onChange('nomCommercial', e.target.value)}
              placeholder="Nom commercial si différent du nom"
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label>Commerçant ambulant ? *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="commercantAmbulant"
                  checked={data.commercantAmbulant === true}
                  onChange={() => onChange('commercantAmbulant', true)}
                  disabled={readOnly}
                />
                <span>Oui</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="commercantAmbulant"
                  checked={data.commercantAmbulant === false}
                  onChange={() => onChange('commercantAmbulant', false)}
                  disabled={readOnly}
                />
                <span>Non</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombreActivites">Nombre d'activités exercées *</Label>
            <Input
              id="nombreActivites"
              type="number"
              min="1"
              value={data.nombreActivites || 1}
              onChange={(e) => onChange('nombreActivites', parseInt(e.target.value))}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionActivites">Description des activités *</Label>
            <Textarea
              id="descriptionActivites"
              value={data.descriptionActivites || ''}
              onChange={(e) => onChange('descriptionActivites', e.target.value)}
              placeholder="Décrivez les activités exercées"
              rows={4}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Déclarations fiscales et sociales</CardTitle>
          <CardDescription>
            Options de déclaration et de versement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type de déclaration *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="declarationType"
                  checked={data.declarationType === 'mensuelle'}
                  onChange={() => onChange('declarationType', 'mensuelle')}
                  disabled={readOnly}
                />
                <span>Mensuelle</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="declarationType"
                  checked={data.declarationType === 'trimestrielle'}
                  onChange={() => onChange('declarationType', 'trimestrielle')}
                  disabled={readOnly}
                />
                <span>Trimestrielle</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Option pour le versement libératoire ? *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="optionVersementLiberatoire"
                  checked={data.optionVersementLiberatoire === true}
                  onChange={() => onChange('optionVersementLiberatoire', true)}
                  disabled={readOnly}
                />
                <span>Oui</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="optionVersementLiberatoire"
                  checked={data.optionVersementLiberatoire === false}
                  onChange={() => onChange('optionVersementLiberatoire', false)}
                  disabled={readOnly}
                />
                <span>Non</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Le versement libératoire permet de payer l'impôt sur le revenu en même temps que les cotisations sociales
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

