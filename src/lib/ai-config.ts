import { AI_CONFIG } from '../config/ai-config'

export function isAIConfigured(): boolean {
  return !!AI_CONFIG.OPENAI_API_KEY && AI_CONFIG.OPENAI_API_KEY !== 'your_openai_api_key_here'
}
