import { generateWithGPT5 } from '../lib/openai'
import { withCache, CACHE_TTL } from '../lib/ai-cache'
import type { StatutsData } from '../types/statuts'
import type { AISuggestion } from '../types/ai'

// Prompt système pour les suggestions
const SUGGESTIONS_SYSTEM_PROMPT = `Tu es un expert juridique spécialisé dans les EURL françaises. Tu proposes des suggestions intelligentes pour améliorer les statuts.

Règles pour tes suggestions :
1. Toujours conformes au droit français
2. Précises et applicables
3. Explicites sur le raisonnement
4. Adaptées au contexte spécifique
5. Optimisées pour la protection de l'associé

Réponds en JSON avec des suggestions structurées.`

export async function suggestObjetSocial(activity: string): Promise<AISuggestion[]> {
  const cacheKey = `objet_social_${activity || 'empty'}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Propose 3 formulations juridiques appropriées pour l'objet social d'une EURL basé sur l'activité : "${activity}"

EXIGENCES :
- Formulations précises et juridiquement valides
- Couvrent l'activité principale et activités connexes
- Respectent les règles de rédaction des statuts
- Optimisées pour éviter les limitations futures

Réponds en JSON avec un tableau de suggestions :
[
  {
    "id": "unique_id",
    "field": "objetSocial",
    "type": "text",
    "title": "Titre de la suggestion",
    "description": "Description détaillée",
    "value": "Formulation proposée",
    "confidence": 0.9,
    "reasoning": "Explication du choix"
  }
]`

    const result = await generateWithGPT5(prompt, 'suggestions', {
      systemPrompt: SUGGESTIONS_SYSTEM_PROMPT
    })

    if (!result.success) {
      return []
    }

    try {
      return JSON.parse(result.text || '[]')
    } catch {
      return []
    }
  }, CACHE_TTL.SUGGESTIONS)
}

export async function suggestClausesOptionnelles(data: Partial<StatutsData>): Promise<AISuggestion[]> {
  const cacheKey = `clauses_optionnelles_${JSON.stringify(data || {})}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Analyse les statuts EURL suivants et propose des clauses optionnelles pertinentes :

STATUTS ACTUELS :
${JSON.stringify(data, null, 2)}

CLAUSES OPTIONNELLES À CONSIDÉRER :
1. Clauses de préemption (rachat de parts)
2. Clauses de non-concurrence
3. Clauses de rémunération du gérant
4. Clauses de limitation des pouvoirs
5. Clauses de majorité renforcée
6. Clauses de préavis de révocation
7. Clauses de transmission des parts
8. Clauses de dissolution anticipée

Réponds en JSON avec des suggestions de clauses adaptées au profil de cette EURL.`

    const result = await generateWithGPT5(prompt, 'suggestions', {
      systemPrompt: SUGGESTIONS_SYSTEM_PROMPT
    })

    if (!result.success) {
      return []
    }

    try {
      return JSON.parse(result.text || '[]')
    } catch {
      return []
    }
  }, CACHE_TTL.SUGGESTIONS)
}

export async function suggestParameters(fieldName: string, context: Partial<StatutsData>): Promise<AISuggestion[]> {
  const cacheKey = `parameters_${fieldName || 'empty'}_${JSON.stringify(context || {})}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Propose des valeurs recommandées pour le champ "${fieldName}" dans le contexte des statuts EURL suivants :

CONTEXTE :
${JSON.stringify(context, null, 2)}

CHAMPS SPÉCIFIQUES :
- Durée mandat gérant : "durée de la société", "3 ans", "5 ans", etc.
- Majorités : "la moitié", "les deux tiers", "l'unanimité"
- Délais préavis : 1, 3, 6 mois
- Exercice social : "1er janvier au 31 décembre", dates personnalisées
- Capital social : montants recommandés selon activité

Réponds en JSON avec des suggestions de valeurs appropriées.`

    const result = await generateWithGPT5(prompt, 'suggestions', {
      systemPrompt: SUGGESTIONS_SYSTEM_PROMPT
    })

    if (!result.success) {
      return []
    }

    try {
      return JSON.parse(result.text || '[]')
    } catch {
      return []
    }
  }, CACHE_TTL.SUGGESTIONS)
}

export async function suggestOptimizations(data: StatutsData): Promise<AISuggestion[]> {
  const cacheKey = `optimizations_${JSON.stringify(data || {})}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Analyse les statuts EURL suivants et propose des optimisations légales et fiscales :

STATUTS :
${JSON.stringify(data, null, 2)}

OPTIMISATIONS À CONSIDÉRER :
1. Structure fiscale optimale
2. Protection patrimoniale
3. Transmission facilitée
4. Gestion des risques
5. Évolutivité future
6. Conformité renforcée
7. Clauses de sécurité
8. Optimisation des coûts

Réponds en JSON avec des suggestions d'optimisation spécifiques et applicables.`

    const result = await generateWithGPT5(prompt, 'suggestions', {
      systemPrompt: SUGGESTIONS_SYSTEM_PROMPT
    })

    if (!result.success) {
      return []
    }

    try {
      return JSON.parse(result.text || '[]')
    } catch {
      return []
    }
  }, CACHE_TTL.SUGGESTIONS)
}

export async function suggestFormulationsJuridiques(
  fieldName: string, 
  currentValue: string, 
  context: Partial<StatutsData>
): Promise<AISuggestion[]> {
  const cacheKey = `formulations_${fieldName || 'empty'}_${currentValue || 'empty'}_${JSON.stringify(context || {})}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Améliore la formulation juridique du champ "${fieldName}" :

VALEUR ACTUELLE :
"${currentValue}"

CONTEXTE :
${JSON.stringify(context, null, 2)}

EXIGENCES :
- Formulation juridiquement précise
- Langage professionnel
- Conformité aux usages
- Clarté et précision
- Protection optimale

Propose 2-3 formulations améliorées en JSON.`

    const result = await generateWithGPT5(prompt, 'suggestions', {
      systemPrompt: SUGGESTIONS_SYSTEM_PROMPT
    })

    if (!result.success) {
      return []
    }

    try {
      return JSON.parse(result.text || '[]')
    } catch {
      return []
    }
  }, CACHE_TTL.SUGGESTIONS)
}

// Suggestions contextuelles basées sur le profil
export async function getContextualSuggestions(data: Partial<StatutsData>): Promise<AISuggestion[]> {
  const cacheKey = `contextual_${JSON.stringify(data || {})}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Analyse le profil de cette EURL et propose des suggestions contextuelles :

PROFIL EURL :
${JSON.stringify(data, null, 2)}

ANALYSE REQUISE :
1. Type d'activité et risques associés
2. Profil de l'associé unique
3. Besoins de protection
4. Évolutivité prévisible
5. Contraintes spécifiques

Propose des suggestions adaptées au profil spécifique de cette EURL.`

    const result = await generateWithGPT5(prompt, 'suggestions', {
      systemPrompt: SUGGESTIONS_SYSTEM_PROMPT
    })

    if (!result.success) {
      return []
    }

    try {
      return JSON.parse(result.text || '[]')
    } catch {
      return []
    }
  }, CACHE_TTL.SUGGESTIONS)
}
