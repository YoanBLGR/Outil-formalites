// Configuration IA - À modifier selon vos besoins
export const AI_CONFIG = {
  // Clé API OpenAI (utiliser variable d'environnement)
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  
  // Activation de l'IA
  AI_ENABLED: true,
  
  // Mode debug
  DEBUG_MODE: false,
}

// Vérifier si l'IA est configurée
export function isAIConfigured(): boolean {
  return !!AI_CONFIG.OPENAI_API_KEY && AI_CONFIG.OPENAI_API_KEY !== 'your_openai_api_key_here'
}

// Message d'aide pour la configuration
export const CONFIG_HELP = `
Pour activer l'IA, modifiez le fichier src/config/ai-config.ts avec votre clé API :

OPENAI_API_KEY=votre_cle_api_openai
AI_ENABLED=true

Obtenez votre clé API sur : https://platform.openai.com/api-keys
`
