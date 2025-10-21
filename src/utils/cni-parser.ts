import type { CNIData, CNIFieldConfidence } from '../types'

/**
 * Parser pour extraire les données d'une CNI française depuis le texte OCR
 */

// Liste de prénoms féminins courants pour déterminer la civilité
const PRENOMS_FEMININS = [
  'marie', 'nathalie', 'isabelle', 'sylvie', 'catherine', 'françoise',
  'anne', 'christine', 'martine', 'monique', 'sophie', 'sandrine',
  'valérie', 'stéphanie', 'laurence', 'patricia', 'cécile', 'céline',
  'virginie', 'florence', 'hélène', 'aurélie', 'julie', 'marion',
  'claire', 'émilie', 'camille', 'léa', 'manon', 'chloé', 'sarah',
  'laura', 'marine', 'pauline', 'alexandra', 'charlotte', 'lucie'
]

/**
 * Nettoie le texte brut de l'OCR
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .replace(/[|]/g, 'I') // Remplacer les pipes par des I
    .replace(/[°]/g, '0') // Remplacer les ° par des 0
    .trim()
}

/**
 * Extrait le nom de famille depuis le texte OCR
 */
function extractNom(text: string): { value: string; confidence: number } {
  const patterns = [
    // Passeport français
    /Nom\/Surname\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ\-\s]{2,40})/i,
    // CNI
    /(?:NOM|Nom)\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ\-\s]{2,40})/i,
    /Nom\s+de\s+famille\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ\-\s]{2,40})/i,
    /SURNAME\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ\-\s]{2,40})/i,
    // Pattern pour nouvelle CNI (nom sur plusieurs lignes potentiellement)
    /^\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ\-]{3,40})\s*$/m
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const nom = match[1].trim().toUpperCase()
      // Vérifier que ce n'est pas un mot-clé
      if (!nom.match(/^(NOM|PRENOM|DATE|LIEU|NATIONALITE|SEXE)$/)) {
        return {
          value: nom,
          confidence: 85
        }
      }
    }
  }

  return { value: '', confidence: 0 }
}

/**
 * Extrait le(s) prénom(s) depuis le texte OCR
 */
function extractPrenom(text: string): { value: string; confidence: number } {
  const patterns = [
    // Passeport français (avec virgule entre prénoms)
    /Prénoms\/Given\s+names\s*(?:\(\d+\))?\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ][a-zàâäçéèêëïîôœùûü,\-\s]{1,60})/i,
    // CNI
    /(?:PRENOM|Prénom|Prenom)\s*(?:\(s\))?\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ][a-zàâäçéèêëïîôœùûü\-\s]{1,40})/i,
    /(?:GIVEN\s+NAME|FIRST\s+NAME)\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ][a-zàâäçéèêëïîôœùûü\-\s]{1,40})/i,
    // Pattern pour capturer plusieurs prénoms
    /Prénom\(s\)\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ][a-zàâäçéèêëïîôœùûü,\-\s]{1,60})/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const prenom = match[1].trim()
      // Capitaliser correctement (première lettre en majuscule)
      const prenomFormatted = prenom
        .split(/[\s,]+/)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ')

      return {
        value: prenomFormatted,
        confidence: 85
      }
    }
  }

  return { value: '', confidence: 0 }
}

/**
 * Extrait la date de naissance depuis le texte OCR
 */
function extractDateNaissance(text: string): { value: string; confidence: number } {
  const patterns = [
    // Passeport français (format avec espaces : 13 08 1998)
    /Date\s+de\s+naissance\/Date\s+of\s+birth\s*(?:\(\d+\))?\s*[:\s]?\s*(\d{2}\s+\d{2}\s+\d{4})/i,
    // CNI
    /(?:Date\s+de\s+)?naissance\s*[:\s]?\s*(\d{2}[\s\./\-]\d{2}[\s\./\-]\d{4})/i,
    /(?:NE|Né|Née)\s+le\s*[:\s]?\s*(\d{2}[\s\./\-]\d{2}[\s\./\-]\d{4})/i,
    /DATE\s+OF\s+BIRTH\s*[:\s]?\s*(\d{2}[\s\./\-]\d{2}[\s\./\-]\d{4})/i,
    // Format JJ.MM.AAAA
    /(\d{2}\.\d{2}\.\d{4})/,
    // Format JJ/MM/AAAA
    /(\d{2}\/\d{2}\/\d{4})/,
    // Format JJ MM AAAA (avec espaces - passeport)
    /(\d{2}\s+\d{2}\s+\d{4})/,
    // Format JJMMAAAA (sans séparateur)
    /\b(\d{2})(\d{2})(\d{4})\b/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      let date = match[1]

      // Si format sans séparateur, ajouter les slashes
      if (match[3]) {
        date = `${match[1]}/${match[2]}/${match[3]}`
      } else {
        // Normaliser avec des slashes (remplacer espaces, points, tirets)
        date = date.replace(/[\s\.\-]+/g, '/')
      }

      // Valider que la date est cohérente
      const parts = date.split('/')
      if (parts.length === 3) {
        const jour = parseInt(parts[0])
        const mois = parseInt(parts[1])
        const annee = parseInt(parts[2])

        if (jour >= 1 && jour <= 31 &&
            mois >= 1 && mois <= 12 &&
            annee >= 1900 && annee <= new Date().getFullYear()) {
          return {
            value: date,
            confidence: 90
          }
        }
      }
    }
  }

  return { value: '', confidence: 0 }
}

