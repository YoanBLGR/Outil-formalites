/**
 * Générateur d'Avis de Constitution
 * Génère automatiquement un avis de constitution selon la forme juridique (SASU ou EURL)
 */

import type { Societe, FormeJuridique } from '../types'
import type { StatutsData } from '../types/statuts'

/**
 * Formate une date au format français DD/MM/YYYY
 */
export function formatDateFrench(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Extrait la ville d'une adresse (dernière partie après la virgule)
 */
export function extractVilleFromAdresse(adresse: string): string {
  const parts = adresse.split(',').map(p => p.trim())
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1]
    // Supprimer le code postal si présent
    const cityMatch = lastPart.match(/\d{5}\s+(.+)/)
    if (cityMatch) {
      return cityMatch[1].trim()
    }
    // Sinon essayer de supprimer juste les chiffres au début
    return lastPart.replace(/^\d+\s*/, '').trim()
  }
  return adresse
}

/**
 * Extrait les informations du dirigeant selon la forme juridique
 */
export function extractDirigeantInfoForAvis(
  formeJuridique: FormeJuridique,
  statutsData?: Partial<StatutsData>
): {
  nomComplet: string
  civilite: string
  adresse: string
  qualite: string
} {
  let nomComplet = '[NOM ET PRÉNOM DU DIRIGEANT]'
  let civilite = 'M.'
  let adresse = '[ADRESSE DOMICILE]'
  let qualite = ''

  if (!statutsData) {
    console.log('⚠️ Pas de données statutaires')
    return { nomComplet, civilite, adresse, qualite }
  }

  // Pour SASU/SAS : Président
  if (formeJuridique === 'SASU' || formeJuridique === 'SAS') {
    qualite = 'Président'
    
    if (statutsData.president?.isAssocieUnique && statutsData.associeUnique) {
      const associe = statutsData.associeUnique
      if (associe.type === 'PERSONNE_PHYSIQUE') {
        const prenom = associe.prenom || ''
        const nom = (associe.nom || '').toUpperCase()
        civilite = associe.civilite === 'Mme' ? 'Mme' : 'M.'
        nomComplet = `${civilite} ${prenom} ${nom}`
        adresse = associe.adresse || '[ADRESSE DOMICILE]'
        console.log('✓ Président extrait (associé unique):', nomComplet)
      }
    } else if (statutsData.president?.nom && statutsData.president?.prenom) {
      const prenom = statutsData.president.prenom
      const nom = statutsData.president.nom.toUpperCase()
      civilite = statutsData.president.civilite === 'Mme' ? 'Mme' : 'M.'
      nomComplet = `${civilite} ${prenom} ${nom}`
      adresse = statutsData.president.adresse || '[ADRESSE DOMICILE]'
      console.log('✓ Président extrait:', nomComplet)
    }
  }
  
  // Pour EURL/SARL : Gérant
  if (formeJuridique === 'EURL' || formeJuridique === 'SARL') {
    qualite = 'Gérant'
    
    if (statutsData.gerant?.isAssocieUnique && statutsData.associeUnique) {
      const associe = statutsData.associeUnique
      if (associe.type === 'PERSONNE_PHYSIQUE') {
        const prenom = associe.prenom || ''
        const nom = (associe.nom || '').toUpperCase()
        civilite = associe.civilite === 'Mme' ? 'Mme' : 'M.'
        nomComplet = `${civilite} ${prenom} ${nom}`
        adresse = associe.adresse || '[ADRESSE DOMICILE]'
        console.log('✓ Gérant extrait (associé unique):', nomComplet)
      }
    } else if (statutsData.gerant?.nom && statutsData.gerant?.prenom) {
      const prenom = statutsData.gerant.prenom
      const nom = statutsData.gerant.nom.toUpperCase()
      civilite = statutsData.gerant.civilite === 'Mme' ? 'Mme' : 'M.'
      nomComplet = `${civilite} ${prenom} ${nom}`
      adresse = statutsData.gerant.adresse || '[ADRESSE DOMICILE]'
      console.log('✓ Gérant extrait:', nomComplet)
    }
  }

  return { nomComplet, civilite, adresse, qualite }
}

/**
 * Génère un template vide d'avis de constitution selon la forme juridique
 */
export function generateAvisConstitutionTemplate(formeJuridique: FormeJuridique): string {
  if (formeJuridique === 'SASU') {
    return generateAvisSASUTemplate()
  } else if (formeJuridique === 'EURL') {
    return generateAvisEURLTemplate()
  }
  // Par défaut, retourner le template SASU
  return generateAvisSASUTemplate()
}

