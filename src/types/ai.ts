// Types pour l'intégration IA avec GPT-5

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  context?: {
    fieldName?: string
    sectionId?: string
    statutsData?: any
  }
}

export interface AIValidationResult {
  isValid: boolean
  errors: AIValidationError[]
  warnings: AIValidationWarning[]
  suggestions: AISuggestion[]
  score: number // 0-100
}

export interface AIValidationError {
  id: string
  type: 'error' | 'warning' | 'info'
  field?: string
  section?: string
  message: string
  suggestion?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AIValidationWarning extends AIValidationError {
  type: 'warning'
}

export interface AISuggestion {
  id: string
  field: string
  type: 'text' | 'value' | 'clause' | 'parameter'
  title: string
  description: string
  value: any
  confidence: number // 0-1
  reasoning?: string
}

export interface AIChatResponse {
  message: string
  suggestions?: AISuggestion[]
  relatedFields?: string[]
  confidence: number
}

export interface AIDocumentAnalysis {
  type: 'kbis' | 'id' | 'statuts' | 'other'
  extractedData: Record<string, any>
  confidence: number
  warnings: string[]
  suggestions: string[]
}

export interface AIGeneratedDocument {
  type: 'pv' | 'm0' | 'checklist' | 'clause'
  title: string
  content: string
  metadata: {
    generatedAt: Date
    basedOn: string[]
    confidence: number
  }
}

export interface AIUsageStats {
  totalTokens: number
  totalCost: number
  requestsCount: number
  averageResponseTime: number
  lastReset: Date
}

export interface AICacheEntry {
  key: string
  data: any
  timestamp: Date
  expiresAt: Date
  hitCount: number
}

// Types pour les prompts système
export interface SystemPrompt {
  role: 'system'
  content: string
  context?: {
    task: string
    domain: 'legal' | 'general'
    language: 'fr' | 'en'
  }
}

// Types pour les réponses d'API
export interface AIAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  cost?: number
  responseTime?: number
}

// Configuration des tâches IA
export type AITaskType = 
  | 'validation'
  | 'chat'
  | 'suggestions'
  | 'generation'
  | 'analysis'
  | 'autofill'

export interface AITaskConfig {
  reasoning_effort: 'minimal' | 'low' | 'medium' | 'high'
  verbosity: 'low' | 'medium' | 'high'
  temperature: number
  max_tokens: number
  timeout?: number
}

// Types pour les événements IA
export interface AIEvent {
  type: 'validation_started' | 'validation_completed' | 'suggestion_generated' | 'chat_message' | 'error'
  timestamp: Date
  data: any
  userId?: string
  sessionId?: string
}

// Types pour les métriques de performance
export interface AIMetrics {
  averageResponseTime: number
  successRate: number
  errorRate: number
  mostUsedFeatures: Array<{
    feature: string
    count: number
  }>
  costPerDay: number
  tokensPerDay: number
}
