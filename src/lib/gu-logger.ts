/**
 * Service de logging centralisé pour le Guichet Unique
 * Capture tous les événements, requêtes et erreurs pour faciliter le débogage
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  details?: any
  error?: Error
}

type LogListener = (log: LogEntry) => void

class GULogger {
  private logs: LogEntry[] = []
  private listeners: Set<LogListener> = new Set()
  private maxLogs = 500 // Garder max 500 logs en mémoire

  /**
   * Ajoute un écouteur pour recevoir les nouveaux logs
   */
  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener)
    // Retourner une fonction de désabonnement
    return () => this.listeners.delete(listener)
  }

  /**
   * Log un message
   */
  log(level: LogLevel, category: string, message: string, details?: any, error?: Error) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      error,
    }

    this.logs.push(entry)

    // Limiter la taille des logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Notifier les écouteurs
    this.listeners.forEach(listener => listener(entry))

    // Log aussi dans la console pour faciliter le débogage
    const consoleMessage = `[${category}] ${message}`
    switch (level) {
      case 'debug':
        console.log('🔍', consoleMessage, details || '')
        break
      case 'info':
        console.log('ℹ️', consoleMessage, details || '')
        break
      case 'warn':
        console.warn('⚠️', consoleMessage, details || '')
        break
      case 'error':
        console.error('❌', consoleMessage, details || '', error || '')
        break
      case 'success':
        console.log('✅', consoleMessage, details || '')
        break
    }
  }

  debug(category: string, message: string, details?: any) {
    this.log('debug', category, message, details)
  }

  info(category: string, message: string, details?: any) {
    this.log('info', category, message, details)
  }

  warn(category: string, message: string, details?: any) {
    this.log('warn', category, message, details)
  }

  error(category: string, message: string, details?: any, error?: Error) {
    this.log('error', category, message, details, error)
  }

  success(category: string, message: string, details?: any) {
    this.log('success', category, message, details)
  }

  /**
   * Récupère tous les logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * Filtre les logs par catégorie
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category)
  }

  /**
   * Filtre les logs par niveau
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * Efface tous les logs
   */
  clear() {
    this.logs = []
    this.listeners.forEach(listener => 
      listener({
        id: 'clear',
        timestamp: new Date(),
        level: 'info',
        category: 'SYSTEM',
        message: 'Logs cleared'
      })
    )
  }

  /**
   * Exporte les logs en JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Exporte les logs en texte
   */
  exportToText(): string {
    return this.logs.map(log => {
      const time = log.timestamp.toLocaleTimeString()
      const details = log.details ? `\n  ${JSON.stringify(log.details, null, 2)}` : ''
      const error = log.error ? `\n  Error: ${log.error.message}\n  Stack: ${log.error.stack}` : ''
      return `[${time}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${details}${error}`
    }).join('\n\n')
  }
}

// Instance singleton
export const guLogger = new GULogger()

