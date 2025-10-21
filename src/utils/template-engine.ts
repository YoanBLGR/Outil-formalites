import type { StatutsData, AssocieAvecParts } from '../types/statuts'
import type { Dossier } from '../types'
import templateEURLV3 from '../templates/statuts-eurl-conforme-v3.json'
import templateSARLV1 from '../templates/statuts-sarl-conforme-v1.json'
import templateSASUV1 from '../templates/statuts-sasu-conforme-v1.json'
import { nombreEnLettres, montantAvecLettres, accorderGenre, formaterDateFrancais, formaterDateCourte, formaterNombreFrancais } from './text-helpers'

// Template types for v2
export interface TemplateVariant {
  condition: string
  contenu?: string
  texte?: string
  variables?: string[]
  observations?: string
}

export interface TemplateArticle {
  numero: number | string
  titre: string
  contenu?: string
  variants?: TemplateVariant[]
  sousSections?: TemplateArticle[]  // Support for nested sub-sections
  variables?: string[]
  obligatoire: boolean
  observations?: string
}

export interface TemplatePreambule {
  variants: TemplateVariant[]
}

export interface TemplateConclusion {
  texte: string
  variables: string[]
}

export interface StatutsTemplate {
  formeJuridique: string
  titre: string
  preambule: TemplatePreambule | string
  articles: TemplateArticle[]
  conclusion: TemplateConclusion | string
  variablesConcl?: string[]
  variablesGlobales?: string[]
}

// Fonction pour charger le template selon la forme juridique
export function getTemplate(formeJuridique: string): StatutsTemplate {
  switch (formeJuridique) {
    case 'EURL':
      return templateEURLV3 as StatutsTemplate
    case 'SARL':
      return templateSARLV1 as StatutsTemplate
    case 'SASU':
      return templateSASUV1 as StatutsTemplate
    case 'SAS':
      // TODO: Implémenter template SAS (utilise SASU pour l'instant)
      return templateSASUV1 as StatutsTemplate
    default:
      return templateEURLV3 as StatutsTemplate
  }
}

