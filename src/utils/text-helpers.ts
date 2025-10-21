/**
 * Convertit un nombre en lettres françaises (majuscules)
 * Utilisé pour les montants dans les statuts
 */
export function nombreEnLettres(nombre: number): string {
  if (nombre === 0) return 'ZÉRO'

  const unites = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF']
  const dizaines = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE', 'QUATRE-VINGT', 'QUATRE-VINGT']
  const exceptions = ['', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE']

  function convertirGroupe(n: number): string {
    if (n === 0) return ''
    
    let resultat = ''
    const centaines = Math.floor(n / 100)
    const reste = n % 100
    const dizaine = Math.floor(reste / 10)
    const unite = reste % 10

    // Centaines
    if (centaines > 1) {
      resultat += unites[centaines] + ' '
    }
    if (centaines >= 1) {
      resultat += 'CENT'
      if (centaines > 1 && reste === 0) resultat += 'S'
      resultat += ' '
    }

    // Dizaines et unités
    if (reste >= 11 && reste <= 16) {
      resultat += exceptions[reste - 10]
    } else if (reste === 71) {
      resultat += 'SOIXANTE ET ONZE'
    } else if (reste >= 72 && reste <= 76) {
      resultat += 'SOIXANTE-' + exceptions[reste - 70]
    } else if (reste === 77) {
      resultat += 'SOIXANTE-DIX-SEPT'
    } else if (reste === 78) {
      resultat += 'SOIXANTE-DIX-HUIT'
    } else if (reste === 79) {
      resultat += 'SOIXANTE-DIX-NEUF'
    } else if (reste === 80) {
      resultat += 'QUATRE-VINGTS'
    } else if (reste === 91) {
      resultat += 'QUATRE-VINGT-ONZE'
    } else if (reste >= 92 && reste <= 96) {
      resultat += 'QUATRE-VINGT-' + exceptions[reste - 90]
    } else if (reste >= 97 && reste <= 99) {
      resultat += 'QUATRE-VINGT-' + unites[reste - 90]
    } else {
      if (dizaine > 0) {
        resultat += dizaines[dizaine]
        if (unite === 1 && dizaine < 8 && dizaine !== 1) {
          resultat += ' ET UN'
        } else if (unite > 0) {
          if (dizaine === 8) {
            resultat += '-' + unites[unite]
          } else {
            resultat += '-' + unites[unite]
          }
        }
      } else if (unite > 0) {
        resultat += unites[unite]
      }
    }

    return resultat.trim()
  }

  // Décomposition du nombre
  const milliards = Math.floor(nombre / 1000000000)
  const millions = Math.floor((nombre % 1000000000) / 1000000)
  const milliers = Math.floor((nombre % 1000000) / 1000)
  const unites_simple = nombre % 1000

  let resultat = ''

  if (milliards > 0) {
    if (milliards === 1) {
      resultat += 'UN MILLIARD '
    } else {
      resultat += convertirGroupe(milliards) + ' MILLIARDS '
    }
  }

  if (millions > 0) {
    if (millions === 1) {
      resultat += 'UN MILLION '
    } else {
      resultat += convertirGroupe(millions) + ' MILLIONS '
    }
  }

  if (milliers > 0) {
    if (milliers === 1) {
      resultat += 'MILLE '
    } else {
      resultat += convertirGroupe(milliers) + ' MILLE '
    }
  }

  if (unites_simple > 0) {
    resultat += convertirGroupe(unites_simple)
  }

  return resultat.trim()
}

/**
 * Formate un montant avec sa version en lettres
 * Exemple: "10 000 € (DIX MILLE EUROS)"
 */
export function montantAvecLettres(montant: number, devise: string = 'EUROS'): string {
  const montantFormate = montant.toLocaleString('fr-FR')
  const lettres = nombreEnLettres(montant)
  
  // Gestion du singulier/pluriel pour "euro"
  const deviseFinale = montant <= 1 ? devise.slice(0, -1) : devise
  
  return `${montantFormate} € (${lettres} ${deviseFinale})`
}

/**
 * Formate un nombre avec des espaces pour les milliers (format français)
 * Exemple: 1000 -> "1 000", 10000 -> "10 000"
 */
export function formaterNombreFrancais(nombre: number): string {
  return nombre.toLocaleString('fr-FR')
}

/**
 * Formate une date au format ISO (YYYY-MM-DD) en français
 * Exemple: "1985-01-15" -> "15 janvier 1985"
 */
export function formaterDateFrancais(dateISO: string): string {
  if (!dateISO) return ''

  const mois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ]

  try {
    const [annee, moisNum, jour] = dateISO.split('-')
    const jourNum = parseInt(jour, 10)
    const moisIndex = parseInt(moisNum, 10) - 1

    if (moisIndex >= 0 && moisIndex < 12) {
      return `${jourNum} ${mois[moisIndex]} ${annee}`
    }
    return dateISO
  } catch (e) {
    return dateISO
  }
}

