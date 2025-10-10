import type { ChecklistItem, FormeJuridique } from '../types'
import { v4 as uuidv4 } from 'uuid'

export function generateChecklist(formeJuridique: FormeJuridique): ChecklistItem[] {
  const baseChecklist: Omit<ChecklistItem, 'id'>[] = [
    {
      label: 'Informations société collectées',
      completed: false,
      required: true,
    },
    {
      label: 'Informations gérant/président collectées',
      completed: false,
      required: true,
    },
    {
      label: 'Devis signé reçu',
      completed: false,
      required: true,
    },
    {
      label: 'Projet de statuts rédigé',
      completed: false,
      required: true,
    },
    {
      label: 'Projet de statuts envoyé au client',
      completed: false,
      required: true,
    },
    {
      label: 'Attestation de dépôt des fonds reçue',
      completed: false,
      required: true,
    },
    {
      label: 'CNI gérant/président reçue',
      completed: false,
      required: true,
    },
    {
      label: 'Déclaration de non condamnation reçue',
      completed: false,
      required: true,
    },
    {
      label: 'Justificatif d\'occupation du siège reçu',
      completed: false,
      required: true,
    },
    {
      label: 'Statuts signés',
      completed: false,
      required: true,
    },
    {
      label: 'Annonce légale rédigée',
      completed: false,
      required: true,
    },
    {
      label: 'Annonce légale publiée',
      completed: false,
      required: true,
    },
    {
      label: 'Attestation de parution reçue',
      completed: false,
      required: true,
    },
    {
      label: 'Formulaire M0 complété',
      completed: false,
      required: true,
    },
    {
      label: 'Formalité saisie sur le Guichet Unique',
      completed: false,
      required: true,
    },
    {
      label: 'Dossier transmis au greffe',
      completed: false,
      required: true,
    },
  ]

  if (formeJuridique === 'SAS' || formeJuridique === 'SASU') {
    baseChecklist.splice(6, 0, {
      label: 'Liste des souscripteurs établie',
      completed: false,
      required: true,
      formeJuridique: ['SAS', 'SASU'],
    })
  }

  return baseChecklist.map((item) => ({
    ...item,
    id: uuidv4(),
  }))
}
