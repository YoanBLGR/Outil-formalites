import type { Societe, FormeJuridique } from '../types'
import type { StatutsData } from '../types/statuts'

/**
 * Extrait le nom et prénom du dirigeant depuis les données des statuts
 */
function extractDirigeantInfo(
  formeJuridique: FormeJuridique,
  statutsData?: Partial<StatutsData>
): { nom: string; prenom: string; qualite: string } | null {
  if (!statutsData) return null

  let nom: string | undefined
  let prenom: string | undefined
  let qualite = ''

  if (formeJuridique === 'SARL' || formeJuridique === 'EURL') {
    qualite = 'Gérant'
    const gerant = statutsData.gerant
    
    // Si le gérant est l'associé unique, prendre les infos de associeUnique
    if (gerant?.isAssocieUnique && statutsData.associeUnique) {
      const associe = statutsData.associeUnique
      if (associe.type === 'PERSONNE_PHYSIQUE') {
        nom = associe.nom
        prenom = associe.prenom
      }
    } else if (gerant) {
      nom = gerant.nom
      prenom = gerant.prenom
    }
  } else {
    qualite = 'Président'
    const president = statutsData.president
    
    // Si le président est l'associé unique, prendre les infos de associeUnique
    if (president?.isAssocieUnique && statutsData.associeUnique) {
      const associe = statutsData.associeUnique
      if (associe.type === 'PERSONNE_PHYSIQUE') {
        nom = associe.nom
        prenom = associe.prenom
      }
    } else if (president) {
      nom = president.nom
      prenom = president.prenom
    }
  }

  // Vérifier que nom et prenom sont bien renseignés
  if (!nom || !prenom) return null

  return {
    nom,
    prenom,
    qualite,
  }
}

/**
 * Extrait la ville depuis une adresse
 * Pattern attendu : "123 Rue Example, 75001 Paris" -> "Paris"
 */
function extractVilleFromAdresse(adresse: string): string {
  // Chercher le pattern "code postal (5 chiffres) suivi d'un espace et de la ville"
  const match = adresse.match(/\d{5}\s+(.+?)$/i)
  if (match) {
    return match[1].trim()
  }

  // Si pas de code postal trouvé, essayer de prendre après la dernière virgule
  const parts = adresse.split(',')
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim()
    // Enlever le code postal si présent au début
    const withoutPostal = lastPart.replace(/^\d{5}\s+/, '')
    return withoutPostal || lastPart
  }

  return adresse
}

/**
 * Formate une date au format DD/MM/YYYY
 */
