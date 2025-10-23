import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Détecte si l'application s'exécute dans l'environnement Tauri
 * Compatible avec Tauri v2
 * 
 * @returns {boolean} true si dans Tauri, false sinon
 */
export function isTauriApp(): boolean {
  if (typeof window === 'undefined') return false
  
  // Vérification des différentes propriétés Tauri
  // Utilisation de 'in' pour éviter les erreurs TypeScript
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window
}
