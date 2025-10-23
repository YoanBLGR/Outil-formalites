/**
 * Composant d'affichage des logs de débogage pour le Guichet Unique
 * Affiche tous les logs en temps réel avec filtres et export
 */

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { Download, Trash2, Filter, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { guLogger, type LogEntry, type LogLevel } from '../../lib/gu-logger'
import { toast } from 'sonner'

export function GUDebugLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // S'abonner aux nouveaux logs
  useEffect(() => {
    // Charger les logs existants
    setLogs(guLogger.getLogs())

    // S'abonner aux nouveaux logs
    const unsubscribe = guLogger.subscribe(() => {
      setLogs(guLogger.getLogs())
    })

    return unsubscribe
  }, [])

  // Filtrer les logs
  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false
    return true
  })

  // Obtenir les catégories uniques
  const categories = Array.from(new Set(logs.map(log => log.category)))

  // Effacer les logs
  const handleClear = () => {
    guLogger.clear()
    toast.success('Logs effacés')
  }

  // Exporter en JSON
  const handleExportJSON = () => {
    const json = guLogger.exportToJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gu-logs-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exportés en JSON')
  }

  // Exporter en texte
  const handleExportText = () => {
    const text = guLogger.exportToText()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gu-logs-${new Date().toISOString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exportés en texte')
  }

  // Copier dans le presse-papier
  const handleCopy = () => {
    const text = guLogger.exportToText()
    navigator.clipboard.writeText(text)
    toast.success('Logs copiés dans le presse-papier')
  }

  // Couleur du badge selon le niveau
  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'debug': return 'bg-gray-500'
      case 'info': return 'bg-blue-500'
      case 'warn': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'success': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  // Icône selon le niveau
  const getLevelIcon = (level: LogLevel): string => {
    switch (level) {
      case 'debug': return '🔍'
      case 'info': return 'ℹ️'
      case 'warn': return '⚠️'
      case 'error': return '❌'
      case 'success': return '✅'
      default: return '📝'
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Logs de débogage Guichet Unique
              <Badge variant="secondary">{filteredLogs.length} / {logs.length}</Badge>
            </CardTitle>
            <CardDescription>
              Tous les événements, requêtes et erreurs en temps réel
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Contrôles */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filtre par niveau */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
              className="px-3 py-1 text-sm border rounded-md"
            >
              <option value="all">Tous les niveaux</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>

            {/* Filtre par catégorie */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="flex-1" />

            {/* Actions */}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportText}>
              <Download className="h-4 w-4 mr-2" />
              Export TXT
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Effacer
            </Button>
          </div>

          {/* Liste des logs */}
          <ScrollArea className="h-[500px] w-full border rounded-md p-4 bg-slate-950 text-white font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                Aucun log à afficher
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800 pb-3">
                    {/* En-tête du log */}
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-slate-400">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <Badge className={`${getLevelColor(log.level)} text-white text-xs`}>
                        {getLevelIcon(log.level)} {log.level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.category}
                      </Badge>
                    </div>

                    {/* Message */}
                    <div className="text-white mb-2">
                      {log.message}
                    </div>

                    {/* Détails */}
                    {log.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          Afficher les détails
                        </summary>
                        <pre className="mt-2 p-2 bg-slate-900 rounded text-xs overflow-auto">
                          {typeof log.details === 'string' 
                            ? log.details 
                            : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Erreur */}
                    {log.error && (
                      <div className="mt-2 p-2 bg-red-950 border border-red-800 rounded">
                        <div className="text-red-400 font-semibold">Error: {log.error.message}</div>
                        {log.error.stack && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-red-300 text-xs">
                              Stack trace
                            </summary>
                            <pre className="mt-1 text-xs text-red-200 overflow-auto">
                              {log.error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Statistiques */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>Total: <strong>{logs.length}</strong></div>
            <div>Errors: <strong className="text-red-600">{logs.filter(l => l.level === 'error').length}</strong></div>
            <div>Warnings: <strong className="text-yellow-600">{logs.filter(l => l.level === 'warn').length}</strong></div>
            <div>Success: <strong className="text-green-600">{logs.filter(l => l.level === 'success').length}</strong></div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