function formatDateFrench(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Génère le template vide du mandat CCI avec des placeholders
 */
export function generateMandatCCITemplate(): string {
  return `MANDAT
Pour la réalisation des formalités administratives d'entreprise auprès du Guichet Unique

Je soussigné {{NOM_PRENOM_DIRIGEANT}}

Domiciliée à {{ADRESSE_DIRIGEANT}}

Agissant en qualité de {{QUALITE_DIRIGEANT}} de la société {{DENOMINATION}} dont le siège social est situé : {{SIEGE_SOCIAL}} en cours d'immatriculation au RCS de {{VILLE_RCS}}

Donne mandat par la présente à :

CCI Oise
Pôle Démarches Entreprises
N° Siret 130 022 718 00519
18 rue d'ALLONNE
60000 BEAUVAIS

Représentée par Yoan BOULANGER, salarié de la CCI OISE hauts de France, en tant que Conseiller du Pôle Démarches Entreprises ;

D'accomplir, pour moi et en mon nom, auprès de l'INPI, toutes les formalités administratives liées à (cocher la ou les mention.s correspondante.s) :

☒ la création de l'entreprise en formation que je représente.
☐ la modification de la situation de l'entreprise que représente.
☐ la cessation des activités de l'entreprise que je représente.

Le présent mandat prend effet à sa date de signature et s'achèvera lorsque le mandataire aura accompli l'ensemble des missions qui y sont stipulées.

Fait à : {{LIEU_SIGNATURE}}
Le : {{DATE_SIGNATURE}}
Signature du mandant précédée de « Bon pour mandat ».


En qualité de responsable de traitement, la Chambre de Commerce et d'Industrie des Hauts de France (CCIR) (Siren 130 022 718 00014, 299 Boulevard de Leeds, CS 90028, 59 777 LILLE CEDEX) vous informe que les données recueillies par le présent formulaire permettront à la CCIR, se fondant sur l'exécution du contrat vous unissant à la CCIR, d'instruire votre demande en votre nom et pour votre compte et de procéder aux formalités administratives liées à la vie de l'entreprise auprès du Guichet Unique de l'INPI.

Vos données de contact permettront également à la CCIR de vous faire parvenir des informations et enquêtes à des fins non commerciales, à vous inviter à des évènements et à transférer vos données à des partenaires institutionnels de la CCIR. Ces données pourront également être utilisées par la CCIR pour vous faire parvenir des communications à des fins commerciales. Vous pourrez à tout moment vous opposer à ces communications.

Si vous l'acceptez, vos données de contact pourront être transmises aux partenaires de la CCIR à des fins commerciales.
☐ J'accepte que mes données soient transmises aux partenaires de la CCIR à des fins commerciales

Conformément à la règlementation sur la protection des données personnelles, vous disposez de droits sur vos données que vous pouvez exercer à tout moment en contactant la CCIR à l'adresse : dpo@hautsdefrance.cci.fr. Si vous estimez, après avoir contacté le DPO, que vos droits sur vos données ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (Commission Nationale de l'Informatique et des Libertés).

Pour plus d'informations, quant à la collecte et aux traitements de vos données, nous vous invitons à lire notre politique de confidentialité accessible en ligne.
`
}

/**
 * Remplit intelligemment le mandat CCI avec les données disponibles
 */
export function fillMandatCCI(
  societe: Societe,
  statutsData?: Partial<StatutsData>
): string {
  let mandatContent = generateMandatCCITemplate()

  // Remplir la dénomination (toujours disponible)
  mandatContent = mandatContent.replace('{{DENOMINATION}}', societe.denomination)

  // Remplir le siège social (toujours disponible)
  mandatContent = mandatContent.replace('{{SIEGE_SOCIAL}}', societe.siege)

  // Extraire et remplir le lieu de signature et ville RCS
  const ville = extractVilleFromAdresse(societe.siege)
  mandatContent = mandatContent.replace('{{LIEU_SIGNATURE}}', ville)
  mandatContent = mandatContent.replace('{{VILLE_RCS}}', ville)

  // Remplir la date de signature
  const dateSignature = statutsData?.dateSignature
    ? formatDateFrench(statutsData.dateSignature)
    : formatDateFrench(new Date())
  mandatContent = mandatContent.replace('{{DATE_SIGNATURE}}', dateSignature)

  // Remplir les informations du dirigeant si disponibles
  const dirigeantInfo = extractDirigeantInfo(societe.formeJuridique, statutsData)

  if (dirigeantInfo) {
    // Formater le nom en majuscules, prénom en capitale initiale
    const nomPrenom = `${dirigeantInfo.prenom} ${dirigeantInfo.nom.toUpperCase()}`
    mandatContent = mandatContent.replace('{{NOM_PRENOM_DIRIGEANT}}', nomPrenom)
    mandatContent = mandatContent.replace('{{QUALITE_DIRIGEANT}}', dirigeantInfo.qualite)
    console.log('✓ Dirigeant extrait:', nomPrenom, '-', dirigeantInfo.qualite)
  } else {
    // Déterminer la qualité par défaut selon la forme juridique
    const qualiteDefaut =
      societe.formeJuridique === 'SARL' || societe.formeJuridique === 'EURL'
        ? 'Gérant'
        : 'Président'

    // Laisser un placeholder plus explicite si pas de données
    mandatContent = mandatContent.replace(
      '{{NOM_PRENOM_DIRIGEANT}}',
      '[NOM ET PRÉNOM DU DIRIGEANT]'
    )
    mandatContent = mandatContent.replace('{{QUALITE_DIRIGEANT}}', qualiteDefaut)
    
    console.log('⚠️ Informations du dirigeant non trouvées dans les statuts')
    console.log('   Forme juridique:', societe.formeJuridique)
    console.log('   Président:', statutsData?.president)
    console.log('   Gérant:', statutsData?.gerant)
    console.log('   Associé unique:', statutsData?.associeUnique)
  }

  // Remplir l'adresse du dirigeant
  let adresseDirigeant = '[ADRESSE DU DIRIGEANT]'
  
  if (statutsData?.associeUnique && statutsData.associeUnique.type === 'PERSONNE_PHYSIQUE') {
    adresseDirigeant = statutsData.associeUnique.adresse || adresseDirigeant
  } else if (societe.formeJuridique === 'SARL' || societe.formeJuridique === 'EURL') {
    adresseDirigeant = statutsData?.gerant?.adresse || adresseDirigeant
  } else {
    adresseDirigeant = statutsData?.president?.adresse || adresseDirigeant
  }
  
  mandatContent = mandatContent.replace('{{ADRESSE_DIRIGEANT}}', adresseDirigeant)

  return mandatContent
}

/**
 * Met à jour le contenu d'un mandat existant avec de nouvelles données
 */
export function updateMandatContent(
  existingContent: string,
  societe: Societe,
  statutsData?: Partial<StatutsData>
): string {
  // Si le contenu existant contient encore des placeholders, on remplit
  // Sinon, on régénère complètement
  if (
    existingContent.includes('{{') ||
    existingContent.includes('[NOM ET PRÉNOM DU DIRIGEANT]')
  ) {
    return fillMandatCCI(societe, statutsData)
  }

  // Si déjà rempli, on régénère quand même pour prendre les nouvelles données
  return fillMandatCCI(societe, statutsData)
}

