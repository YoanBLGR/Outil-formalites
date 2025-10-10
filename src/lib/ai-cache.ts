import type { AICacheEntry } from '../types/ai'

// Cache simple en mémoire pour les réponses IA
class AICache {
  private cache = new Map<string, AICacheEntry>()
  private maxSize = 1000 // Maximum 1000 entrées
  private defaultTTL = 24 * 60 * 60 * 1000 // 24 heures par défaut

  // Générer une clé de cache basée sur le contenu
  generateKey(prompt: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : ''
    const combined = prompt + contextStr
    return btoa(combined).replace(/[^a-zA-Z0-9]/g, '')
  }

  // Obtenir une entrée du cache
  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() > entry.expiresAt.getTime()) {
      this.cache.delete(key)
      return null
    }

    // Incrémenter le compteur d'accès
    entry.hitCount++
    return entry.data
  }

  // Stocker une entrée dans le cache
  set(key: string, data: any, ttl?: number): void {
    const now = Date.now()
    const expiresAt = new Date(now + (ttl || this.defaultTTL))

    const entry: AICacheEntry = {
      key,
      data,
      timestamp: new Date(now),
      expiresAt,
      hitCount: 0,
    }

    // Si le cache est plein, supprimer l'entrée la moins utilisée
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(key, entry)
  }

  // Supprimer l'entrée la moins utilisée
  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let minHitCount = Infinity
    let oldestTimestamp = Infinity

    for (const [key, entry] of this.cache.entries()) {
      // Priorité : hitCount le plus bas, puis timestamp le plus ancien
      if (entry.hitCount < minHitCount || 
          (entry.hitCount === minHitCount && entry.timestamp.getTime() < oldestTimestamp)) {
        leastUsedKey = key
        minHitCount = entry.hitCount
        oldestTimestamp = entry.timestamp.getTime()
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  // Nettoyer les entrées expirées
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt.getTime()) {
        this.cache.delete(key)
      }
    }
  }

  // Obtenir les statistiques du cache
  getStats() {
    const now = Date.now()
    let totalHits = 0
    let expiredCount = 0
    let activeCount = 0

    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount
      if (now > entry.expiresAt.getTime()) {
        expiredCount++
      } else {
        activeCount++
      }
    }

    return {
      totalEntries: this.cache.size,
      activeEntries: activeCount,
      expiredEntries: expiredCount,
      totalHits,
      hitRate: totalHits / Math.max(this.cache.size, 1),
    }
  }

  // Vider le cache
  clear(): void {
    this.cache.clear()
  }

  // Supprimer une entrée spécifique
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
}

// Instance singleton du cache
export const aiCache = new AICache()

// Nettoyer le cache toutes les heures
setInterval(() => {
  aiCache.cleanup()
}, 60 * 60 * 1000)

// Fonction utilitaire pour wrapper les appels IA avec cache
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Vérifier le cache d'abord
  const cached = aiCache.get(key)
  if (cached !== null) {
    return cached
  }

  // Exécuter la fonction et mettre en cache le résultat
  const result = await fn()
  aiCache.set(key, result, ttl)
  
  return result
}

// Types de cache spécifiques avec TTL appropriés
export const CACHE_TTL = {
  VALIDATION: 60 * 60 * 1000,      // 1 heure (validation change peu)
  SUGGESTIONS: 30 * 60 * 1000,     // 30 minutes (suggestions peuvent changer)
  CHAT: 5 * 60 * 1000,             // 5 minutes (chat plus dynamique)
  ANALYSIS: 24 * 60 * 60 * 1000,   // 24 heures (analyse de docs stable)
  GENERATION: 60 * 60 * 1000,      // 1 heure (génération de docs)
} as const
