import { generateWithGPT5 } from '../lib/openai'
import { withCache, CACHE_TTL } from '../lib/ai-cache'
import type { StatutsData } from '../types/statuts'
import type { AIMessage, AIChatResponse } from '../types/ai'

// Prompt système pour le chat assistant
const CHAT_SYSTEM_PROMPT = `Tu es un assistant juridique expert spécialisé dans les EURL (Entreprise Unipersonnelle à Responsabilité Limitée) françaises.

TON RÔLE :
- Aider l'utilisateur à rédiger ses statuts EURL
- Expliquer les implications juridiques de chaque choix
- Guider dans les décisions importantes
- Répondre aux questions techniques
- Proposer des améliorations

TON STYLE :
- Professionnel mais accessible
- Précis et factuel
- Pédagogique
- Toujours conforme au droit français
- Proactif dans les suggestions

IMPORTANT :
- Ne remplace jamais un avocat pour des conseils personnalisés
- Indique toujours quand consulter un professionnel
- Base tes réponses sur le Code de commerce français
- Sois prudent avec les conseils fiscaux

Réponds de manière structurée et utile.`

export async function chatWithContext(
  message: string,
  statutsData: StatutsData,
  history: AIMessage[] = []
): Promise<AIChatResponse> {
  // Construire le contexte des statuts
  const contextSummary = buildContextSummary(statutsData)
  
  // Construire l'historique de conversation
  const conversationHistory = buildConversationHistory(history)
  
  const prompt = `${conversationHistory}

CONTEXTE ACTUEL DES STATUTS :
${contextSummary}

QUESTION DE L'UTILISATEUR :
"${message}"

Réponds de manière utile et contextuelle. Si pertinent, propose des suggestions d'amélioration des statuts.`

  const result = await generateWithGPT5(prompt, 'chat', {
    systemPrompt: CHAT_SYSTEM_PROMPT
  })

  if (!result.success) {
    return {
      message: "Désolé, je rencontre un problème technique. Veuillez réessayer.",
      confidence: 0,
      suggestions: [],
      relatedFields: []
    }
  }

  // Analyser la réponse pour extraire des suggestions et champs liés
  const analysis = await analyzeResponse(result.text, statutsData)
  
  return {
    message: result.text,
    confidence: 0.8, // Confiance par défaut
    suggestions: analysis.suggestions,
    relatedFields: analysis.relatedFields
  }
}

// Construire un résumé du contexte des statuts
function buildContextSummary(data: StatutsData): string {
  const sections = []
  
  if (data.denomination) {
    sections.push(`- Dénomination : ${data.denomination}`)
  }
  
  if (data.objetSocial) {
    sections.push(`- Objet social : ${data.objetSocial}`)
  }
  
  if (data.capitalSocial) {
    sections.push(`- Capital social : ${data.capitalSocial}€`)
  }
  
  if (data.associeUnique) {
    const associe = data.associeUnique
    if (associe.type === 'PERSONNE_PHYSIQUE') {
      sections.push(`- Associé unique : ${associe.prenom} ${associe.nom}`)
    } else {
      sections.push(`- Associé unique : ${associe.societeNom} (personne morale)`)
    }
  }
  
  if (data.gerant) {
    if (data.gerant.isAssocieUnique) {
      sections.push(`- Gérant : l'associé unique`)
    } else {
      sections.push(`- Gérant : ${data.gerant.prenom} ${data.gerant.nom} (tiers)`)
    }
  }
  
  if (data.duree) {
    sections.push(`- Durée : ${data.duree} ans`)
  }
  
  return sections.join('\n')
}

// Construire l'historique de conversation
function buildConversationHistory(history: AIMessage[]): string {
  if (history.length === 0) {
    return "Conversation précédente : Aucune"
  }
  
  const recentHistory = history.slice(-6) // Derniers 6 messages
  return recentHistory.map(msg => 
    `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'} : ${msg.content}`
  ).join('\n')
}

