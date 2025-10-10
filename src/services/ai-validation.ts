import { generateStructuredWithGPT5 } from '../lib/openai'
import { withCache, CACHE_TTL } from '../lib/ai-cache'
import type { StatutsData } from '../types/statuts'
import type { AIValidationResult, AIValidationError, AISuggestion } from '../types/ai'

// Schéma de validation pour GPT-5
const validationSchema = {
  type: 'object',
  properties: {
    isValid: { type: 'boolean' },
    score: { type: 'number', minimum: 0, maximum: 100 },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['error', 'warning', 'info'] },
          field: { type: 'string' },
          section: { type: 'string' },
          message: { type: 'string' },
          suggestion: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
        },
        required: ['id', 'type', 'message', 'severity']
      }
    },
    warnings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['warning'] },
          field: { type: 'string' },
          section: { type: 'string' },
          message: { type: 'string' },
          suggestion: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] }
        },
        required: ['id', 'type', 'message', 'severity']
      }
    },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          field: { type: 'string' },
          type: { type: 'string', enum: ['text', 'value', 'clause', 'parameter'] },
          title: { type: 'string' },
          description: { type: 'string' },
          value: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          reasoning: { type: 'string' }
        },
        required: ['id', 'field', 'type', 'title', 'description', 'value', 'confidence']
      }
    }
  },
  required: ['isValid', 'score', 'errors', 'warnings', 'suggestions']
}

// Prompt système pour la validation des statuts EURL
const VALIDATION_SYSTEM_PROMPT = `Tu es un expert juridique spécialisé dans le droit des sociétés françaises, particulièrement les EURL (Entreprise Unipersonnelle à Responsabilité Limitée).

Ta mission est de valider la cohérence et la conformité légale des statuts d'une EURL en cours de rédaction.

Règles de validation importantes :
1. Vérifier la cohérence entre le capital social et les apports
2. S'assurer que toutes les mentions obligatoires sont présentes
3. Vérifier la conformité avec le Code de commerce français
4. Détecter les incohérences entre différentes sections
5. Proposer des améliorations pour optimiser les statuts

Réponds UNIQUEMENT en JSON selon le schéma fourni. Sois précis et constructif dans tes suggestions.`

export async function validateStatutsData(data: StatutsData): Promise<AIValidationResult> {
  const cacheKey = `validation_${JSON.stringify(data)}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Analyse les statuts EURL suivants et valide leur cohérence et conformité :

DONNÉES DES STATUTS :
${JSON.stringify(data, null, 2)}

VALIDATION REQUISE :
1. Cohérence capital social vs apports
2. Présence des mentions obligatoires
3. Conformité légale française
4. Incohérences entre sections
5. Suggestions d'amélioration

Réponds en JSON selon le schéma de validation.`

    const result = await generateStructuredWithGPT5<AIValidationResult>(
      prompt,
      validationSchema,
      'validation'
    )

    if (!result.success) {
      return {
        isValid: false,
        errors: [{
          id: 'validation_error',
          type: 'error',
          message: `Erreur lors de la validation IA : ${result.error}`,
          severity: 'high'
        }],
        warnings: [],
        suggestions: [],
        score: 0
      }
    }

    return result.object
  }, CACHE_TTL.VALIDATION)
}

// Validation rapide pour des champs spécifiques
export async function validateField(
  fieldName: string, 
  value: any, 
  context: Partial<StatutsData>
): Promise<{ isValid: boolean; message?: string; suggestion?: string }> {
  const cacheKey = `field_validation_${fieldName}_${JSON.stringify({ value, context })}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Valide le champ "${fieldName}" avec la valeur "${value}" dans le contexte des statuts EURL suivants :

CONTEXTE :
${JSON.stringify(context, null, 2)}

RÈGLES DE VALIDATION :
- Capital social : doit être > 0, cohérent avec apports
- Durée : entre 1 et 99 ans
- Objet social : doit être précis et licite
- Siège social : adresse complète requise
- Associé unique : informations complètes requises
- Gérant : informations complètes si tiers

Réponds en JSON : {"isValid": boolean, "message": "string", "suggestion": "string"}`

    const result = await generateStructuredWithGPT5<{
      isValid: boolean
      message?: string
      suggestion?: string
    }>(prompt, {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        message: { type: 'string' },
        suggestion: { type: 'string' }
      },
      required: ['isValid']
    }, 'validation')

    if (!result.success) {
      return { isValid: false, message: 'Erreur de validation IA' }
    }

    return result.object
  }, CACHE_TTL.VALIDATION)
}

// Validation de cohérence entre sections
export async function validateConsistency(data: StatutsData): Promise<AIValidationError[]> {
  const cacheKey = `consistency_${JSON.stringify(data)}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Vérifie la cohérence entre les différentes sections des statuts EURL :

STATUTS :
${JSON.stringify(data, null, 2)}

VÉRIFICATIONS DE COHÉRENCE :
1. Capital social = somme des apports
2. Nombre de parts cohérent avec valeur nominale
3. Gérant = associé unique si spécifié
4. Durée cohérente avec durée mandat gérant
5. Exercice social cohérent avec durée société

Réponds en JSON avec un tableau d'erreurs de cohérence.`

    const result = await generateStructuredWithGPT5<{
      errors: AIValidationError[]
    }>(prompt, {
      type: 'object',
      properties: {
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              field: { type: 'string' },
              section: { type: 'string' },
              message: { type: 'string' },
              suggestion: { type: 'string' },
              severity: { type: 'string' }
            },
            required: ['id', 'type', 'message', 'severity']
          }
        }
      },
      required: ['errors']
    }, 'validation')

    if (!result.success) {
      return [{
        id: 'consistency_error',
        type: 'error',
        message: `Erreur lors de la vérification de cohérence : ${result.error}`,
        severity: 'high'
      }]
    }

    return result.object.errors
  }, CACHE_TTL.VALIDATION)
}

// Validation des clauses obligatoires
export async function validateMandatoryClauses(data: StatutsData): Promise<AIValidationError[]> {
  const cacheKey = `mandatory_clauses_${JSON.stringify(data)}`
  
  return withCache(cacheKey, async () => {
    const prompt = `Vérifie que toutes les clauses obligatoires pour une EURL sont présentes :

STATUTS :
${JSON.stringify(data, null, 2)}

CLAUSES OBLIGATOIRES EURL :
1. Dénomination sociale
2. Objet social
3. Siège social
4. Durée de la société
5. Capital social et répartition
6. Associé unique (identité complète)
7. Gérant (nomination et pouvoirs)
8. Exercice social
9. Modalités de dissolution
10. Formalités de publicité

Réponds en JSON avec un tableau d'erreurs pour les clauses manquantes.`

    const result = await generateStructuredWithGPT5<{
      errors: AIValidationError[]
    }>(prompt, {
      type: 'object',
      properties: {
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              field: { type: 'string' },
              section: { type: 'string' },
              message: { type: 'string' },
              suggestion: { type: 'string' },
              severity: { type: 'string' }
            },
            required: ['id', 'type', 'message', 'severity']
          }
        }
      },
      required: ['errors']
    }, 'validation')

    if (!result.success) {
      return [{
        id: 'mandatory_clauses_error',
        type: 'error',
        message: `Erreur lors de la vérification des clauses obligatoires : ${result.error}`,
        severity: 'high'
      }]
    }

    return result.object.errors
  }, CACHE_TTL.VALIDATION)
}