/**
 * Template SASU
 */
function generateAvisSASUTemplate(): string {
  return `Avis de constitution

Suivant un acte sous seing privé en date à [VILLE SIGNATURE STATUTS] du [DATE SIGNATURE STATUTS] a été constitué sous la dénomination sociale « [DENOMINATION SOCIALE] » une société par actions simplifiée unipersonnelle présentant les caractéristiques suivantes :

Forme : Société par actions simplifiée unipersonnelle

Dénomination sociale : [DENOMINATION SOCIALE]

Siège social : [SIEGE SOCIAL]

Objet social : [OBJET SOCIAL]

Président : [SEXE NOM PRENOM], demeurant [ADRESSE DOMICILE], élu pour une durée illimitée.

Durée : 99 ans à compter de son immatriculation au RCS de [VILLE RCS].

Capital : [MONTANT CAPITAL] €

Exercice du droit de vote : Tout associé peut participer aux décisions collectives. Pour l'exercice du droit de vote, une action donne droit à une voix.

Transmission d'actions : La cession des actions est soumise à la procédure d'agrément prévue aux statuts.

Immatriculation : au RCS de [VILLE RCS]`
}

/**
 * Template EURL
 */
function generateAvisEURLTemplate(): string {
  return `Avis de constitution

Suivant un acte sous seing privé en date du [DATE SIGNATURE STATUTS] il a été constitué sous la dénomination sociale « [DENOMINATION SOCIALE] » une Société à responsabilité limitée présentant les caractéristiques suivantes :

Forme : Société à responsabilité limitée

Dénomination sociale : [DENOMINATION SOCIALE]

Siège social : [SIEGE SOCIAL]

Objet social : [OBJET SOCIAL]

Gérant : [SEXE NOM PRENOM], demeurant [ADRESSE DOMICILE] est désigné en qualité de Gérant.

Durée : [DUREE SOCIETE] années à compter de l'immatriculation de la société au RCS.

Capital : [MONTANT CAPITAL] €

Immatriculation : au RCS de [VILLE RCS]`
}

/**
 * Remplit l'avis de constitution avec les données de la société et des statuts
 */
export function fillAvisConstitution(
  societe: Societe,
  statutsData?: Partial<StatutsData>
): string {
  const formeJuridique = societe.formeJuridique
  let template = generateAvisConstitutionTemplate(formeJuridique)

  // Extraction des informations du dirigeant
  const dirigeant = extractDirigeantInfoForAvis(formeJuridique, statutsData)

  // Informations générales
  const denomination = societe.denomination || '[DENOMINATION SOCIALE]'
  const siegeSocial = societe.siege || '[SIEGE SOCIAL]'
  const objetSocial = societe.objetSocial || statutsData?.objetSocial || '[OBJET SOCIAL]'
  const villeRCS = extractVilleFromAdresse(siegeSocial)
  const montantCapital = societe.capitalSocial || statutsData?.capitalSocial?.montantTotal || 0

  // Date et lieu de signature
  const dateSignature = statutsData?.dateSignature
    ? formatDateFrench(statutsData.dateSignature)
    : formatDateFrench(new Date())
  const lieuSignature = statutsData?.lieuSignature || extractVilleFromAdresse(siegeSocial)

  // Durée (pour EURL)
  const dureeSociete = statutsData?.dureeSociete || 99

  // Remplacement des placeholders
  template = template
    .replace(/\[VILLE SIGNATURE STATUTS\]/g, lieuSignature)
    .replace(/\[DATE SIGNATURE STATUTS\]/g, dateSignature)
    .replace(/\[DENOMINATION SOCIALE\]/g, denomination)
    .replace(/\[SIEGE SOCIAL\]/g, siegeSocial)
    .replace(/\[OBJET SOCIAL\]/g, objetSocial)
    .replace(/\[SEXE NOM PRENOM\]/g, dirigeant.nomComplet)
    .replace(/\[ADRESSE DOMICILE\]/g, dirigeant.adresse)
    .replace(/\[VILLE RCS\]/g, villeRCS)
    .replace(/\[MONTANT CAPITAL\]/g, montantCapital.toString())
    .replace(/\[DUREE SOCIETE\]/g, dureeSociete.toString())

  console.log('✓ Avis de constitution rempli pour', formeJuridique)
  return template
}

