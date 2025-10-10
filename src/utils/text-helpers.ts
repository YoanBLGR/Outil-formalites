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
 * Accorde le texte en fonction de la civilité (M/Mme)
 * Remplace "associé" par "associée" si civilité === 'Mme'
 */
export function accorderGenre(texte: string, civilite: 'M' | 'Mme'): string {
  if (civilite === 'Mme') {
    return texte
      .replace(/\bassocié unique\b/g, 'associée unique')
      .replace(/\bAssocié unique\b/g, 'Associée unique')
      .replace(/\bl'associé unique\b/g, "l'associée unique")
      .replace(/\bL'associé unique\b/g, "L'associée unique")
      .replace(/\bde l'associé unique\b/g, "de l'associée unique")
      .replace(/\bDe l'associé unique\b/g, "De l'associée unique")
      .replace(/\bà l'associé unique\b/g, "à l'associée unique")
      .replace(/\bÀ l'associé unique\b/g, "À l'associée unique")
      .replace(/\bl'associé\b/g, "l'associée")
      .replace(/\bL'associé\b/g, "L'associée")
      .replace(/\bnommé gérant\b/g, 'nommée gérante')
      .replace(/\bNommé gérant\b/g, 'Nommée gérante')
      .replace(/\ble gérant\b/g, 'la gérante')
      .replace(/\bLe gérant\b/g, 'La gérante')
      .replace(/\bdu gérant\b/g, 'de la gérante')
      .replace(/\bDu gérant\b/g, 'De la gérante')
      .replace(/\bnommé\b/g, 'nommée')
      .replace(/\bNommé\b/g, 'Nommée')
      .replace(/\bné\b/g, 'née')
      .replace(/\bNé\b/g, 'Née')
  }
  return texte
}

