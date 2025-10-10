import OpenAI from 'openai'
import { AI_CONFIG } from '../config/ai-config'

// Configuration du client OpenAI avec GPT-5
export const openaiClient = new OpenAI({
  apiKey: AI_CONFIG.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Pour usage côté client
})

// Vérifier la configuration au démarrage
if (!AI_CONFIG.OPENAI_API_KEY || AI_CONFIG.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.warn(`
🔑 Configuration IA manquante !

Pour activer les fonctionnalités IA :
1. Obtenez votre clé API sur https://platform.openai.com/api-keys
2. Éditez le fichier src/config/ai-config.ts
3. Remplacez 'your_openai_api_key_here' par votre vraie clé
4. Redémarrez l'application

Fichier src/config/ai-config.ts :
OPENAI_API_KEY=sk-votre_vraie_cle_api_ici
AI_ENABLED=true
`)
}

// Configuration GPT-5 avec paramètres optimisés
export const GPT5_CONFIG = {
  model: 'gpt-5' as const,
  reasoning_effort: 'high' as const, // Pour analyses juridiques complexes
  verbosity: 'medium' as const, // Équilibré entre concision et détail
  temperature: 1, // Faible pour cohérence juridique
  max_completion_tokens: 50000, // GPT-5 utilise max_completion_tokens au lieu de max_tokens
}

// Configuration pour différentes tâches
export const AI_TASK_CONFIGS = {
  // Validation et vérification - raisonnement élevé
  validation: {
    ...GPT5_CONFIG,
    reasoning_effort: 'high' as const,
    verbosity: 'low' as const,
  },
  
  // Chat assistant - équilibré
  chat: {
    ...GPT5_CONFIG,
    reasoning_effort: 'medium' as const,
    verbosity: 'medium' as const,
  },
  
  // Suggestions - rapide et concis
  suggestions: {
    ...GPT5_CONFIG,
    reasoning_effort: 'low' as const,
    verbosity: 'low' as const,
  },
  
  // Génération de documents - détaillé
  generation: {
    ...GPT5_CONFIG,
    reasoning_effort: 'high' as const,
    verbosity: 'high' as const,
  },
  
  // Analyse de documents - vision + raisonnement
  analysis: {
    ...GPT5_CONFIG,
    reasoning_effort: 'high' as const,
    verbosity: 'medium' as const,
  }
}

// Fonction utilitaire pour générer du texte avec GPT-5
export async function generateWithGPT5(
  prompt: string,
  taskType: keyof typeof AI_TASK_CONFIGS = 'chat',
  options?: {
    systemPrompt?: string
    maxRetries?: number
    timeout?: number
  }
) {
  const config = AI_TASK_CONFIGS[taskType]
  const { systemPrompt, maxRetries = 3, timeout = 30000 } = options || {}

  try {
    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ]

    const response = await openaiClient.chat.completions.create({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_completion_tokens: config.max_completion_tokens,
      // @ts-ignore - GPT-5 specific options
      reasoning_effort: config.reasoning_effort,
      // @ts-ignore - GPT-5 specific options
      verbosity: config.verbosity,
    })

    return {
      success: true,
      text: response.choices[0]?.message?.content || '',
      usage: response.usage,
    }
  } catch (error) {
    console.error('Erreur GPT-5:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// Fonction pour générer des objets structurés avec GPT-5
export async function generateStructuredWithGPT5<T>(
  prompt: string,
  schema: any,
  taskType: keyof typeof AI_TASK_CONFIGS = 'validation'
) {
  const config = AI_TASK_CONFIGS[taskType]

  try {
    const messages = [
      { role: 'system' as const, content: 'Tu dois répondre en JSON strictement conforme au schéma fourni.' },
      { role: 'user' as const, content: prompt }
    ]

    const response = await openaiClient.chat.completions.create({
      model: config.model,
      messages,
      temperature: config.temperature,
      response_format: { type: 'json_object' },
      // @ts-ignore - GPT-5 specific options
      reasoning_effort: config.reasoning_effort,
      // @ts-ignore - GPT-5 specific options
      verbosity: config.verbosity,
    })

    const content = response.choices[0]?.message?.content || '{}'
    const parsedObject = JSON.parse(content)

    return {
      success: true,
      object: parsedObject as T,
      usage: response.usage,
    }
  } catch (error) {
    console.error('Erreur GPT-5 structuré:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// Vérifier si l'IA est activée
export function isAIEnabled(): boolean {
  return AI_CONFIG.AI_ENABLED && !!AI_CONFIG.OPENAI_API_KEY
}

// Mode debug
export function isDebugMode(): boolean {
  return AI_CONFIG.DEBUG_MODE
}
