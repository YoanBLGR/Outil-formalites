import { Building2, Calculator, Users, FileText, CheckCircle } from 'lucide-react'
import type { Step } from '../components/ui/stepper'

// Structure des étapes du wizard de rédaction des statuts
export const REDACTION_STEPS: Step[] = [
  {
    id: 'identite',
    title: 'Identité',
    description: 'Associé et société',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: 'capital',
    title: 'Capital',
    description: 'Apports et parts',
    icon: <Calculator className="h-5 w-5" />,
  },
  {
    id: 'gouvernance',
    title: 'Gouvernance',
    description: 'Gérance et exercice',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'modalites',
    title: 'Modalités',
    description: 'Options et conventions',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 'finalisation',
    title: 'Finalisation',
    description: 'Récapitulatif et signature',
    icon: <CheckCircle className="h-5 w-5" />,
  },
]

// Mapping des sections vers les étapes
export const SECTION_TO_STEP_MAP: Record<string, number> = {
  // Étape 0 : Identité (sections 0-2)
  'section-0': 0, // Associé unique
  'section-1': 0, // Identité de la société
  'section-2': 0, // Durée

  // Étape 1 : Capital (sections 3-4)
  'section-3': 1, // Capital et apports
  'section-3bis': 1, // Détails des apports
  'section-4': 1, // Parts sociales
  // 'section-5' supprimée - Nantissement n'est plus paramétrable

  // Étape 2 : Gouvernance (sections 6-8)
  'section-5bis': 2, // Admission associés
  'section-6': 2, // Gérance
  'section-6bis': 2, // Comptes courants
  'section-7': 2, // Exercice social
  'section-7bis': 2, // Décisions collectives (SASU)
  'section-8': 2, // Commissaires aux comptes

  // Étape 3 : Modalités (sections 9-11)
  'section-9': 3, // Conventions réglementées
  'section-9bis': 3, // Décisions collectives (SARL)
  'section-10': 3, // Options (fiscale, arbitrage)
  'section-11': 3, // Actes en formation

  // Étape 4 : Finalisation (section 12)
  'section-12': 4, // Signature
}

// Sections par étape (pour l'affichage)
export const STEP_SECTIONS: Record<number, string[]> = {
  0: ['section-0', 'section-1', 'section-2'],
  1: ['section-3', 'section-3bis', 'section-4'], // section-5 (Nantissement) supprimée - contenu fixe dans les templates
  2: ['section-5bis', 'section-6', 'section-6bis', 'section-7', 'section-7bis', 'section-8'],
  3: ['section-9', 'section-9bis', 'section-10', 'section-11'],
  4: ['section-12'],
}

// Titres des sections (pour référence)
export const SECTION_TITLES: Record<string, string> = {
  'section-0': "Associé unique", // Sera "Associés" pour SARL/SAS
  'section-1': "Identité de la société",
  'section-2': "Durée",
  'section-3': "Capital et apports",
  'section-3bis': "Détails des apports",
  'section-4': "Parts sociales",
  // 'section-5' supprimée - Nantissement n'est plus paramétrable (contenu fixe dans tous les templates)
  'section-5bis': "Admission de nouveaux associés",
  'section-6': "Gérance",
  'section-6bis': "Comptes courants d'associé",
  'section-7': "Exercice social",
  'section-7bis': "Décisions collectives",
  'section-8': "Commissaires aux comptes",
  'section-9': "Conventions réglementées",
  'section-9bis': "Décisions collectives (SARL)",
  'section-10': "Options fiscales et arbitrage",
  'section-11': "Actes accomplis en formation",
  'section-12': "Signature des statuts",
}

// Fonction pour obtenir le titre d'une section selon la forme juridique
export function getSectionTitle(sectionId: string, formeJuridique?: string): string {
  // Pour la section-0, adapter le titre selon la forme juridique
  if (sectionId === 'section-0') {
    const isPluriel = formeJuridique === 'SARL' || formeJuridique === 'SAS'
    return isPluriel ? "Associés" : "Associé unique"
  }

  return SECTION_TITLES[sectionId] || sectionId
}

