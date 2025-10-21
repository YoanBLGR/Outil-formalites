import { useState } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { TrackedInput } from '../ui/tracked-input'
import { Plus, Trash2 } from 'lucide-react'
import type { Associes, AssocieAvecParts, AssociePersonnePhysique, AssociePersonneMorale } from '../../types/statuts'

interface AssociesListFormProps {
  associes: Associes
  capitalSocial: number
  nombreTotalParts: number // Nombre total de parts de la société
  onChange: (associes: Associes) => void
}

export function AssociesListForm({ associes, capitalSocial, nombreTotalParts, onChange }: AssociesListFormProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newAssocie, setNewAssocie] = useState<'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE'>('PERSONNE_PHYSIQUE')

  const ajouterAssocie = () => {
    const nouveauAssocie: AssocieAvecParts = {
      id: `associe-${Date.now()}`,
      associe: newAssocie === 'PERSONNE_PHYSIQUE' ? {
        type: 'PERSONNE_PHYSIQUE',
        civilite: 'M',
        nom: '',
        prenom: '',
        dateNaissance: '',
        lieuNaissance: '',
        nationalite: 'française',
        adresse: '',
        pourcentageCapital: 0, // Nouveau: pourcentage dans l'associé
      } : {
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
        pourcentageCapital: 0, // Nouveau: pourcentage dans l'associé
      },
      // Les champs nombreParts et montantApport sont optionnels et seront calculés automatiquement
    }

    const nouvelleListe = [...associes.liste, nouveauAssocie]
    onChange({
      liste: nouvelleListe,
      nombreTotal: associes.nombreTotal + 1,
    })
    setEditingIndex(nouvelleListe.length - 1)
  }

  const supprimerAssocie = (index: number) => {
    const nouvelleListe = associes.liste.filter((_, i) => i !== index)
    onChange({
      liste: nouvelleListe,
      nombreTotal: nouvelleListe.length,
    })
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  const updateAssocie = (index: number, updates: Partial<AssocieAvecParts>) => {
    const nouvelleListe = [...associes.liste]
    nouvelleListe[index] = { ...nouvelleListe[index], ...updates }

    // Si le pourcentage de l'associé a changé, recalculer automatiquement
    // le nombre de parts et le montant d'apport
    if (updates.associe) {
      const associe = nouvelleListe[index].associe
      const pourcentage = associe.pourcentageCapital || 0
      
      // Calculs automatiques basés sur le pourcentage
      nouvelleListe[index].nombreParts = Math.round((pourcentage / 100) * nombreTotalParts)
      nouvelleListe[index].montantApport = Math.round((pourcentage / 100) * capitalSocial)
      nouvelleListe[index].pourcentageCapital = pourcentage
    }

    onChange({
      liste: nouvelleListe,
      nombreTotal: nouvelleListe.length,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            {associes.liste.length} associé(s) • Minimum requis : 2
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={newAssocie}
            onChange={(e) => setNewAssocie(e.target.value as 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE')}
            className="text-sm"
          >
            <option value="PERSONNE_PHYSIQUE">Personne physique</option>
            <option value="PERSONNE_MORALE">Personne morale</option>
          </Select>
          <Button onClick={ajouterAssocie} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un associé
          </Button>
        </div>
      </div>

      {associes.liste.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <p>Aucun associé ajouté</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter un associé" pour commencer</p>
        </div>
      )}

      {associes.liste.map((item, index) => {
        const isEditing = editingIndex === index
        const associe = item.associe

        return (
          <div key={item.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">
                  Associé {index + 1}
                  {associe.type === 'PERSONNE_PHYSIQUE' && associe.nom && associe.prenom
                    ? ` - ${associe.civilite} ${associe.prenom} ${associe.nom}`
                    : associe.type === 'PERSONNE_MORALE' && associe.societeNom
                    ? ` - ${associe.societeNom}`
                    : ''}
                </h4>
                <p className="text-sm text-gray-500">
                  {associe.pourcentageCapital?.toFixed(2) || '0.00'}% du capital
                  {item.nombreParts !== undefined && ` • ${item.nombreParts} parts`}
                  {item.montantApport !== undefined && item.montantApport > 0 && ` • ${item.montantApport.toLocaleString('fr-FR')} €`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setEditingIndex(isEditing ? null : index)}
                  size="sm"
                  variant="outline"
                >
                  {isEditing ? 'Masquer' : 'Modifier'}
                </Button>
                <Button
                  onClick={() => supprimerAssocie(index)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isEditing && (
              <div className="space-y-3 pt-3 border-t">
                {associe.type === 'PERSONNE_PHYSIQUE' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Civilité *</Label>
                        <Select
                          value={associe.civilite}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, civilite: e.target.value as 'M' | 'Mme' },
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
                          value={associe.nationalite}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, nationalite: e.target.value },
                            })
                          }
                          placeholder="française"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Nom *</Label>
                        <TrackedInput
                          value={associe.nom}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, nom: e.target.value },
                            })
                          }
                          placeholder="Nom"
                        />
                      </div>
                      <div>
                        <Label>Prénom *</Label>
                        <TrackedInput
                          value={associe.prenom}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, prenom: e.target.value },
                            })
                          }
                          placeholder="Prénom"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Date de naissance *</Label>
                        <TrackedInput
                          type="date"
                          value={associe.dateNaissance}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, dateNaissance: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Lieu de naissance *</Label>
                        <TrackedInput
                          value={associe.lieuNaissance}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, lieuNaissance: e.target.value },
                            })
                          }
                          placeholder="Ville"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Adresse *</Label>
                      <TrackedInput
                        value={associe.adresse}
                        onChange={(e) =>
                          updateAssocie(index, {
                            associe: { ...associe, adresse: e.target.value },
                          })
                        }
                        placeholder="Adresse complète"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Dénomination sociale *</Label>
                      <TrackedInput
                        value={associe.societeNom}
                        onChange={(e) =>
                          updateAssocie(index, {
                            associe: { ...associe, societeNom: e.target.value },
                          })
                        }
                        placeholder="Nom de la société"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Forme juridique *</Label>
                        <Select
                          value={associe.societeFormeJuridique}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, societeFormeJuridique: e.target.value },
                            })
                          }
                        >
                          <option value="">Sélectionner...</option>
                          <option value="SARL">SARL</option>
                          <option value="EURL">EURL</option>
                          <option value="SAS">SAS</option>
                          <option value="SASU">SASU</option>
                          <option value="SA">SA</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Capital social *</Label>
                        <TrackedInput
                          type="number"
                          value={associe.societeCapital?.toString() || ''}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, societeCapital: parseInt(e.target.value) || 0 },
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Siège social *</Label>
                      <TrackedInput
                        value={associe.societeSiege}
                        onChange={(e) =>
                          updateAssocie(index, {
                            associe: { ...associe, societeSiege: e.target.value },
                          })
                        }
                        placeholder="Adresse du siège"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Représentant - Prénom *</Label>
                        <TrackedInput
                          value={associe.representantPrenom}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, representantPrenom: e.target.value },
                            })
                          }
                          placeholder="Prénom"
                        />
                      </div>
                      <div>
                        <Label>Nom *</Label>
                        <TrackedInput
                          value={associe.representantNom}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, representantNom: e.target.value },
                            })
                          }
                          placeholder="Nom"
                        />
                      </div>
                      <div>
                        <Label>Qualité *</Label>
                        <TrackedInput
                          value={associe.representantQualite}
                          onChange={(e) =>
                            updateAssocie(index, {
                              associe: { ...associe, representantQualite: e.target.value },
                            })
                          }
                          placeholder="Gérant, Président..."
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t pt-3 mt-3">
                  <h5 className="font-medium mb-3">Répartition du capital</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Pourcentage du capital * (%)</Label>
                      <TrackedInput
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={associe.pourcentageCapital?.toString() || ''}
                        onChange={(e) =>
                          updateAssocie(index, {
                            associe: { ...associe, pourcentageCapital: parseFloat(e.target.value) || 0 },
                          })
                        }
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ex: 50 pour 50%, 33.33 pour 1/3
                      </p>
                    </div>
                    <div>
                      <Label>Nombre de parts (calculé)</Label>
                      <TrackedInput
                        type="number"
                        value={item.nombreParts?.toString() || '0'}
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Calculé automatiquement
                      </p>
                    </div>
                    <div>
                      <Label>Montant apport (€) (calculé)</Label>
                      <TrackedInput
                        type="number"
                        value={item.montantApport?.toString() || '0'}
                        disabled
                        className="bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Calculé automatiquement
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {associes.liste.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium">Récapitulatif</p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Associés:</span> <strong>{associes.liste.length}</strong>
            </div>
            <div>
              <span className="text-gray-600">Total %:</span>{' '}
              <strong>{associes.liste.reduce((sum, a) => sum + (a.associe.pourcentageCapital || 0), 0).toFixed(2)}%</strong>
            </div>
            <div>
              <span className="text-gray-600">Total parts:</span>{' '}
              <strong>{associes.liste.reduce((sum, a) => sum + (a.nombreParts || 0), 0)}</strong>
            </div>
            <div>
              <span className="text-gray-600">Total apports:</span>{' '}
              <strong>{associes.liste.reduce((sum, a) => sum + (a.montantApport || 0), 0).toLocaleString('fr-FR')} €</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
