/**
 * Liste des identifiants autorisés à accéder à l'application
 * 
 * Pour ajouter un nouvel utilisateur, ajoutez simplement son identifiant à ce tableau.
 * Pour retirer un utilisateur, supprimez son identifiant de ce tableau.
 * 
 * Note: Ce système est volontairement simple et ne nécessite pas de mot de passe.
 * Il est conçu pour un usage interne avec un niveau de sécurité basique.
 */

export const AUTHORIZED_USERS: string[] = [
  'yoan',
  'stef',

  // Ajoutez vos identifiants ici
  // Exemple:
  // 'jean.dupont',
  // 'marie.martin',
]

/**
 * Vérifie si un identifiant est autorisé
 */
export function isAuthorizedUser(username: string): boolean {
  if (!username || username.trim() === '') {
    return false
  }
  
  // Normaliser l'identifiant (minuscules, pas d'espaces)
  const normalizedUsername = username.trim().toLowerCase()
  const normalizedAuthorizedUsers = AUTHORIZED_USERS.map(u => u.toLowerCase())
  
  return normalizedAuthorizedUsers.includes(normalizedUsername)
}