// Analyser la réponse pour extraire des suggestions et champs liés
async function analyzeResponse(response: string, statutsData: StatutsData): Promise<{
  suggestions: any[]
  relatedFields: string[]
}> {
  const prompt = `Analyse cette réponse d'assistant juridique et extrais :

RÉPONSE :
"${response}"

STATUTS :
${JSON.stringify(statutsData, null, 2)}

EXTRACTION REQUISE :
1. Suggestions d'amélioration des statuts (si présentes)
2. Champs mentionnés ou concernés

Réponds en JSON :
{
  "suggestions": [
    {
      "field": "nom_du_champ",
      "suggestion": "suggestion_text",
      "type": "improvement"
    }
  ],
  "relatedFields": ["champ1", "champ2"]
}`

  const result = await generateWithGPT5(prompt, 'analysis')

  if (!result.success) {
    return { suggestions: [], relatedFields: [] }
  }

  try {
    return JSON.parse(result.text)
  } catch {
    return { suggestions: [], relatedFields: [] }
  }
}

// Questions fréquentes avec réponses contextuelles
export async function getQuickAnswer(question: string, context: Partial<StatutsData>): Promise<string> {
  const cacheKey = `quick_answer_${question}_${JSON.stringify(context)}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Réponds brièvement à cette question fréquente sur les EURL :

QUESTION :
"${question}"

CONTEXTE :
${JSON.stringify(context, null, 2)}

Réponds en 2-3 phrases maximum, de manière claire et pratique.`

    const result = await generateWithGPT5(prompt, 'chat', {
      systemPrompt: CHAT_SYSTEM_PROMPT
    })

    return result.success ? result.text : "Je ne peux pas répondre à cette question pour le moment."
  }, CACHE_TTL.CHAT)
}

// Suggestions de questions à poser
export async function suggestQuestions(context: Partial<StatutsData>): Promise<string[]> {
  const cacheKey = `suggested_questions_${JSON.stringify(context)}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Propose 5 questions utiles que l'utilisateur pourrait poser sur ses statuts EURL :

CONTEXTE :
${JSON.stringify(context, null, 2)}

TYPES DE QUESTIONS :
- Clarifications juridiques
- Optimisations possibles
- Risques à considérer
- Évolutions futures
- Conformité légale

Réponds en JSON avec un tableau de questions :
["Question 1", "Question 2", ...]`

    const result = await generateWithGPT5(prompt, 'suggestions')

    if (!result.success) {
      return [
        "Quelles sont les clauses obligatoires pour une EURL ?",
        "Comment optimiser la protection de l'associé unique ?",
        "Quels sont les risques à éviter dans les statuts ?"
      ]
    }

    try {
      return JSON.parse(result.text)
    } catch {
      return [
        "Quelles sont les clauses obligatoires pour une EURL ?",
        "Comment optimiser la protection de l'associé unique ?",
        "Quels sont les risques à éviter dans les statuts ?"
      ]
    }
  }, CACHE_TTL.SUGGESTIONS)
}

// Expliquer une clause ou un concept
export async function explainConcept(
  concept: string, 
  context: Partial<StatutsData>
): Promise<string> {
  const cacheKey = `explain_${concept}_${JSON.stringify(context)}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Explique ce concept juridique dans le contexte d'une EURL :

CONCEPT À EXPLIQUER :
"${concept}"

CONTEXTE :
${JSON.stringify(context, null, 2)}

EXPLICATION REQUISE :
- Définition claire
- Implications pratiques
- Exemples concrets
- Conseils d'application

Réponds de manière pédagogique et accessible.`

    const result = await generateWithGPT5(prompt, 'chat', {
      systemPrompt: CHAT_SYSTEM_PROMPT
    })

    return result.success ? result.text : "Je ne peux pas expliquer ce concept pour le moment."
  }, CACHE_TTL.CHAT)
}