/**
 * Extrait le lieu de naissance depuis le texte OCR
 */
function extractLieuNaissance(text: string): { value: string; confidence: number } {
  const patterns = [
    // Passeport français
    /Lieu\s+de\s+naissance\/Place\s+of\s+birth\s*(?:\(\d+\))?\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ][a-zàâäçéèêëïîôœùûü\-\s]{2,40})/i,
    // CNI
    /(?:Lieu\s+de\s+)?naissance\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ][a-zàâäçéèêëïîôœùûü\-\s]{2,40})/i,
    /(?:NE|Né|Née)\s+à\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ][a-zàâäçéèêëïîôœùûü\-\s]{2,40})/i,
    /PLACE\s+OF\s+BIRTH\s*[:\s]?\s*([A-ZÀÂÄÇÉÈÊËÏÎÔŒÙÛÜ][a-zàâäçéèêëïîôœùûü\-\s]{2,40})/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const lieu = match[1].trim()
      // Capitaliser correctement
      const lieuFormatted = lieu
        .split(/[\s\-]+/)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ')

      return {
        value: lieuFormatted,
        confidence: 75
      }
    }
  }

  return { value: '', confidence: 0 }
}

/**
 * Déduit la civilité depuis le prénom ou le texte
 */
function extractCivilite(text: string, prenom: string): { value: 'M' | 'Mme' | ''; confidence: number } {
  // Chercher explicitement dans le texte (passeport et CNI)
  if (text.match(/Sexe\/Sex\s*(?:\(\d+\))?\s*[:\s]?\s*F/i) || text.match(/SEXE\s*[:\s]?\s*F/i) || text.match(/SEX\s*[:\s]?\s*F/i)) {
    return { value: 'Mme', confidence: 95 }
  }
  if (text.match(/Sexe\/Sex\s*(?:\(\d+\))?\s*[:\s]?\s*M/i) || text.match(/SEXE\s*[:\s]?\s*M/i) || text.match(/SEX\s*[:\s]?\s*M/i)) {
    return { value: 'M', confidence: 95 }
  }

  // Déduire depuis le prénom
  if (prenom) {
    const firstPrenom = prenom.split(/[\s,]+/)[0].toLowerCase()
    if (PRENOMS_FEMININS.includes(firstPrenom)) {
      return { value: 'Mme', confidence: 70 }
    }
    // Par défaut M. si prénom non reconnu
    return { value: 'M', confidence: 50 }
  }

  return { value: '', confidence: 0 }
}

/**
 * Parse le texte OCR brut et extrait les données de la CNI
 */
export function parseCNIText(rawText: string): {
  data: CNIData
  fieldConfidence: CNIFieldConfidence
} {
  const cleanedText = cleanText(rawText)

  const nom = extractNom(cleanedText)
  const prenom = extractPrenom(cleanedText)
  const dateNaissance = extractDateNaissance(cleanedText)
  const lieuNaissance = extractLieuNaissance(cleanedText)
  const civilite = extractCivilite(cleanedText, prenom.value)

  // Calculer la confiance globale
  const confidenceValues = [
    nom.confidence,
    prenom.confidence,
    civilite.confidence,
    dateNaissance.confidence,
    lieuNaissance.confidence
  ].filter(c => c > 0)

  const globalConfidence = confidenceValues.length > 0
    ? Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length)
    : 0

  return {
    data: {
      nom: nom.value,
      prenom: prenom.value,
      civilite: civilite.value || undefined,
      dateNaissance: dateNaissance.value || undefined,
      lieuNaissance: lieuNaissance.value || undefined,
      confidence: globalConfidence
    },
    fieldConfidence: {
      nom: nom.confidence,
      prenom: prenom.confidence,
      civilite: civilite.confidence,
      dateNaissance: dateNaissance.confidence,
      lieuNaissance: lieuNaissance.confidence
    }
  }
}

/**
 * Valide que les données extraites sont cohérentes
 */
export function validateCNIData(data: CNIData): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.nom || data.nom.length < 2) {
    errors.push('Nom invalide ou manquant')
  }

  if (!data.prenom || data.prenom.length < 2) {
    errors.push('Prénom invalide ou manquant')
  }

  if (data.dateNaissance) {
    const parts = data.dateNaissance.split('/')
    if (parts.length !== 3) {
      errors.push('Format de date invalide')
    }
  }

  if (data.confidence < 50) {
    errors.push('Confiance trop faible - vérifiez la qualité de l\'image')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