/**
 * Formate une date au format ISO (YYYY-MM-DD) en format DD-MM-YYYY
 * Exemple: "2025-10-15" -> "15-10-2025"
 */
export function formaterDateCourte(dateISO: string): string {
  if (!dateISO) return ''

  try {
    const [annee, mois, jour] = dateISO.split('-')
    return `${jour}-${mois}-${annee}`
  } catch (e) {
    return dateISO
  }
}

/**
 * Accorde le texte en fonction de la civilité (M/Mme)
 * Remplace les mots au masculin par leur version féminine si civilité === 'Mme'
 *
 * IMPORTANT : Les remplacements sont effectués du plus spécifique au plus général
 * pour éviter les doubles transformations (ex: "associé" → "associée" → "associéee")
 */
export function accorderGenre(texte: string, civilite: 'M' | 'Mme'): string {
  if (civilite === 'Mme') {
    return texte
      // ÉTAPE 1 : Expressions avec "associé" - du plus spécifique au plus général
      .replace(/associé unique/g, 'associée unique')
      .replace(/Associé unique/g, 'Associée unique')
      .replace(/l'associé unique/g, "l'associée unique")
      .replace(/L'associé unique/g, "L'associée unique")
      .replace(/de l'associé unique/g, "de l'associée unique")
      .replace(/De l'associé unique/g, "De l'associée unique")
      .replace(/à l'associé unique/g, "à l'associée unique")
      .replace(/À l'associé unique/g, "À l'associée unique")
      .replace(/l'associé fondateur/g, "l'associée fondatrice")
      .replace(/L'associé fondateur/g, "L'associée fondatrice")

      // "l'associé" seul (après avoir traité "l'associé unique")
      .replace(/l'associé([^e])/g, "l'associée$1")
      .replace(/L'associé([^e])/g, "L'associée$1")
      .replace(/de l'associé([^e])/g, "de l'associée$1")
      .replace(/De l'associé([^e])/g, "De l'associée$1")

      // ÉTAPE 2 : Le/La soussigné(e)
      .replace(/Le soussigné /g, 'La soussignée ')
      .replace(/le soussigné /g, 'la soussignée ')
      .replace(/du soussigné /g, 'de la soussignée ')
      .replace(/au soussigné /g, 'à la soussignée ')
      .replace(/soussigné,/g, 'soussignée,')

      // ÉTAPE 3 : Le/La gérant(e)
      .replace(/nommé gérant/g, 'nommée gérante')
      .replace(/Nommé gérant/g, 'Nommée gérante')
      .replace(/le gérant/g, 'la gérante')
      .replace(/Le gérant/g, 'La gérante')
      .replace(/du gérant/g, 'de la gérante')
      .replace(/Du gérant/g, 'De la gérante')
      .replace(/au gérant/g, 'à la gérante')
      .replace(/Au gérant/g, 'À la gérante')

      // ÉTAPE 4 : Le/La Président(e) (pour SASU)
      .replace(/le Président/g, 'la Présidente')
      .replace(/Le Président/g, 'La Présidente')
      .replace(/du Président/g, 'de la Présidente')
      .replace(/Du Président/g, 'De la Présidente')
      .replace(/au Président/g, 'à la Présidente')
      .replace(/Au Président/g, 'À la Présidente')
      .replace(/Président([,\s])/g, 'Présidente$1')

      // ÉTAPE 5 : Participes passés
      .replace(/nommé ([^g])/g, 'nommée $1') // "nommé" sauf "nommé gérant" déjà traité
      .replace(/Nommé ([^g])/g, 'Nommée $1')

      // né(e) avec parenthèses d'abord
      .replace(/né\(e\)/g, 'née')
      .replace(/Né\(e\)/g, 'Née')
      // puis né seul
      .replace(/né le /g, 'née le ')
      .replace(/né à /g, 'née à ')
      .replace(/Né le /g, 'Née le ')
      .replace(/Né à /g, 'Née à ')

      // dénommé(e) avec parenthèses
      .replace(/dénommé\(e\)/g, 'dénommée')
      .replace(/Dénommé\(e\)/g, 'Dénommée')

      // ÉTAPE 6 : Fondateur/Fondatrice
      .replace(/le fondateur/g, 'la fondatrice')
      .replace(/Le fondateur/g, 'La fondatrice')
      .replace(/du fondateur/g, 'de la fondatrice')
      .replace(/fondateur([,\s])/g, 'fondatrice$1')
  } else {
    // Pour les hommes (civilite === 'M'), enlever les parenthèses de né(e) et dénommé(e)
    return texte
      .replace(/né\(e\)/g, 'né')
      .replace(/Né\(e\)/g, 'Né')
      .replace(/dénommé\(e\)/g, 'dénommé')
      .replace(/Dénommé\(e\)/g, 'Dénommé')
  }
  return texte
}

