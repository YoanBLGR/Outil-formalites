/**
 * Service pour récupérer le dictionnaire de données du Guichet Unique
 * Documentation : /api/data_dictionary/
 */

import { getGuichetUniqueConfig } from './guichet-unique-api'

/**
 * Structure d'une catégorie d'activité
 */
export interface GUCategoryActivity {
  completeCode: string
  precisionActivite: string | null
  precisionAutre: string | null
  formeExercice: string
  formeExerciceAgricoleApplicable: boolean
  label: string
  value: string
  subValues?: GUCategoryActivity[] | null
}

/**
 * Cache en mémoire pour éviter de refaire les appels API
 */
let categoryActivitiesCache: GUCategoryActivity[] | null = null

/**
 * Récupère les catégories d'activités depuis l'API GU
 */
export async function fetchCategoryActivities(): Promise<GUCategoryActivity[]> {
  // Retourner le cache si disponible
  if (categoryActivitiesCache) {
    return categoryActivitiesCache
  }

  const config = getGuichetUniqueConfig()
  if (!config) {
    throw new Error('Configuration du Guichet Unique manquante')
  }

  try {
    // En développement, utiliser le proxy Vite
    const isDev = import.meta.env.DEV
    const endpoint = isDev
      ? '/gu-api/data_dictionary/category_activities'
      : `${config.apiUrl}/api/data_dictionary/category_activities`

    console.log('📚 Récupération des catégories d\'activités depuis le GU...')

    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: isDev ? 'same-origin' : 'include',
    })

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`)
    }

    const categories: GUCategoryActivity[] = await response.json()
    
    console.log('✅ Catégories d\'activités récupérées:', categories.length, 'catégories')
    
    // Mettre en cache
    categoryActivitiesCache = categories
    
    return categories
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des catégories d\'activités:', error)
    throw error
  }
}

/**
 * Récupère les codes de catégorisation par défaut
 * 
 * FORMAT REQUIS: 4 champs de 2 chiffres chacun
 * Exemple: code complet "07040408" → cat1: "07", cat2: "04", cat3: "04", cat4: "08"
 */
export async function getDefaultCategorizationCodes(): Promise<{
  categorisationActivite1: string  // Niveau 1 (2 chiffres)
  categorisationActivite2: string  // Niveau 2 (2 chiffres)
  categorisationActivite3: string  // Niveau 3 (2 chiffres)
  categorisationActivite4: string  // Niveau 4 (2 chiffres)
}> {
  try {
    const categories = await fetchCategoryActivities()
    
    if (!categories || categories.length === 0) {
      console.warn('⚠️ Aucune catégorie d\'activité disponible depuis l\'API GU')
      console.warn('   Utilisation de codes de fallback standards')
      // Codes par défaut : 07-04-04-08 (Conseil aux entreprises)
      return {
        categorisationActivite1: '07',
        categorisationActivite2: '04',
        categorisationActivite3: '04',
        categorisationActivite4: '08',
      }
    }

    // Prendre les deux premières catégories et utiliser leurs completeCode
    const cat1 = categories[0]
    const cat2 = categories.length > 1 ? categories[1] : categories[0]

    // DEBUG: Afficher la structure des catégories
    console.log('🔍 Catégorie 1:', {
      value: cat1.value,
      completeCode: cat1.completeCode,
      label: cat1.label,
      formeExercice: cat1.formeExercice
    })
    console.log('🔍 Catégorie 2:', {
      value: cat2.value,
      completeCode: cat2.completeCode,
      label: cat2.label,
      formeExercice: cat2.formeExercice
    })

    // Extraire le completeCode et le parser en 4 parties
    // Format attendu de l'API: "07-04-04-08" ou "07040408"
    const completeCode = cat1.completeCode || '07-04-04-08'
    
    // Retirer les tirets et séparer en 4 parties de 2 chiffres
    const cleanCode = completeCode.replace(/-/g, '')
    
    // Vérifier que le code a bien 8 chiffres
    if (cleanCode.length !== 8) {
      console.warn('⚠️ Code invalide, utilisation du code par défaut 07040408')
      return {
        categorisationActivite1: '07',
        categorisationActivite2: '04',
        categorisationActivite3: '04',
        categorisationActivite4: '08',
      }
    }
    
    // Découper le code en 4 parties de 2 chiffres
    const cat1Code = cleanCode.substring(0, 2)
    const cat2Code = cleanCode.substring(2, 4)
    const cat3Code = cleanCode.substring(4, 6)
    const cat4Code = cleanCode.substring(6, 8)

    console.log('📋 Codes de catégorisation depuis l\'API GU:', {
      completeCode: `${cat1Code}-${cat2Code}-${cat3Code}-${cat4Code}`,
      label: cat1.label,
    })

    return {
      categorisationActivite1: cat1Code,
      categorisationActivite2: cat2Code,
      categorisationActivite3: cat3Code,
      categorisationActivite4: cat4Code,
    }
  } catch (error) {
    console.error('⚠️ Impossible de récupérer les catégories depuis l\'API GU:', error)
    console.error('   Utilisation de codes de fallback standards')
    // Codes de fallback : 07-04-04-08 (Conseil aux entreprises)
    return {
      categorisationActivite1: '07',
      categorisationActivite2: '04',
      categorisationActivite3: '04',
      categorisationActivite4: '08',
    }
  }
}

/**
 * Trouve une catégorie par son label ou description
 * Utile pour mapper automatiquement selon l'objet social
 */
export async function findCategoryByKeyword(keyword: string): Promise<GUCategoryActivity | null> {
  try {
    const categories = await fetchCategoryActivities()
    const lowerKeyword = keyword.toLowerCase()

    // Recherche dans les labels
    for (const category of categories) {
      if (category.label.toLowerCase().includes(lowerKeyword)) {
        return category
      }
      
      // Recherche dans les sous-catégories
      if (category.subValues) {
        for (const subCategory of category.subValues) {
          if (subCategory.label?.toLowerCase().includes(lowerKeyword)) {
            return subCategory
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error('❌ Erreur lors de la recherche de catégorie:', error)
    return null
  }
}

/**
 * Réinitialise le cache (utile pour les tests)
 */
export function clearCategoryActivitiesCache(): void {
  categoryActivitiesCache = null
}


