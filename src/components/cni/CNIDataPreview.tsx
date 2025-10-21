import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Badge } from '../ui/badge'
import type { CNIData, CNIFieldConfidence } from '../../types'
import { CheckCircle2, AlertCircle, Edit2, Check, X } from 'lucide-react'

interface CNIDataPreviewProps {
  data: CNIData
  fieldConfidence?: CNIFieldConfidence
  onApply: (data: CNIData) => void
  onCancel: () => void
}

/**
 * Affiche les données extraites d'une CNI avec possibilité d'édition
 */
export function CNIDataPreview({ data, fieldConfidence, onApply, onCancel }: CNIDataPreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<CNIData>(data)

  const handleChange = (field: keyof CNIData, value: string) => {
    setEditedData({ ...editedData, [field]: value })
  }

  const handleApply = () => {
    onApply(editedData)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-50'
    if (confidence >= 70) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return { variant: 'default' as const, icon: CheckCircle2, text: 'Excellente' }
    if (confidence >= 70) return { variant: 'secondary' as const, icon: AlertCircle, text: 'Moyenne' }
    return { variant: 'destructive' as const, icon: AlertCircle, text: 'Faible' }
  }

  const globalBadge = getConfidenceBadge(data.confidence)

  return (
    <Card className="border-2 border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
              Données extraites
            </CardTitle>
            <CardDescription className="mt-2 text-blue-700">
              Vérifiez les informations ci-dessous avant de les appliquer
            </CardDescription>
          </div>
          <Badge variant={globalBadge.variant} className="flex items-center gap-1">
            <globalBadge.icon className="h-3 w-3" />
            Confiance: {data.confidence}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {!isEditing ? (
          // Mode lecture
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium text-lg">{editedData.nom || '(non détecté)'}</p>
                </div>
                {fieldConfidence && (
                  <Badge className={getConfidenceColor(fieldConfidence.nom)}>
                    {fieldConfidence.nom}%
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                <div>
                  <p className="text-sm text-muted-foreground">Prénom</p>
                  <p className="font-medium text-lg">{editedData.prenom || '(non détecté)'}</p>
                </div>
                {fieldConfidence && (
                  <Badge className={getConfidenceColor(fieldConfidence.prenom)}>
                    {fieldConfidence.prenom}%
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                <div>
                  <p className="text-sm text-muted-foreground">Civilité</p>
                  <p className="font-medium text-lg">{editedData.civilite || '(non détecté)'}</p>
                </div>
                {fieldConfidence && (
                  <Badge className={getConfidenceColor(fieldConfidence.civilite)}>
                    {fieldConfidence.civilite}%
                  </Badge>
                )}
              </div>

              {editedData.dateNaissance && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                  <div>
                    <p className="text-sm text-muted-foreground">Date de naissance</p>
                    <p className="font-medium text-lg">{editedData.dateNaissance}</p>
                  </div>
                  {fieldConfidence && (
                    <Badge className={getConfidenceColor(fieldConfidence.dateNaissance)}>
                      {fieldConfidence.dateNaissance}%
                    </Badge>
                  )}
                </div>
              )}

              {editedData.lieuNaissance && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                  <div>
                    <p className="text-sm text-muted-foreground">Lieu de naissance</p>
                    <p className="font-medium text-lg">{editedData.lieuNaissance}</p>
                  </div>
                  {fieldConfidence && (
                    <Badge className={getConfidenceColor(fieldConfidence.lieuNaissance)}>
                      {fieldConfidence.lieuNaissance}%
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleApply} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Check className="mr-2 h-4 w-4" />
                Appliquer ces données
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>
          </>
        ) : (
          // Mode édition
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-civilite">Civilité</Label>
                <Select
                  id="edit-civilite"
                  value={editedData.civilite || 'M'}
                  onChange={(e) => handleChange('civilite', e.target.value)}
                >
                  <option value="M">M.</option>
                  <option value="Mme">Mme</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nom">Nom</Label>
                <Input
                  id="edit-nom"
                  value={editedData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  placeholder="DUPONT"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-prenom">Prénom</Label>
                <Input
                  id="edit-prenom"
                  value={editedData.prenom}
                  onChange={(e) => handleChange('prenom', e.target.value)}
                  placeholder="Jean"
                />
              </div>

              {editedData.dateNaissance && (
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date de naissance</Label>
                  <Input
                    id="edit-date"
                    value={editedData.dateNaissance}
                    onChange={(e) => handleChange('dateNaissance', e.target.value)}
                    placeholder="JJ/MM/AAAA"
                  />
                </div>
              )}

              {editedData.lieuNaissance && (
                <div className="space-y-2">
                  <Label htmlFor="edit-lieu">Lieu de naissance</Label>
                  <Input
                    id="edit-lieu"
                    value={editedData.lieuNaissance}
                    onChange={(e) => handleChange('lieuNaissance', e.target.value)}
                    placeholder="Paris"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setIsEditing(false)} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Valider les modifications
              </Button>
              <Button variant="outline" onClick={() => {
                setEditedData(data)
                setIsEditing(false)
              }}>
                Annuler
              </Button>
            </div>
          </>
        )}

        {data.confidence < 70 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ La confiance de l'extraction est moyenne. Vérifiez attentivement les données avant de les appliquer.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