// Évaluer une condition simple ou composée
function evaluateCondition(condition: string, variables: Record<string, any>): boolean {
  // Support for: literal booleans, simple variables, equality checks, negation, AND (&&), OR (||)
  try {
    // Special case: literal "true" or "false" (without variable)
    if (condition.trim() === 'true') {
      return true
    }
    if (condition.trim() === 'false') {
      return false
    }

    // Handle compound conditions with && (AND)
    if (condition.includes('&&')) {
      const parts = condition.split('&&').map(p => p.trim())
      return parts.every(part => evaluateCondition(part, variables))
    }

    // Handle compound conditions with || (OR)
    if (condition.includes('||')) {
      const parts = condition.split('||').map(p => p.trim())
      return parts.some(part => evaluateCondition(part, variables))
    }

    // Handle negation: !variableName
    const negationMatch = condition.match(/^!\s*(\w+)$/)
    if (negationMatch) {
      const [, varName] = negationMatch
      const varValue = variables[varName]
      // Consider empty string, undefined, null, false, 0 as falsy
      return !varValue
    }

    // Handle simple equality checks
    const match = condition.match(/(\w+)\s*===\s*['"]?(\w+)['"]?/)
    if (match) {
      const [, varName, value] = match
      const varValue = variables[varName]

      // Compare as strings
      if (value === 'true' || value === 'false') {
        return varValue === (value === 'true')
      }
      return String(varValue) === value
    }

    // Handle simple variable check (truthy/falsy)
    const simpleVarMatch = condition.match(/^\s*(\w+)\s*$/)
    if (simpleVarMatch) {
      const [, varName] = simpleVarMatch
      return !!variables[varName]
    }

    return false
  } catch {
    return false
  }
}

// Traiter les blocs conditionnels {{#if}}...{{/if}}
function processConditionals(texte: string, variables: Record<string, any>): string {
  let result = texte

  // Process {{#if variable}} ... {{else}} ... {{/if}} blocks (with else)
  const ifElsePattern = /\{\{#if\s+(\w+)\}\}(.*?)\{\{else\}\}(.*?)\{\{\/if\}\}/gs

  result = result.replace(ifElsePattern, (_match, variable, trueContent, falseContent) => {
    const value = variables[variable]
    // If variable is truthy, include the true content, otherwise the false content
    return value ? trueContent : falseContent
  })

  // Process {{#if variable}} ... {{/if}} blocks (without else)
  const ifPattern = /\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs

  result = result.replace(ifPattern, (_match, variable, content) => {
    const value = variables[variable]
    // If variable is truthy, include the content, otherwise remove the block
    if (value) {
      return content
    }
    return ''
  })

  return result
}

// Fonction pour remplacer les variables dans un texte
export function replaceVariables(
  texte: string,
  variables: Record<string, string | number | boolean>
): string {
  // First process conditionals
  let result = processConditionals(texte, variables)

  // Then replace simple variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, String(value))
  })

  // Clean up any remaining unreplaced variables
  result = result.replace(/\{\{\w+\}\}/g, '[À compléter]')

  return result
}

// Générer le contenu d'un article ou sous-section (récursif)
function generateArticleContent(
  article: TemplateArticle,
  variables: Record<string, any>,
  level: number = 0
): string {
  let content = ''

  // If article has direct content, use it
  if (article.contenu) {
    content = article.contenu
  }
  // If article has variants, evaluate conditions
  else if (article.variants) {
    for (const variant of article.variants) {
      if (evaluateCondition(variant.condition, variables)) {
        content = variant.contenu || variant.texte || ''
        break
      }
    }
  }

  // If article has sub-sections, process them recursively
  if (article.sousSections && article.sousSections.length > 0) {
    const subSectionsContent: string[] = []

    for (const subSection of article.sousSections) {
      const subContent = generateArticleContent(subSection, variables, level + 1)

      // Only include sub-section if it has content
      if (subContent && subContent.trim()) {
        let subSectionText = ''

        // Add sub-section title (e.g., "6.1 - Apports en numéraire")
        if (subSection.titre) {
          subSectionText += `${subSection.numero} - ${subSection.titre}\n\n`
        }

        subSectionText += subContent
        subSectionsContent.push(subSectionText)
      }
    }

    // If there are sub-sections with content, combine them
    if (subSectionsContent.length > 0) {
      if (content) {
        content += '\n\n' + subSectionsContent.join('\n\n')
      } else {
        content = subSectionsContent.join('\n\n')
      }
    }
  }

  return content || ''
}

// Legacy function for backward compatibility
function selectArticleVariant(
  article: TemplateArticle,
  variables: Record<string, any>
): string {
  return generateArticleContent(article, variables) || '[Article non disponible pour cette configuration]'
}

// Sélectionner le variant du préambule
function selectPreambuleVariant(
  preambule: TemplatePreambule | string,
  variables: Record<string, any>
): string {
  if (typeof preambule === 'string') {
    return preambule
  }

  // Evaluate conditions for variants
  for (const variant of preambule.variants) {
    if (evaluateCondition(variant.condition, variables)) {
      return variant.texte || ''
    }
  }

  return '[Préambule non disponible]'
}

// Fonction helper pour générer le texte de l'article 17 (Gérance - Nomination)
function generateTexteNominationGerant(
  statutsData: Partial<StatutsData>
): string {
  const dureeMandat = statutsData.dureeMandat || 'INDETERMINEE'
  const majoriteNomination = statutsData.majoriteNomination || 'LEGALE_AVEC_SECONDE'
  const anneesDuree = statutsData.anneesDureeMandat || 5
  const reeligible = statutsData.reeligible !== false // Par défaut true
  const niveauMajorite = statutsData.niveauMajoriteRenforcee || 'deux tiers'

  let texte = ''

  // Première partie : Durée du mandat
  if (dureeMandat === 'INDETERMINEE') {
    texte = 'La Société est administrée par un ou plusieurs Gérants, personnes physiques, associés ou non, nommés par les associés pour une durée indéterminée.'
  } else { // DETERMINEE
    texte = `La Société est administrée par un ou plusieurs Gérants, personnes physiques, associés ou non, nommés par les associés pour une durée déterminée de ${anneesDuree} ans.`
    if (reeligible) {
      texte += '\n\nLes Gérants sont rééligibles.'
    }
  }

  texte += '\n\n'

  // Deuxième partie : Modalités de nomination
  if (majoriteNomination === 'LEGALE_AVEC_SECONDE') {
    texte += 'En cours de vie sociale, le ou les Gérants sont nommés par décision adoptée par un ou plusieurs associés représentant plus de la moitié des parts sociales. Si cette majorité n\'est pas obtenue, les associés sont, selon le cas, convoqués ou consultés une seconde fois, sur les mêmes questions figurant à l\'ordre du jour de la première convocation ou consultation, et les décisions sont prises à la majorité des votes émis, quel que soit le nombre de votants.'
  } else if (majoriteNomination === 'LEGALE_SANS_SECONDE') {
    texte += 'En cours de vie sociale, le ou les Gérants sont nommés par décision adoptée par un ou plusieurs associés représentant plus de la moitié des parts sociales. Si cette majorité n\'est pas obtenue, une seconde consultation ne pourra pas avoir lieu.'
  } else if (majoriteNomination === 'RENFORCEE_AVEC_SECONDE') {
    texte += `En cours de vie sociale, le ou les Gérants sont nommés par décision adoptée par un ou plusieurs associés représentant plus de ${niveauMajorite} des parts sociales. Si cette majorité n'est pas obtenue, les associés sont, selon le cas, convoqués ou consultés une seconde fois, sur les mêmes questions figurant à l'ordre du jour de la première convocation ou consultation, et les décisions sont prises à la majorité de ${niveauMajorite} des votes émis, quel que soit le nombre de votants.`
  } else if (majoriteNomination === 'RENFORCEE_SANS_SECONDE') {
    texte += `En cours de vie sociale, le ou les Gérants sont nommés par décision adoptée par un ou plusieurs associés représentant plus de ${niveauMajorite} des parts sociales. Si cette majorité n'est pas obtenue, une seconde consultation ne pourra pas avoir lieu.`
  }

  return texte
}

// Fonction helper pour générer le texte de l'article 20 (Gérance - Révocation)
function generateTexteRevocationGerant(
  statutsData: Partial<StatutsData>
): string {
  const majoriteRevocation = statutsData.majoriteRevocation || statutsData.majoriteNomination || 'LEGALE_AVEC_SECONDE'
  const niveauMajorite = statutsData.niveauMajoriteRevocation || statutsData.niveauMajoriteRenforcee || 'deux tiers'

  let texte = ''

  if (majoriteRevocation === 'LEGALE_AVEC_SECONDE') {
    texte = 'Tout Gérant, associé ou non, nommé ou non dans les statuts, est révocable par décision adoptée par un ou plusieurs associés représentant plus de la moitié des parts sociales. Si cette majorité n\'est pas obtenue, les associés sont, selon le cas, convoqués ou consultés une seconde fois, sur les mêmes questions figurant à l\'ordre du jour de la première convocation ou consultation, et les décisions sont prises à la majorité des votes émis, quel que soit le nombre de votants.'
  } else if (majoriteRevocation === 'LEGALE_SANS_SECONDE') {
    texte = 'Tout Gérant, associé ou non, nommé ou non dans les statuts, est révocable par décision adoptée par un ou plusieurs associés représentant plus de la moitié des parts sociales. Si cette majorité n\'est pas obtenue, une seconde consultation ne pourra pas avoir lieu.'
  } else if (majoriteRevocation === 'RENFORCEE_AVEC_SECONDE') {
    texte = `Tout Gérant, associé ou non, nommé ou non dans les statuts, est révocable par décision adoptée par un ou plusieurs associés représentant plus de ${niveauMajorite} des parts sociales. Si cette majorité n'est pas obtenue, les associés sont, selon le cas, convoqués ou consultés une seconde fois, sur les mêmes questions figurant à l'ordre du jour de la première convocation ou consultation, et les décisions sont prises à la majorité de ${niveauMajorite} des votes émis, quel que soit le nombre de votants.`
  } else if (majoriteRevocation === 'RENFORCEE_SANS_SECONDE') {
    texte = `Tout Gérant, associé ou non, nommé ou non dans les statuts, est révocable par décision adoptée par un ou plusieurs associés représentant plus de ${niveauMajorite} des parts sociales. Si cette majorité n'est pas obtenue, une seconde consultation ne pourra pas avoir lieu.`
  }

  return texte
}

// Fonction helper pour générer le texte de l'article 6.5 (apports mariés/PACS)
function generateTexteApportBiensCommunsOuPACS(
  statutsData: Partial<StatutsData>,
  variables: Record<string, any>
): string {
  let texte = ''

  // Vérifier si il y a un apport de bien commun ou PACS
  const apport = statutsData.apportDetaille
  const conjointApport = statutsData.conjointApport
  const partenairePACS = statutsData.partenairePACS

  // Cas 1 : Apport de biens communs par l'un des époux
  if (apport?.type === 'BIEN_COMMUN' && conjointApport) {
    const conjointPrenom = variables.conjointPrenom || '[Prénom]'
    const conjointNom = variables.conjointNom || '[Nom]'
    const associePrenom = variables.associePrenom || '[Prénom]'
    const associeNom = variables.associeNom || '[Nom]'
    const civiliteConjoint = variables.conjointCivilite || 'M'
    const civiliteAssocie = variables.civiliteAssocie || 'M'
    const dateAvertissement = conjointApport.dateAvertissement || '[Date]'
    const dateNotification = conjointApport.dateNotification || '[Date]'
    
    const averti = civiliteConjoint === 'M' ? 'averti' : 'avertie'
    const conjointDe = civiliteConjoint === 'M' ? 'conjoint' : 'conjointe'
    const sonSa1 = civiliteConjoint === 'M' ? 'son' : 'sa'
    const sonSa2 = civiliteAssocie === 'M' ? 'son' : 'sa'
    const ceDernierCetteDerniere = civiliteAssocie === 'M' ? 'ce dernier' : 'cette dernière'
    
    // Avertissement initial
    texte += `Conformément aux dispositions de l'article 1832-2 du code civil, ${conjointPrenom} ${conjointNom} a été ${averti}, par lettre recommandée avec demande d'avis de réception reçue le ${dateAvertissement}, de l'apport envisagé et de la faculté de revendiquer la qualité d'associé pour la moitié des parts souscrites par ${sonSa2} ${conjointDe}.\n\n`
    
    // Selon l'intervention du conjoint
    if (conjointApport.notification === 'STATUTS') {
      // Intervention aux statuts
      if (conjointApport.intervention === 'REVENDICATION') {
        texte += `En application des dispositions de l'article 1832-2 du code civil, ${conjointPrenom} ${conjointNom}, ${conjointDe} de ${associePrenom} ${associeNom}, intervenant aux présentes, reconnaissant avoir été régulièrement ${averti} de l'apport envisagé, déclare vouloir être personnellement associé de la Société pour la moitié des parts sociales souscrites par ${sonSa2} ${conjointDe}. En conséquence, chacun des époux sera associé pour la moitié des parts souscrites.`
      } else if (conjointApport.intervention === 'RENONCIATION_DEFINITIVE') {
        texte += `En application des dispositions de l'article 1832-2 du code civil, ${conjointPrenom} ${conjointNom}, ${conjointDe} de ${associePrenom} ${associeNom}, intervenant aux présentes, reconnaissant avoir été régulièrement ${averti} de l'apport envisagé, déclare renoncer définitivement à ${sonSa1} droit de revendiquer la qualité d'associé, reconnaissant exclusivement cette qualité à ${sonSa2} ${conjointDe} pour la totalité des parts sociales souscrites.`
      } else if (conjointApport.intervention === 'RENONCIATION_PROVISOIRE') {
        texte += `En application des dispositions de l'article 1832-2 du code civil, ${conjointPrenom} ${conjointNom}, ${conjointDe} de ${associePrenom} ${associeNom}, intervenant aux présentes, reconnaissant avoir été régulièrement ${averti} de l'apport envisagé, déclare ne pas vouloir revendiquer à ce jour la qualité d'associé mais se réserver le droit de notifier à la Société ${sonSa1} intention de se voir reconnaître la qualité d'associé pour la moitié des parts sociales souscrites par ${sonSa2} ${conjointDe} dans les conditions prévues par la loi et les présents statuts.`
      }
    } else if (conjointApport.notification === 'COURRIER') {
      // Notification par courrier
      if (conjointApport.intervention === 'REVENDICATION') {
        texte += `${conjointPrenom} ${conjointNom}, ${conjointDe} de ${associePrenom} ${associeNom}, régulièrement ${averti} de l'apport envisagé, a notifié, par lettre recommandée avec demande d'avis de réception reçue le ${dateNotification}, ${sonSa1} intention de devenir personnellement associé pour la moitié des parts sociales souscrites par ${sonSa2} ${conjointDe}. En conséquence, chacun des époux sera associé pour la moitié des parts souscrites.`
      } else if (conjointApport.intervention === 'RENONCIATION_DEFINITIVE') {
        texte += `${conjointPrenom} ${conjointNom}, ${conjointDe} de ${associePrenom} ${associeNom}, régulièrement ${averti} de l'apport envisagé, a notifié, par lettre recommandée avec demande d'avis de réception reçue le ${dateNotification}, sa décision de renoncer définitivement à ${sonSa1} droit de revendiquer la qualité d'associé, reconnaissant exclusivement cette qualité à ${sonSa2} ${conjointDe} pour la totalité des parts sociales souscrites.`
      } else if (conjointApport.intervention === 'RENONCIATION_PROVISOIRE') {
        texte += `${conjointPrenom} ${conjointNom}, ${conjointDe} de ${associePrenom} ${associeNom}, régulièrement ${averti} de l'apport envisagé, a notifié, par lettre recommandée avec demande d'avis de réception reçue le ${dateNotification}, sa décision de ne pas vouloir revendiquer à ce jour la qualité d'associé mais de se réserver le droit de notifier à la Société ${sonSa1} intention de se voir reconnaître la qualité d'associé pour la moitié des parts sociales souscrites par ${sonSa2} ${conjointDe} dans les conditions prévues par la loi et les présents statuts.`
      } else if (conjointApport.intervention === 'AUCUNE') {
        texte += `${conjointPrenom} ${conjointNom}, ${conjointDe} de ${associePrenom} ${associeNom}, régulièrement ${averti} de l'apport envisagé, n'a pas notifié ${sonSa1} intention de devenir personnellement associé pour la moitié des parts sociales souscrites par ${sonSa2} ${conjointDe}. En conséquence, les parts sociales souscrites sont attribuées en totalité à ${ceDernierCetteDerniere}.`
      }
    }
    
    // Consentement article 1424 si nécessaire
    if (conjointApport.consentementArticle1424) {
      // const dateConsentement = conjointApport.dateNotification || '[Date]' // Non utilisé pour le moment
      texte += `\n\nEn application des dispositions de l'article 1424 du code civil, ${conjointPrenom} ${conjointNom}, ${conjointDe} de ${associePrenom} ${associeNom}, régulièrement ${averti} de l'apport envisagé déclare consentir expressément à l'apport en nature effectué par ${sonSa2} conjoint.`
    }
  }
  
  // Cas 2 : Apport par une personne PACS
  if (apport?.type === 'PACS_INDIVISION' && partenairePACS) {
    const partenairePrenom = variables.partenairePrenom || '[Prénom]'
    const partenaireNom = variables.partenaireNom || '[Nom]'
    const associePrenom = variables.associePrenom || '[Prénom]'
    const associeNom = variables.associeNom || '[Nom]'
    const civiliteAssocie = variables.civiliteAssocie || 'M'
    const lequelLaquelle = civiliteAssocie === 'M' ? 'lequel' : 'laquelle'
    const ilElle = civiliteAssocie === 'M' ? 'il' : 'elle'
    
    if (partenairePACS === 'COASSOCIE') {
      texte += `${associePrenom} ${associeNom} déclare réaliser le présent apport en indivision par moitié avec ${partenairePrenom} ${partenaireNom}, avec ${lequelLaquelle} ${ilElle} a contracté un pacte civil de solidarité en date du [Date], et que l'indivision sera représentée auprès de la Société par un mandataire commun désigné d'un commun accord.`
    } else if (partenairePACS === 'SEPARATION_PATRIMOINES') {
      texte += `${associePrenom} ${associeNom} déclare se soumettre au régime patrimonial de la séparation des patrimoines et qu'en conséquence, les parts souscrites en rémunération de son apport resteront sa propriété exclusive.`
    }
  }

  return texte
}

// Fonction helper pour calculer automatiquement les informations des associés
function calculerInformationsAssocies(
  associes: AssocieAvecParts[],
  capitalSocial: number,
  nombreTotalParts: number
): AssocieAvecParts[] {
  // const valeurNominale = capitalSocial / nombreTotalParts // Non utilisé pour le moment

  return associes.map(item => {
    // Utiliser le pourcentageCapital de l'associé (nouvelle approche simplifiée)
    const pourcentage = item.associe.pourcentageCapital || item.pourcentageCapital || 0
    
    // Calculer automatiquement si non fourni
    const nombreParts = item.nombreParts ?? Math.round((pourcentage / 100) * nombreTotalParts)
    const montantApport = item.montantApport ?? Math.round((pourcentage / 100) * capitalSocial)
    
    return {
      ...item,
      nombreParts,
      montantApport,
      pourcentageCapital: pourcentage
    }
  })
}

// Fonction pour construire les variables depuis les données du dossier et du formulaire
export function buildVariables(dossier: Dossier, statutsData: Partial<StatutsData>): Record<string, any> {
  const variables: Record<string, any> = {
    // Identité de la société
    denomination: statutsData.denomination || dossier.societe.denomination,
    sigle: statutsData.sigle || '',
    objetSocial: statutsData.objetSocial || dossier.societe.objetSocial || '[À compléter]',
    siegeSocial: statutsData.siegeSocial || dossier.societe.siege,

    // Durée
    duree: statutsData.duree || 99,

    // Capital (avec version en lettres)
    capitalSocial: montantAvecLettres(statutsData.capitalSocial || dossier.societe.capitalSocial || 0),
    capitalSocialChiffres: formaterNombreFrancais(statutsData.capitalSocial || dossier.societe.capitalSocial || 0),
    // Pour EURL/SARL
    nombreParts: statutsData.nombreParts || 100,
    nombrePartsLettres: nombreEnLettres(statutsData.nombreParts || 100),
    // Pour SASU/SAS
    nombreActions: statutsData.nombreActions || statutsData.nombreParts || 100,
    nombreActionsLettres: nombreEnLettres(statutsData.nombreActions || statutsData.nombreParts || 100),
    // Valeur nominale (commun)
    valeurNominale: statutsData.valeurNominale || ((dossier.societe.capitalSocial || 1000) / 100).toFixed(2),
    valeurNominaleLettres: nombreEnLettres(Math.round((statutsData.valeurNominale || ((dossier.societe.capitalSocial || 1000) / 100)))),

    // Type d'associé (for condition evaluation)
    associeType: statutsData.associeUnique?.type || 'PERSONNE_PHYSIQUE',

    // Exercice social
    exerciceDebut: statutsData.exerciceSocial?.dateDebut || '1er janvier',
    exerciceFin: statutsData.exerciceSocial?.dateFin || '31 décembre',
    premierExerciceFin: statutsData.exerciceSocial?.premierExerciceFin || `31 décembre ${new Date().getFullYear()}`,

    // Dates de signature
    dateSignature: statutsData.dateSignature || new Date().toLocaleDateString('fr-FR'),
    lieuSignature: statutsData.lieuSignature || dossier.societe.siege.split(',')[0],
    nombreExemplaires: statutsData.nombreExemplaires || 3,

    // Dépôt de fonds
    dateDepotFonds: statutsData.depotFonds?.date ? formaterDateCourte(statutsData.depotFonds.date) : '[Date de dépôt]',
    etablissementDepot: statutsData.depotFonds?.etablissement || '[Établissement]',

    // Article 13: Cession et transmission des parts
    regimeCession: statutsData.admissionAssocies?.regimeCession || 'LIBRE_ASSOCIES_FAMILIAL',
    exploitType: statutsData.admissionAssocies?.exploitType === 'COMMISSAIRE' ? 'de commissaire' : 'd\'huissier',
    majoriteCessionTiers: statutsData.admissionAssocies?.majoriteCessionTiers || 'la moitié',
    majoriteMutation: statutsData.admissionAssocies?.majoriteMutation || 'la moitié',
    modalitesPrixRachat: statutsData.admissionAssocies?.modalitesPrixRachat || '[Modalités à définir]',
    cessionFamilialeLibre: statutsData.admissionAssocies?.regimeCession === 'LIBRE_FAMILIAL' || 
                           statutsData.admissionAssocies?.regimeCession === 'LIBRE_ASSOCIES_FAMILIAL',
    transmissionDeces: statutsData.admissionAssocies?.transmissionDeces || 'HERITIERS_AVEC_AGREMENT',
    personnesDesignees: statutsData.admissionAssocies?.personnesDesignees || '[Identité des personnes désignées]',
    locationParts: statutsData.admissionAssocies?.locationParts || 'INTERDITE',
  }

  // Générer le texte pour la liquidation de communauté (Article 13.3)
  const liquidationCommunaute = statutsData.admissionAssocies?.liquidationCommunaute || 'NON_APPLICABLE'
  if (liquidationCommunaute === 'AVEC_AGREMENT') {
    variables.texteLiquidationCommunaute = '\nEn cas de liquidation de communauté légale ou conventionnelle de biens ayant existé entre un associé et son conjoint, l\'attribution de parts communes au conjoint qui ne possédait pas la qualité d\'associé est soumise à l\'agrément dans les conditions prévues à l\'article 13.1.2 ci-dessus.'
  } else if (liquidationCommunaute === 'SANS_AGREMENT') {
    variables.texteLiquidationCommunaute = '\nEn cas de liquidation de communauté légale ou conventionnelle de biens ayant existé entre un associé et son conjoint, l\'attribution de parts communes au conjoint qui ne possédait pas la qualité d\'associé n\'est pas soumise à agrément.'
  } else {
    variables.texteLiquidationCommunaute = ''
  }

  // Générer le texte pour l'article 17 (Gérance - Nomination)
  variables.texteNominationGerant = generateTexteNominationGerant(statutsData)
  
  // Générer le texte pour l'article 20 (Gérance - Révocation)
  variables.texteRevocationGerant = generateTexteRevocationGerant(statutsData)

  Object.assign(variables, {
    // Variables Article 17
    dureeMandat: statutsData.dureeMandat || 'INDETERMINEE',
    majoriteNomination: statutsData.majoriteNomination || 'LEGALE_AVEC_SECONDE',
    
    // Variables Article 20
    majoriteRevocation: statutsData.majoriteRevocation || statutsData.majoriteNomination || 'LEGALE_AVEC_SECONDE',
    delaiPreavisGerant: statutsData.delaiPreavisGerant || 3,
    
    // Article 14-15: Gérance (majorités et délais) - Anciens champs (à conserver pour compatibilité)
    majoriteNominationGerant: statutsData.majoriteNominationGerant || 'la moitié',
    majoriteRevocationGerant: statutsData.majoriteRevocationGerant || 'la moitié',

    // Article 16: Limitations de pouvoirs
    limitationsPouvoirs: statutsData.limitationsPouvoirs || false,
    descriptionLimitationsPouvoirs: statutsData.descriptionLimitationsPouvoirs || '',

    // Article 21: Comptes courants
    seuilCompteCourant: statutsData.compteCourant?.seuilMinimum || 5,

    // Article 27 bis: Clause compromissoire
    delaiArbitrage: statutsData.delaiArbitrage || 6,
  })

  // Associé unique - Personne physique
  if (statutsData.associeUnique?.type === 'PERSONNE_PHYSIQUE') {
    const associe = statutsData.associeUnique
    variables.associePrenom = associe.prenom
    variables.associeNom = associe.nom
    variables.associeDesignation = `${associe.prenom} ${associe.nom}`
    variables.associeCivilite = associe.civilite
    variables.civiliteAssocie = associe.civilite // Pour l'accord de genre
    variables.associeDateNaissance = associe.dateNaissance ? formaterDateFrancais(associe.dateNaissance) : '[Date de naissance]'
    variables.associeLieuNaissance = associe.lieuNaissance || '[Lieu de naissance]'
    variables.associeNationalite = associe.nationalite || 'française'
    variables.associeAdresse = associe.adresse || '[Adresse]'
    variables.associeRegimeMatrimonial = associe.regimeMatrimonial || ''
    variables.associePacs = associe.pacs || false
    variables.nomAssocieSignature = `${associe.prenom} ${associe.nom}`

    // Informations conjoint si bien commun
    if (associe.conjointNom && associe.conjointPrenom) {
      variables.conjointCivilite = associe.civilite === 'M' ? 'Mme' : 'M'
      variables.conjointPrenom = associe.conjointPrenom
      variables.conjointNom = associe.conjointNom
    }
  }
  // Associé unique - Personne morale
  else if (statutsData.associeUnique?.type === 'PERSONNE_MORALE') {
    const associe = statutsData.associeUnique
    variables.associeSocieteNom = associe.societeNom || '[Dénomination sociale]'
    variables.associeDesignation = associe.societeNom || '[Dénomination sociale]'
    variables.associeSocieteFormeJuridique = associe.societeFormeJuridique || '[Forme juridique]'
    variables.associeSocieteCapital = associe.societeCapital?.toLocaleString('fr-FR') || '0'
    variables.associeSocieteRCS = associe.societeRCS || '[RCS]'
    variables.associeSocieteNumeroRCS = associe.societeNumeroRCS || '[Numéro]'
    variables.associeSocieteSiege = associe.societeSiege || '[Siège social]'
    variables.associeRepresentantPrenom = associe.representantPrenom || '[Prénom]'
    variables.associeRepresentantNom = associe.representantNom || '[Nom]'
    variables.associeRepresentantQualite = associe.representantQualite || '[Qualité]'
    variables.nomAssocieSignature = variables.associeSocieteNom
    variables.civiliteAssocie = 'M' // Par défaut pour personne morale (neutre)
  }
  // Fallback: use dossier client data
  else if (!statutsData.associes) {
    variables.associePrenom = dossier.client.prenom
    variables.associeNom = dossier.client.nom
    variables.associeDesignation = `${dossier.client.prenom} ${dossier.client.nom}`
    variables.associeCivilite = dossier.client.civilite
    variables.civiliteAssocie = dossier.client.civilite
    variables.associeNationalite = 'française'
    variables.associeAdresse = '[Adresse]'
    variables.nomAssocieSignature = `${dossier.client.prenom} ${dossier.client.nom}`
  }

  // Plusieurs associés (SARL/SAS)
  if (statutsData.associes && statutsData.associes.liste && statutsData.associes.liste.length > 0) {
    // Calculer automatiquement les informations des associés
    const capitalSocial = statutsData.capitalSocial || 0
    const nombreTotalParts = statutsData.nombreParts || statutsData.nombreActions || 0
    const associesAvecCalculs = calculerInformationsAssocies(
      statutsData.associes.liste,
      capitalSocial,
      nombreTotalParts
    )

    // Générer la liste des associés pour le préambule
    const listeAssociesTexte = associesAvecCalculs.map((item, index) => {
      const associe = item.associe
      if (associe.type === 'PERSONNE_PHYSIQUE') {
        return `${index + 1}. ${associe.civilite} ${associe.prenom} ${associe.nom}, né(e) le ${associe.dateNaissance || '[Date]'} à ${associe.lieuNaissance || '[Lieu]'}, de nationalité ${associe.nationalite || 'française'}, demeurant ${associe.adresse || '[Adresse]'}`
      } else {
        return `${index + 1}. ${associe.societeNom}, ${associe.societeFormeJuridique} au capital de ${associe.societeCapital?.toLocaleString('fr-FR') || '0'} €, immatriculée au RCS de ${associe.societeRCS || '[RCS]'}, sous le numéro ${associe.societeNumeroRCS || '[Numéro]'}, dont le siège social est situé ${associe.societeSiege || '[Siège]'}, représentée par ${associe.representantPrenom || '[Prénom]'} ${associe.representantNom || '[Nom]'}, en sa qualité de ${associe.representantQualite || '[Qualité]'}`
      }
    }).join(',\n\n')
    variables.listeAssocies = listeAssociesTexte

    // Générer la répartition des parts avec calculs automatiques
    const repartitionTexte = associesAvecCalculs.map((item) => {
      const associe = item.associe
      const nom = associe.type === 'PERSONNE_PHYSIQUE'
        ? `${associe.civilite} ${associe.prenom} ${associe.nom}`
        : (associe as any).societeNom
      return `${nom} : ${item.nombreParts} parts sociales (${item.pourcentageCapital?.toFixed(2)} %)`
    }).join('\n')
    variables.repartitionParts = repartitionTexte

    // Par défaut, utiliser le premier associé pour la civilité
    const premierAssocie = associesAvecCalculs[0].associe
    if (premierAssocie.type === 'PERSONNE_PHYSIQUE') {
      variables.civiliteAssocie = premierAssocie.civilite
    } else {
      variables.civiliteAssocie = 'M' // Neutre pour personne morale
    }
  }

  // Apports détaillés (for condition evaluation and variables)
  if (statutsData.apportDetaille) {
    const apport = statutsData.apportDetaille
    variables.typeApport = apport.type

    // Build variant-specific variables based on apport type
    switch (apport.type) {
      case 'NUMERAIRE_TOTAL':
        variables.montantApportNumeraire = montantAvecLettres(apport.montant)
        variables.nombrePartsNumeraire = apport.nombreParts
        variables.nombrePartsNumeraireLettres = nombreEnLettres(apport.nombreParts)
        // Pour SASU/SAS - utiliser nombreActions de statutsData, pas de apport
        variables.nombreActionsNumeraire = variables.nombreActions // Déjà défini ligne 194
        variables.nombreActionsNumeraireLettres = variables.nombreActionsLettres // Déjà défini ligne 195
        variables.liberationPartielle = false
        break

      case 'NUMERAIRE_PARTIEL':
        variables.montantApportNumeraire = montantAvecLettres(apport.montant)
        variables.montantLibere = montantAvecLettres(apport.montantLibere)
        variables.pourcentageLibere = apport.pourcentageLibere
        variables.montantRestant = montantAvecLettres(apport.montantRestant)
        variables.montantNonLibere = montantAvecLettres(apport.montantRestant) // Alias pour SARL
        variables.nombrePartsNumeraire = apport.nombreParts
        variables.nombrePartsNumeraireLettres = nombreEnLettres(apport.nombreParts)
        // Pour SASU/SAS - utiliser nombreActions de statutsData, pas de apport
        variables.nombreActionsNumeraire = variables.nombreActions // Déjà défini ligne 194
        variables.nombreActionsNumeraireLettres = variables.nombreActionsLettres // Déjà défini ligne 195
        variables.liberationPartielle = true
        // Fraction de libération (cinquième, quart, moitié)
        const pct = apport.pourcentageLibere
        if (pct === 20) variables.fractionLiberation = 'cinquième'
        else if (pct === 25) variables.fractionLiberation = 'quart'
        else if (pct === 50) variables.fractionLiberation = 'moitié'
        else variables.fractionLiberation = `${pct}%`
        break

      case 'NATURE_SEUL':
        variables.descriptionBiensNature = apport.description || '[Description des biens]'
        variables.valeurApportNature = montantAvecLettres(apport.valeur)
        variables.nombrePartsNature = apport.nombreParts
        variables.nombrePartsNatureLettres = nombreEnLettres(apport.nombreParts)
        variables.dateContratApport = '[Date du contrat]'
        variables.commissaireAuxApports = apport.commissaireAuxApports.requis
        if (apport.commissaireAuxApports.requis) {
          variables.commissaireAuxApportsNom = `${apport.commissaireAuxApports.prenom || ''} ${apport.commissaireAuxApports.nom || ''}`.trim() || '[Nom du commissaire]'
        }
        break

      case 'MIXTE_NUMERAIRE_NATURE':
        variables.montantApportNumeraire = montantAvecLettres(apport.numeraire.montant)
        variables.descriptionBiensNature = apport.nature.description || '[Description]'
        variables.valeurApportNature = montantAvecLettres(apport.nature.valeur)
        variables.nombreParts = apport.nombreParts
        variables.apportMixte = true
        variables.nombrePartsNumeraire = Math.round(apport.nombreParts * (apport.numeraire.montant / (apport.numeraire.montant + apport.nature.valeur)))
        variables.nombrePartsNature = apport.nombreParts - variables.nombrePartsNumeraire
        variables.nombrePartsNumeraireLettres = nombreEnLettres(variables.nombrePartsNumeraire)
        variables.nombrePartsNatureLettres = nombreEnLettres(variables.nombrePartsNature)
        variables.montantTotalApports = montantAvecLettres(apport.numeraire.montant + apport.nature.valeur)
        variables.dateContratApport = '[Date du contrat]'
        variables.commissaireAuxApports = apport.commissaireAuxApports.requis
        if (apport.commissaireAuxApports.requis) {
          variables.commissaireAuxApportsNom = `${apport.commissaireAuxApports.prenom || ''} ${apport.commissaireAuxApports.nom || ''}`.trim() || '[Nom du commissaire]'
        }
        break

      case 'FONDS_COMMERCE':
        variables.natureFondsCommerce = apport.nature || '[Nature du fonds]'
        variables.adresseFondsCommerce = apport.adresse || '[Adresse]'
        variables.numeroIdentificationFonds = '[Numéro SIREN]'
        variables.valeurElementsIncorporels = montantAvecLettres(apport.elementsIncorporels)
        variables.valeurMateriel = montantAvecLettres(apport.materiel)
        variables.valeurMarchandises = montantAvecLettres(apport.marchandises || 0)
        variables.valeurFondsCommerce = montantAvecLettres(apport.valeurTotale)
        variables.nombrePartsFonds = apport.nombreParts
        variables.nombrePartsFondsLettres = nombreEnLettres(apport.nombreParts)
        variables.commissaireAuxApports = apport.commissaireAuxApports.requis
        if (apport.commissaireAuxApports.requis) {
          variables.commissaireAuxApportsNom = `${apport.commissaireAuxApports.prenom || ''} ${apport.commissaireAuxApports.nom || ''}`.trim() || '[Nom du commissaire]'
        }
        break

      case 'BIEN_COMMUN':
        variables.descriptionBienCommun = apport.description || '[Description]'
        variables.valeurBienCommun = montantAvecLettres(apport.valeur)
        variables.regimeMatrimonial = apport.regimeMatrimonial
        variables.conjointPrenom = apport.conjointPrenom || '[Prénom]'
        variables.conjointNom = apport.conjointNom || '[Nom]'
        variables.dateAvertissementConjoint = '[Date]'
        variables.conjointInterventionStatuts = false
        variables.consentementArticle1424 = false
        variables.conjointRenonciationCourrier = true
        variables.dateRenonciationConjoint = '[Date]'
        variables.nombrePartsBienCommun = apport.nombreParts
        variables.nombrePartsBienCommunLettres = nombreEnLettres(apport.nombreParts)
        // Générer le texte de l'apport principal selon le type
        variables.apportPrincipal = '[Description de l\'apport principal]'
        break

      case 'PACS_INDIVISION':
        variables.descriptionBienIndivis = apport.description || '[Description]'
        variables.valeurBienIndivis = montantAvecLettres(apport.valeur)
        variables.partenaireNom = `${apport.partenairePrenom || ''} ${apport.partenaireNom || ''}`.trim() || '[Partenaire]'
        variables.nombrePartsBienIndivis = apport.nombreParts
        variables.nombrePartsBienIndivisLettres = nombreEnLettres(apport.nombreParts)
        // Générer le texte de l'apport principal
        variables.apportPrincipal = '[Description de l\'apport principal]'
        break
    }
  }

  // Gérant (pour article 30 - Nomination du premier gérant)
  if (statutsData.nominationGerant) {
    const nomination = statutsData.nominationGerant
    variables.gerantDansStatuts = nomination.gerantDansStatuts
    variables.gerantEstAssocie = nomination.gerantEstAssocie
    variables.dureeNominationGerant = nomination.dureeNomination || 'indéterminée'
    variables.remunerationGerant = nomination.remunerationFixee || false
    variables.descriptionRemunerationGerant = nomination.descriptionRemuneration || '[À définir]'
    
    if (nomination.gerantEstAssocie) {
      // Le gérant est l'associé unique
      variables.gerantPrenom = variables.associePrenom
      variables.gerantNom = variables.associeNom
      variables.gerantAdresse = variables.associeAdresse
    } else if (statutsData.gerant) {
      // Gérant tiers
      const gerant = statutsData.gerant
      variables.gerantPrenom = gerant.prenom || '[Prénom]'
      variables.gerantNom = gerant.nom || '[Nom]'
      variables.gerantAdresse = gerant.adresse || '[Adresse]'
      variables.gerantCivilite = gerant.civilite || 'M'
      variables.gerantDateNaissance = gerant.dateNaissance || '[Date]'
      variables.gerantLieuNaissance = gerant.lieuNaissance || '[Lieu]'
      variables.gerantNationalite = gerant.nationalite || 'française'
    }
  } else if (statutsData.gerant) {
    // Fallback pour compatibilité
    const gerant = statutsData.gerant
    variables.gerantDansStatuts = true
    variables.gerantEstAssocie = gerant.isAssocieUnique
    variables.dureeNominationGerant = gerant.dureeMandat || 'la durée de la société'
    
    if (gerant.nom) {
      variables.gerantPrenom = gerant.prenom || '[Prénom]'
      variables.gerantNom = gerant.nom
      variables.gerantAdresse = gerant.adresse || '[Adresse]'
      variables.gerantCivilite = gerant.civilite || 'M'
      variables.gerantDateNaissance = gerant.dateNaissance || '[Date]'
      variables.gerantLieuNaissance = gerant.lieuNaissance || '[Lieu]'
      variables.gerantNationalite = gerant.nationalite || 'française'
    }
  }

  // Président (pour SASU/SAS - Article 13)
  if (statutsData.nominationPresident) {
    const nomination = statutsData.nominationPresident
    variables.presidentDansStatuts = nomination.presidentDansStatuts
    variables.presidentEstAssocie = nomination.presidentEstAssocie
    variables.dureeNominationPresident = nomination.dureeNomination || 'sans limitation de durée'
    variables.remunerationPresident = nomination.remunerationFixee || false
    variables.descriptionRemunerationPresident = nomination.descriptionRemuneration || '[À définir]'

    if (nomination.presidentEstAssocie) {
      // Le président est l'associé unique
      variables.presidentPrenom = variables.associePrenom
      variables.presidentNom = variables.associeNom
      variables.presidentAdresse = variables.associeAdresse
      variables.presidentDateNaissance = variables.associeDateNaissance
      variables.presidentLieuNaissance = variables.associeLieuNaissance
      variables.presidentNationalite = variables.associeNationalite
    } else if (statutsData.president) {
      // Président tiers
      const president = statutsData.president
      variables.presidentPrenom = president.prenom || '[Prénom]'
      variables.presidentNom = president.nom || '[Nom]'
      variables.presidentAdresse = president.adresse || '[Adresse]'
      variables.presidentCivilite = president.civilite || 'M'
      variables.presidentDateNaissance = president.dateNaissance || '[Date]'
      variables.presidentLieuNaissance = president.lieuNaissance || '[Lieu]'
      variables.presidentNationalite = president.nationalite || 'française'
    }
  } else if (statutsData.president) {
    // Fallback pour compatibilité - utilisé par défaut
    const president = statutsData.president
    // Si le président a des informations, on considère qu'il doit être dans les statuts
    variables.presidentDansStatuts = !!(president.nom || president.prenom)
    variables.presidentEstAssocie = president.isAssocieUnique !== false // true par défaut

    // Si le président est l'associé unique, copier les données de l'associé
    if (variables.presidentEstAssocie) {
      variables.presidentPrenom = variables.associePrenom
      variables.presidentNom = variables.associeNom
      variables.presidentAdresse = variables.associeAdresse
      variables.presidentDateNaissance = variables.associeDateNaissance
      variables.presidentLieuNaissance = variables.associeLieuNaissance
      variables.presidentNationalite = variables.associeNationalite
      variables.presidentCivilite = variables.civiliteAssocie
    } else if (president.nom) {
      // Président tiers
      variables.presidentPrenom = president.prenom || '[Prénom]'
      variables.presidentNom = president.nom
      variables.presidentAdresse = president.adresse || '[Adresse]'
      variables.presidentCivilite = president.civilite || 'M'
      variables.presidentDateNaissance = president.dateNaissance || '[Date]'
      variables.presidentLieuNaissance = president.lieuNaissance || '[Lieu]'
      variables.presidentNationalite = president.nationalite || 'française'
    }

    variables.dureeNominationPresident = president.dureeMandat || 'sans limitation de durée'
  }

  // Délai de préavis et mode de révocation du président (toujours définis pour SASU)
  if (statutsData.president) {
    variables.delaiPreavisPresident = statutsData.president.delaiPreavis || 3
    variables.modeRevocationPresident = statutsData.president.modeRevocation || 'à tout moment'
  }

  // Article 6.5 : Apports mariés/PACS - Générer le texte dynamiquement
  const hasApportBiensCommunsOuPACS = (
    (statutsData.apportDetaille?.type === 'BIEN_COMMUN' && statutsData.conjointApport) ||
    (statutsData.apportDetaille?.type === 'PACS_INDIVISION' && statutsData.partenairePACS)
  )
  variables.apportBiensCommunsOuPACS = hasApportBiensCommunsOuPACS
  if (hasApportBiensCommunsOuPACS) {
    variables.texteApportBiensCommunsOuPACS = generateTexteApportBiensCommunsOuPACS(statutsData, variables)
  }

  // Transmission des actions (SASU/SAS - Article 11)
  if (statutsData.transmissionActions) {
    variables.regimeCessionActions = statutsData.transmissionActions.regimeCession
    variables.majoriteAgrement = statutsData.transmissionActions.majoriteAgrement || 'l\'unanimité'
    variables.modalitesPrixRachat = statutsData.transmissionActions.modalitesPrixRachat || '[Modalités à définir]'
  }

  // Décisions collectives (SASU/SAS - Articles 17-18)
  variables.quorumDecisions = statutsData.quorumDecisions || '50%'
  variables.delaiConvocationAssemblee = statutsData.delaiConvocationAssemblee || 15
  variables.delaiConsultationEcrite = statutsData.delaiConsultationEcrite || 15
  variables.signatairePV = statutsData.signatairePV || 'le Président'
  variables.delaiInformationResultat = statutsData.delaiInformationResultat || 15

  // Note: Nantissement supprimé - tous les templates actuels (EURL v3, SARL v1, SASU v1) ont un contenu fixe sans variables

  // Article 8: Droit préférentiel de souscription (SARL uniquement)
  variables.droitPreferentielSouscription = statutsData.droitPreferentielSouscription || false

  // Article 12: Répartition des votes en cas d'usufruit (SARL uniquement)
  variables.repartitionVotesUsufruit = statutsData.repartitionVotesUsufruit || 'NU_PROPRIETAIRE'

  // Forme actuelle (pour article 19 - quorum et majorité)
  variables.formeActuelle = 'EURL' // TODO: calculer si SARL pluripersonnelle

  // Commissaires aux comptes
  variables.commissaireAuxComptesObligatoire = statutsData.commissairesAuxComptes?.obligatoire || false

  // Clause compromissoire
  variables.clauseCompromissoire = statutsData.clauseCompromissoire?.presente || false
  if (statutsData.clauseCompromissoire?.presente) {
    variables.institutionArbitrage = statutsData.clauseCompromissoire.institutionArbitrage || '[Institution]'
    variables.lieuArbitrage = statutsData.clauseCompromissoire.lieuArbitrage || '[Lieu]'
  }

  // Actes en formation
  variables.actesFormation = statutsData.actesFormation?.presents || false
  if (statutsData.actesFormation?.presents) {
    variables.listeActesFormation = statutsData.actesFormation.liste || '[Liste des actes]'
  } else {
    variables.listeActesFormation = ''
  }

  // Option fiscale (Article 30)
  variables.optionImpotSocietes = statutsData.optionFiscale === 'IMPOT_SOCIETES'
  variables.maintienImpotRevenu = statutsData.optionFiscale === 'IMPOT_REVENU'

  // Clause compromissoire
  variables.clauseCompromissoire = statutsData.clauseCompromissoire?.presente || false

  // ===== NOUVELLES VARIABLES POUR ARTICLES 21-39 (SARL) =====

  // Article 23: Commissaires aux comptes
  variables.designationCAC_Obligatoire = statutsData.designationCAC_Obligatoire || false

  // Article 24: Décisions collectives
  variables.formesDecisionsCollectives = statutsData.formesDecisionsCollectives || 'DIVERSES'
  variables.decisionsOrdinaires = statutsData.decisionsOrdinaires || 'LEGALE_AVEC_SECONDE'
  variables.majoriteOrdinairesRenforcee = statutsData.majoriteOrdinairesRenforcee || 'deux tiers'
  variables.quorumExtraordinaire1 = statutsData.quorumExtraordinaire1 || 'le quart'
  variables.quorumExtraordinaire2 = statutsData.quorumExtraordinaire2 || 'le cinquième'
  variables.majoriteExtraordinaire = statutsData.majoriteExtraordinaire || 'des deux tiers'

  // Article 26: Exercice social (compléments pour SARL)
  // Pour SARL, synchroniser avec les données de exerciceSocial si pas définies directement
  const dateDebut = statutsData.dateDebutExercice || statutsData.exerciceSocial?.dateDebut || '1er janvier'
  const dateFin = statutsData.dateFinExercice || statutsData.exerciceSocial?.dateFin || '31 décembre'
  
  // Déterminer automatiquement si l'exercice social est "civil" (1er janvier - 31 décembre)
  const estExerciceCivil = (dateDebut.toLowerCase().includes('1er janvier') || dateDebut.toLowerCase().includes('1 janvier')) &&
                           (dateFin.toLowerCase().includes('31 décembre') || dateFin.toLowerCase().includes('31 decembre'))
  
  variables.exerciceSocialCivil = statutsData.exerciceSocialCivil !== undefined 
    ? statutsData.exerciceSocialCivil 
    : estExerciceCivil
  
  variables.dateCloturePremiereExercice = statutsData.dateCloturePremiereExercice ||
    statutsData.exerciceSocial?.premierExerciceFin ||
    `31 décembre ${new Date().getFullYear()}`
  variables.dateDebutExercice = dateDebut
  variables.dateFinExercice = dateFin

  // Article 27: Rapport de gestion
  variables.rapportGestion = statutsData.rapportGestion || 'LEGAL'
  variables.contenuRapportActivite = statutsData.contenuRapportActivite ||
    'situation de la société pendant l\'exercice écoulé, événements importants, activités en matière de recherche et développement'

  // Article 35: Nomination du premier Gérant
  variables.dureeGerantPremier = statutsData.dureeGerantPremier ||
    statutsData.nominationGerant?.dureeNomination ||
    'indéterminée'
  
  // Pour SARL: générer depuis les gérants sélectionnés parmi les associés
  if (dossier.societe.formeJuridique === 'SARL' && 
      statutsData.gerantsSARLIds && 
      statutsData.gerantsSARLIds.length > 0 &&
      statutsData.associes?.liste) {
    
    // Récupérer les informations des gérants sélectionnés
    const gerants = statutsData.gerantsSARLIds.map(gerantId => {
      const index = parseInt(gerantId.replace('associe-', ''))
      const item = statutsData.associes!.liste[index]
      if (!item) return null
      
      const associe = item.associe
      
      if (associe.type === 'PERSONNE_PHYSIQUE') {
        return {
          nom: `${associe.prenom} ${associe.nom}`,
          adresse: associe.adresse || '[Adresse]',
          civilite: associe.civilite || 'M'
        }
      } else {
        return {
          nom: associe.societeNom || '[Société]',
          adresse: associe.societeSiege || '[Adresse]',
          civilite: 'M'
        }
      }
    }).filter(Boolean)
    
    // Indicateur pour plusieurs gérants (pour le variant de l'article 35)
    variables.multipleGerants = gerants.length > 1
    
    // Générer le texte pour un ou plusieurs gérants
    if (gerants.length === 1) {
      variables.nomPrenomGerantPremier = gerants[0]?.nom || '[Nom Prénom]'
      variables.adresseGerantPremier = gerants[0]?.adresse || '[Adresse]'
    } else if (gerants.length > 1) {
      // Pour plusieurs gérants, utiliser une liste
      variables.nomPrenomGerantPremier = gerants.map((g, i) => 
        `${i + 1}° ${g?.nom || '[Nom]'}, demeurant ${g?.adresse || '[Adresse]'}`
      ).join('\n\n')
      variables.adresseGerantPremier = '' // Déjà inclus dans nomPrenomGerantPremier
    } else {
      variables.nomPrenomGerantPremier = '[Prénom Nom]'
      variables.adresseGerantPremier = '[Adresse]'
    }
  } else {
    // Pour EURL ou SARL sans gérants sélectionnés: utiliser les infos du gérant ou de l'associé unique
    variables.multipleGerants = false
    variables.nomPrenomGerantPremier = statutsData.nomPrenomGerantPremier ||
      (variables.gerantPrenom && variables.gerantNom
        ? `${variables.gerantPrenom} ${variables.gerantNom}`
        : '[Prénom Nom]')
    variables.adresseGerantPremier = statutsData.adresseGerantPremier ||
      variables.gerantAdresse ||
      '[Adresse]'
  }

  // Article 35bis: Nomination des premiers commissaires aux comptes
  // Synchroniser avec les données du formulaire commissairesAuxComptes
  variables.nominationPremiersCAC = statutsData.nominationPremiersCAC || 
    statutsData.commissairesAuxComptes?.designes || 
    false
  
  // Durée du mandat : extraire le nombre si c'est un texte "6 exercices"
  const dureeCAC = statutsData.dureeCAC || statutsData.commissairesAuxComptes?.duree || '6'
  variables.dureeCAC = typeof dureeCAC === 'string' 
    ? dureeCAC.replace(/[^0-9]/g, '') || '6'  // Extraire le nombre
    : dureeCAC.toString()
  
  // Date de fin du mandat
  variables.dateFinMandatCAC = statutsData.dateFinMandatCAC ||
    statutsData.commissairesAuxComptes?.dateFinMandat ||
    `31 décembre ${new Date().getFullYear() + 6}`
  
  // Nom complet du CAC titulaire
  if (statutsData.commissairesAuxComptes?.titulaire) {
    const titulaire = statutsData.commissairesAuxComptes.titulaire
    variables.nomCACTitulaire = statutsData.nomCACTitulaire ||
      `${titulaire.prenom || ''} ${titulaire.nom || ''}`.trim() ||
      '[Nom du commissaire aux comptes titulaire]'
  } else {
    variables.nomCACTitulaire = statutsData.nomCACTitulaire || '[Nom du commissaire aux comptes titulaire]'
  }
  
  // Nom complet du CAC suppléant (optionnel)
  if (statutsData.commissairesAuxComptes?.suppleant) {
    const suppleant = statutsData.commissairesAuxComptes.suppleant
    variables.nomCACSuppléant = statutsData.nomCACSuppléant ||
      `${suppleant.prenom || ''} ${suppleant.nom || ''}`.trim() ||
      ''
  } else {
    variables.nomCACSuppléant = statutsData.nomCACSuppléant || ''
  }

  // Article 37: Mandat post-signature
  variables.mandatairePostSignature = statutsData.mandatairePostSignature ||
    variables.gerantPrenom && variables.gerantNom
      ? `${variables.gerantPrenom} ${variables.gerantNom}`
      : '[Identité du mandataire]'

  // ===== VARIABLES POUR ARTICLE 6 (APPORTS) - SARL =====

  // Déterminer les types d'apports présents
  if (statutsData.apportDetaille) {
    const apport = statutsData.apportDetaille

    // Variables booléennes pour les conditions
    variables.apportsNumeraire = apport.type === 'NUMERAIRE_TOTAL' || apport.type === 'NUMERAIRE_PARTIEL' || apport.type === 'MIXTE_NUMERAIRE_NATURE'
    variables.liberationTotale = apport.type === 'NUMERAIRE_TOTAL'
    variables.apportsNature = apport.type === 'NATURE_SEUL' || apport.type === 'MIXTE_NUMERAIRE_NATURE' || apport.type === 'FONDS_COMMERCE' || apport.type === 'BIEN_COMMUN' || apport.type === 'PACS_INDIVISION'
    variables.apportsIndustrie = false // À implémenter si nécessaire

    // Variables pour commissaire aux apports
    if (apport.type !== 'NUMERAIRE_TOTAL' && apport.type !== 'NUMERAIRE_PARTIEL' && 'commissaireAuxApports' in apport && apport.commissaireAuxApports?.requis) {
      variables.commissaireAuxApportsUnanime = apport.commissaireAuxApports.designation === 'UNANIME'
      variables.commissaireAuxApportsOrdonnance = apport.commissaireAuxApports.designation === 'ORDONNANCE'
    } else {
      variables.commissaireAuxApportsUnanime = false
      variables.commissaireAuxApportsOrdonnance = false
    }

    // Lieu de dépôt des fonds
    if (statutsData.depotFonds) {
      const typeDepot = statutsData.depotFonds.typeDepositaire
      
      // Si on a un type spécifique de dépositaire, utiliser le format détaillé
      if (typeDepot === 'NOTAIRE') {
        variables.lieuDepotFonds = `dans la comptabilité de ${statutsData.depotFonds.nomDepositaire || 'Me [Nom du notaire]'}, notaire, ${statutsData.depotFonds.adresseDepositaire || '[Adresse]'}, sous le numéro de compte n° ${statutsData.depotFonds.numeroCompte || '[Numéro]'}`
      } else if (typeDepot === 'BANQUE') {
        variables.lieuDepotFonds = `à la banque ${statutsData.depotFonds.nomDepositaire || '[Nom de la banque]'}, ${statutsData.depotFonds.adresseDepositaire || '[Adresse]'}, sous le numéro de compte n° ${statutsData.depotFonds.numeroCompte || '[Numéro]'}`
      } else if (typeDepot === 'CDC') {
        variables.lieuDepotFonds = `à la Caisse des dépôts et consignations sous le numéro de compte n° ${statutsData.depotFonds.numeroCompte || '[Numéro]'}`
      } else if (statutsData.depotFonds.etablissement) {
        // Sinon, utiliser le champ simple "etablissement" du formulaire
        variables.lieuDepotFonds = `auprès de ${statutsData.depotFonds.etablissement}`
      } else {
        variables.lieuDepotFonds = `[Lieu de dépôt], sous le numéro de compte n° [Numéro]`
      }
    } else {
      variables.lieuDepotFonds = `[Lieu de dépôt]`
    }

    // Listes des apporteurs (pour SARL multi-associés)
    if (statutsData.associes && statutsData.associes.liste && statutsData.associes.liste.length > 0) {
      // Réutiliser les calculs déjà effectués ou les recalculer si nécessaire
      const capitalSocial = statutsData.capitalSocial || 0
      const nombreTotalParts = statutsData.nombreParts || statutsData.nombreActions || 0
      const associesAvecCalculsApports = calculerInformationsAssocies(
        statutsData.associes.liste,
        capitalSocial,
        nombreTotalParts
      )

      // Liste des apporteurs en numéraire
      variables.listeApporteursNumeraire = associesAvecCalculsApports.map((item, index) => {
        const associe = item.associe
        const nom = associe.type === 'PERSONNE_PHYSIQUE'
          ? `${associe.civilite} ${associe.prenom} ${associe.nom}`
          : (associe as any).societeNom
        return `${index + 1}° ${nom} apporte à la Société une somme totale de ${item.montantApport?.toLocaleString('fr-FR') || '0'} euros correspondant à ${item.nombreParts} parts sociales de ${variables.valeurNominale} euro(s) de valeur nominale chacune, entièrement souscrites et intégralement libérées.`
      }).join('\n\n')

      // Liste des apporteurs en nature (à adapter selon les besoins)
      variables.listeApporteursNature = '[Liste des apporteurs en nature]'
      const premierAssocie = associesAvecCalculsApports[0]
      if (premierAssocie) {
        if (premierAssocie.associe.type === 'PERSONNE_PHYSIQUE') {
          variables.identiteApporteurNature = `${premierAssocie.associe.civilite} ${premierAssocie.associe.prenom} ${premierAssocie.associe.nom}`
        } else {
          variables.identiteApporteurNature = premierAssocie.associe.societeNom || '[Identité]'
        }
      } else {
        variables.identiteApporteurNature = '[Identité]'
      }

      // Montants totaux
      variables.montantTotalNumeraire = associesAvecCalculsApports.reduce((sum, item) => sum + (item.montantApport || 0), 0).toLocaleString('fr-FR')
      variables.montantTotalNature = '0'
    } else {
      // Associé unique
      const montantApport = (apport.type === 'NUMERAIRE_TOTAL' || apport.type === 'NUMERAIRE_PARTIEL') 
        ? apport.montant 
        : (apport.type === 'MIXTE_NUMERAIRE_NATURE' ? apport.numeraire?.montant : 0)
      variables.listeApporteursNumeraire = `1° ${variables.associeDesignation} apporte à la Société une somme totale de ${montantApport?.toLocaleString('fr-FR') || '0'} euros correspondant à ${variables.nombreParts} parts sociales de ${variables.valeurNominale} euro(s) de valeur nominale chacune, entièrement souscrites et intégralement libérées.`
      variables.listeApporteursNature = `1° ${variables.associeDesignation}`
      variables.identiteApporteurNature = variables.associeDesignation
      variables.montantTotalNumeraire = montantApport?.toLocaleString('fr-FR') || '0'
      variables.montantTotalNature = apport.type === 'NATURE_SEUL' ? apport.valeur?.toLocaleString('fr-FR') || '0' : '0'
    }

    // Variables pour apports en industrie (à implémenter si nécessaire)
    variables.identiteApporteurIndustrie = '[Identité]'
    variables.descriptionApportIndustrie = '[Description]'
    variables.nombrePartsIndustrie = 0
    variables.pourcentageBenefices = 0
    variables.pourcentagePertes = 0

    // Variables pour commissaire aux apports supplémentaires
    variables.lieuTribunal = '[Lieu du tribunal]'
    variables.dateOrdonnance = '[Date]'
    variables.identiteRequerant = variables.associeDesignation || '[Identité]'
    variables.dateRapportCAA = '[Date]'
    variables.dateDesignationCAA = '[Date]'

    // Statut de libération des parts (pour Article 7 - Capital social)
    if (apport.type === 'NUMERAIRE_TOTAL' || apport.type === 'NATURE_SEUL') {
      variables.statutLiberationParts = 'entièrement libérées'
    } else if (apport.type === 'NUMERAIRE_PARTIEL') {
      const pct = apport.pourcentageLibere
      if (pct === 20) variables.statutLiberationParts = 'libérées d\'un cinquième'
      else if (pct === 25) variables.statutLiberationParts = 'libérées d\'un quart'
      else if (pct === 50) variables.statutLiberationParts = 'libérées de moitié'
      else variables.statutLiberationParts = `libérées de ${pct}%`
    } else {
      variables.statutLiberationParts = 'entièrement libérées'
    }
  } else {
    // Si pas d'apport détaillé, valeur par défaut
    variables.statutLiberationParts = 'entièrement libérées'
  }

  return variables
}

// Fonction pour générer le document complet
export function generateStatuts(dossier: Dossier, statutsData: Partial<StatutsData>): string {
  const template = getTemplate(dossier.societe.formeJuridique) as any
  const variables = buildVariables(dossier, statutsData)
  
  // Récupérer la civilité pour l'accord de genre
  const civilite = (variables.civiliteAssocie || 'M') as 'M' | 'Mme'

  let document = ''

  // En-tête (nouveau dans v3)
  if (template.enTete) {
    const enTeteVariant = template.enTete.variants[0]
    document += `${replaceVariables(enTeteVariant.texte, variables)}\n\n`
  }

  // Le soussigné / Préambule
  const preambuleText = selectPreambuleVariant(template.preambule, variables)
  document += `${accorderGenre(replaceVariables(preambuleText, variables), civilite)}\n\n`

  // Titre
  document += `${template.titre}\n\n`

  // Articles - avec numérotation dynamique
  let articleCounter = 1
  template.articles.forEach((article: any) => {
    const articleContent = selectArticleVariant(article, variables)

    // Only include if content is not empty or error message
    if (articleContent && !articleContent.startsWith('[Article non disponible')) {
      document += `\nARTICLE ${articleCounter} - ${article.titre}\n\n`
      // Appliquer l'accord de genre sur le contenu de l'article
      document += accorderGenre(replaceVariables(articleContent, variables), civilite)
      document += '\n'
      articleCounter++ // Incrémenter le compteur uniquement quand un article est ajouté
    }
  })

  // Conclusion
  document += '\n\n'
  const conclusionText = typeof template.conclusion === 'string'
    ? template.conclusion
    : template.conclusion.texte
  document += accorderGenre(replaceVariables(conclusionText, variables), civilite)

  return document
}

// Fonction pour calculer la progression du formulaire
export function calculateProgression(statutsData: Partial<StatutsData>): number {
  const isSASU = statutsData.formeJuridique === 'SASU' || statutsData.formeJuridique === 'SAS'

  let completedFields = 0
  let totalFields = 10 // Champs essentiels de base

  // Champs obligatoires pour toutes les formes juridiques
  if (statutsData.associeUnique) completedFields++
  if (statutsData.denomination) completedFields++
  if (statutsData.objetSocial) completedFields++
  if (statutsData.siegeSocial) completedFields++
  if (statutsData.duree) completedFields++
  if (statutsData.capitalSocial && statutsData.apportDetaille) completedFields++
  if (statutsData.partsSociales) completedFields++
  if (statutsData.nominationGerant || statutsData.gerant || statutsData.nominationPresident || statutsData.president) completedFields++
  if (statutsData.exerciceSocial) completedFields++
  if (statutsData.dateSignature && statutsData.lieuSignature) completedFields++

  // Option fiscale uniquement pour EURL/SARL
  if (!isSASU) {
    totalFields++
    if (statutsData.optionFiscale) completedFields++
  }

  // Champs optionnels ne bloquent plus la progression
  // - admissionAssocies (optionnel)
  // - commissairesAuxComptes (optionnel)
  // - compteCourant (optionnel)

  return Math.round((completedFields / totalFields) * 100)
}