// Validation des étapes : retourne true si l'étape est complète
export function isStepComplete(step: number, data: any): boolean {
  const isSASU = data.formeJuridique === 'SASU' || data.formeJuridique === 'SAS'
  const isSARL = data.formeJuridique === 'SARL' || data.formeJuridique === 'SAS'

  switch (step) {
    case 0: // Identité
      // Pour SARL/SAS : vérifier 'associes', sinon vérifier 'associeUnique'
      const hasAssocies = isSARL
        ? (data.associes && data.associes.liste && data.associes.liste.length >= 2)
        : !!data.associeUnique

      return !!(
        hasAssocies &&
        data.denomination &&
        data.objetSocial &&
        data.siegeSocial &&
        data.duree
      )

    case 1: // Capital
      return !!(
        data.capitalSocial &&
        data.apportDetaille &&
        (isSASU ? data.nombreActions : data.nombreParts) &&
        data.valeurNominale
      )

    case 2: // Gouvernance
      if (isSASU) {
        return !!(
          data.president &&
          data.exerciceSocial &&
          data.commissairesAuxComptes &&
          data.transmissionActions
        )
      } else {
        return !!(
          data.gerant &&
          data.exerciceSocial &&
          data.commissairesAuxComptes &&
          data.admissionAssocies
        )
      }

    case 3: // Modalités
      if (isSASU) {
        return !!data.conventionsReglementees
      } else if (isSARL) {
        // Pour SARL : vérifier les décisions collectives (Article 24)
        return !!(
          data.formesDecisionsCollectives &&
          data.decisionsOrdinaires &&
          data.quorumExtraordinaire1 &&
          data.quorumExtraordinaire2 &&
          data.majoriteExtraordinaire
        )
      } else {
        // Pour EURL : vérifier l'option fiscale
        return !!(
          data.conventionsReglementees &&
          data.optionFiscale
        )
      }

    case 4: // Finalisation
      return !!(
        data.lieuSignature &&
        data.nombreExemplaires
      )

    default:
      return false
  }
}

// Champs requis par étape (pour validation détaillée)
export const STEP_REQUIRED_FIELDS: Record<number, Array<{ path: string; label: string }>> = {
  0: [
    // Pour EURL/SASU
    { path: 'associeUnique.type', label: "Type d'associé" },
    { path: 'associeUnique.nom', label: 'Nom' },
    { path: 'associeUnique.prenom', label: 'Prénom' },
    // Pour SARL/SAS
    { path: 'associes.liste', label: 'Associés (minimum 2)' },
    // Commun
    { path: 'denomination', label: 'Dénomination sociale' },
    { path: 'objetSocial', label: 'Objet social' },
    { path: 'siegeSocial', label: 'Siège social' },
    { path: 'duree', label: 'Durée de la société' },
  ],
  1: [
    { path: 'capitalSocial', label: 'Capital social' },
    { path: 'apportDetaille.type', label: "Type d'apport" },
    { path: 'apportDetaille.montant', label: 'Montant des apports' },
    { path: 'nombreParts', label: 'Nombre de parts' },
    { path: 'valeurNominale', label: 'Valeur nominale' },
  ],
  2: [
    { path: 'gerant.dureeMandat', label: 'Durée du mandat du gérant' },
    { path: 'gerant.pouvoirs', label: 'Pouvoirs du gérant' },
    { path: 'exerciceSocial.dateDebut', label: "Début de l'exercice social" },
    { path: 'exerciceSocial.dateFin', label: "Fin de l'exercice social" },
  ],
  3: [
    { path: 'optionFiscale', label: 'Option fiscale' },
  ],
  4: [
    { path: 'lieuSignature', label: 'Lieu de signature' },
    { path: 'nombreExemplaires', label: "Nombre d'exemplaires" },
  ],
}

// Helper pour accéder à une propriété imbriquée
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Obtenir les erreurs de validation pour une étape
export function getStepValidationErrors(step: number, data: any): string[] {
  const requiredFields = STEP_REQUIRED_FIELDS[step] || []
  const errors: string[] = []
  const isSASU = data.formeJuridique === 'SASU' || data.formeJuridique === 'SAS'
  const isSARL = data.formeJuridique === 'SARL' || data.formeJuridique === 'SAS'

  for (const field of requiredFields) {
    // Étape 0 : Associés
    if (step === 0) {
      // Pour SARL/SAS, ignorer les champs associeUnique
      if (isSARL && field.path.startsWith('associeUnique')) {
        continue
      }
      // Pour EURL/SASU, ignorer les champs associes
      if (!isSARL && field.path.startsWith('associes')) {
        continue
      }
      // Validation spécifique pour associes.liste (min 2 associés)
      if (field.path === 'associes.liste') {
        const liste = getNestedValue(data, 'associes.liste')
        if (!liste || !Array.isArray(liste) || liste.length < 2) {
          errors.push('Au moins 2 associés sont requis pour une SARL')
        }
        continue
      }
    }

    // Adaptation pour SASU : nombreActions au lieu de nombreParts
    if (field.path === 'nombreParts' && isSASU) {
      const value = getNestedValue(data, 'nombreActions')
      if (value === undefined || value === null || value === '') {
        errors.push('Nombre d\'actions est requis')
      }
      continue
    }

    // Adaptation pour SASU : president au lieu de gerant
    if (field.path === 'gerant.dureeMandat' && isSASU) {
      const value = getNestedValue(data, 'president')
      if (!value) {
        errors.push('Président est requis')
      }
      continue
    }

    if (field.path === 'gerant.pouvoirs' && isSASU) {
      // Pas de champ "pouvoirs" pour le président SASU
      continue
    }

    // Adaptation pour SASU : pas d'option fiscale
    if (field.path === 'optionFiscale' && isSASU) {
      // Pas d'option fiscale pour SASU
      continue
    }

    const value = getNestedValue(data, field.path)
    if (value === undefined || value === null || value === '') {
      errors.push(`${field.label} est requis`)
    }
  }

  return errors
}
