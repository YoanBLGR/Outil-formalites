/**
 * Encode une chaîne UTF-8 en base64
 * Compatible avec tous les caractères Unicode (emojis, accents, cases à cocher, etc.)
 */
export function encodeBase64(str: string): string {
  // Encoder la chaîne en UTF-8 puis en base64
  return btoa(unescape(encodeURIComponent(str)))
}

/**
 * Décode une chaîne base64 en UTF-8
 * Compatible avec tous les caractères Unicode
 */
export function decodeBase64(str: string): string {
  // Décoder le base64 puis l'UTF-8
  return decodeURIComponent(escape(atob(str)))
}

