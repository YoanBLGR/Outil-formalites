/**
 * Service API pour le Guichet Unique INPI
 * Gère l'authentification, les requêtes et la création de formalités
 *
 * Documentation : https://guichet-unique.inpi.fr/api/swagger_ui/mandataire/
 *
 * ⚠️ IMPORTANT : Ce service est une base qui doit être ajustée en fonction
 * de la documentation complète de l'API (endpoints, formats, authentification).
 */

import type {
  GUConfig,
  GUCredentials,
  GUAuthToken,
  GUAuthResponse,
  GUFormaliteCreation,
  GUCreateFormalityResponse,
  GUGetFormalityResponse,
  GUError,
} from '../types/guichet-unique'
import { guLogger } from '../lib/gu-logger'
import { isTauriApp } from '../lib/utils'

/**
 * Récupère la fonction fetch appropriée selon l'environnement
 * En production Tauri, utilise l'API HTTP de Tauri pour éviter les problèmes CORS
 * En dev ou sur le web, utilise fetch natif
 */
async function getFetchFunction(): Promise<typeof fetch> {
  // Si on est dans Tauri, utiliser l'API HTTP de Tauri
  if (isTauriApp()) {
    try {
      guLogger.debug('FETCH', 'Utilisation de Tauri HTTP fetch')
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http')
      return tauriFetch
    } catch (error) {
      guLogger.warn('FETCH', 'Impossible d\'importer Tauri HTTP, fallback vers fetch natif', { error })
      return fetch
    }
  }
  
  // Sinon, utiliser fetch natif
  guLogger.debug('FETCH', 'Utilisation de fetch natif')
  return fetch
}

// ==============================================
// CONFIGURATION
// ==============================================

/**
 * Stockage des cookies de session (pour environnement Node.js)
 */
let sessionCookies: string[] = []

/**
 * Récupère une variable d'environnement (compatible navigateur et Node.js)
 */
function getEnvVar(name: string): string | undefined {
  // En mode navigateur (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name]
  }
  // En mode Node.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name]
  }
  return undefined
}

/**
 * Récupère la configuration depuis les variables d'environnement
 */
function getConfigFromEnv(): GUConfig | null {
  const apiUrl = getEnvVar('VITE_GU_API_URL')
  const username = getEnvVar('VITE_GU_USERNAME')
  const password = getEnvVar('VITE_GU_PASSWORD')
  const apiKey = getEnvVar('VITE_GU_API_KEY')

  if (!apiUrl) {
    return null
  }

  // Vérifier qu'on a au moins un mode d'authentification
  if (!username && !password && !apiKey) {
    return null
  }

  const credentials: GUCredentials = {}
  if (username) credentials.username = username
  if (password) credentials.password = password
  if (apiKey) credentials.apiKey = apiKey

  return {
    apiUrl,
    credentials,
    timeout: 30000, // 30 secondes
    retryAttempts: 3,
  }
}

// ==============================================
// GESTION DES TOKENS
// ==============================================

/**
 * Stockage en mémoire du token (pas de localStorage pour la sécurité)
 */
let currentToken: GUAuthToken | null = null

/**
 * Vérifie si un token est expiré ou va expirer dans les 5 prochaines minutes
 */
function isTokenExpired(token: GUAuthToken): boolean {
  const now = Date.now()
  const bufferTime = 5 * 60 * 1000 // 5 minutes
  return now >= token.expiresAt - bufferTime
}

/**
 * Stocke le token en mémoire
 */
function setToken(authResponse: GUAuthResponse): GUAuthToken {
  const token: GUAuthToken = {
    accessToken: authResponse.access_token,
    refreshToken: authResponse.refresh_token,
    tokenType: authResponse.token_type,
    expiresIn: authResponse.expires_in,
    expiresAt: Date.now() + authResponse.expires_in * 1000,
  }
  currentToken = token
  return token
}

/**
 * Récupère le token actuel
 */
function getToken(): GUAuthToken | null {
  return currentToken
}

/**
 * Supprime le token
 */
function clearToken(): void {
  currentToken = null
}

// ==============================================
// ERREURS PERSONNALISÉES
// ==============================================

export class GUApiError extends Error {
  statusCode?: number
  errors?: GUError[]

  constructor(
    message: string,
    statusCode?: number,
    errors?: GUError[]
  ) {
    super(message)
    this.name = 'GUApiError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

export class GUAuthenticationError extends GUApiError {
  constructor(message: string = 'Échec de l\'authentification au Guichet Unique') {
    super(message, 401)
    this.name = 'GUAuthenticationError'
  }
}

export class GUValidationError extends GUApiError {
  constructor(message: string, errors?: GUError[]) {
    super(message, 400, errors)
    this.name = 'GUValidationError'
  }
}

// ==============================================
// AUTHENTIFICATION
// ==============================================

/**
 * Authentifie l'utilisateur et récupère un token
 * Utilise l'endpoint /api/user/login/sso du Guichet Unique
 *
 * L'API GU peut retourner :
 * 1. Un token dans la réponse JSON → utiliser en header Authorization
 * 2. Un cookie HttpOnly → automatiquement géré par le navigateur
 */
async function authenticate(credentials: GUCredentials, apiUrl: string): Promise<GUAuthToken> {
  try {
    guLogger.info('AUTH', 'Début de l\'authentification au Guichet Unique')
    
    if (!credentials.username || !credentials.password) {
      guLogger.error('AUTH', 'Username et password requis')
      throw new GUAuthenticationError('Username et password requis')
    }

    // En développement, utiliser le proxy Vite pour éviter CORS
    // En production, utiliser l'URL directe
    const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
    const endpoint = isDev
      ? '/gu-api/user/login/sso'  // Via proxy Vite
      : `${apiUrl}/api/user/login/sso`  // URL directe

    guLogger.debug('AUTH', 'Configuration de l\'authentification', {
      endpoint,
      isDev,
      username: credentials.username,
      apiUrl,
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
    })

    console.log('🔐 Authentification au GU:', { endpoint, isDev, username: credentials.username })

    const requestBody = {
      username: credentials.username,
      password: '***' // Ne pas logger le password
    }
    
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
      credentials: (isDev ? 'same-origin' : 'include') as RequestCredentials, // same-origin pour proxy, include sinon
    }
    
    guLogger.debug('AUTH', 'Envoi de la requête d\'authentification', {
      endpoint,
      method: 'POST',
      headers: requestOptions.headers,
      body: requestBody,
      credentials: requestOptions.credentials,
      isTauri: isTauriApp(),
    })
    
    // Utiliser la bonne fonction fetch selon l'environnement
    const fetchFn = await getFetchFunction()
    const response = await fetchFn(endpoint, requestOptions)

    guLogger.debug('AUTH', 'Réponse reçue', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    })
    
    if (!response.ok) {
      guLogger.error('AUTH', `Erreur HTTP ${response.status}: ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
      })
      
      if (response.status === 401) {
        throw new GUAuthenticationError('Identifiants invalides')
      }
      if (response.status === 400) {
        throw new GUAuthenticationError('Format de requête invalide')
      }
      throw new GUApiError(
        `Erreur lors de l'authentification: ${response.statusText}`,
        response.status
      )
    }

    // Stocker les cookies de session (important pour Node.js)
    const setCookieHeaders = response.headers.get('set-cookie')
    if (setCookieHeaders) {
      // En Node.js, les cookies viennent dans un seul header
      sessionCookies = setCookieHeaders.split(',').map(c => c.trim().split(';')[0])
      guLogger.debug('AUTH', `${sessionCookies.length} cookies de session stockés`, { count: sessionCookies.length })
      console.log('🍪 Cookies de session stockés:', sessionCookies.length)
    } else {
      guLogger.debug('AUTH', 'Aucun cookie Set-Cookie dans la réponse')
    }

    // Essayer de lire la réponse comme JSON (comme le script Python)
    let data: any = {}
    try {
      const text = await response.text()
      guLogger.debug('AUTH', 'Corps de la réponse reçu', { 
        length: text.length,
        preview: text.substring(0, 200) 
      })
      
      if (text) {
        data = JSON.parse(text)
        guLogger.debug('AUTH', 'Réponse JSON parsée', { data })
      }
    } catch (parseError) {
      // Si le parsing JSON échoue, on continue avec un objet vide
      guLogger.warn('AUTH', 'Réponse non-JSON, utilisation des cookies', { 
        error: parseError instanceof Error ? parseError.message : 'Unknown error' 
      })
      console.log('⚠️ Réponse non-JSON, utilisation des cookies')
    }

    // Le token peut être dans le JSON (utilisateurs "API only")
    let accessToken = data.token

    if (accessToken) {
      guLogger.success('AUTH', 'Token JSON reçu')
      console.log('✅ Token JSON reçu')
      // Créer un objet GUAuthResponse compatible
      const authResponse: GUAuthResponse = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: data.expires_in || 3600, // Durée par défaut de 1h
      }
      return setToken(authResponse)
    } else {
      // Pas de token JSON : l'authentification se fait par cookie HttpOnly
      // Les cookies HttpOnly ne sont pas accessibles via document.cookie en JavaScript
      // mais ils sont automatiquement envoyés dans les requêtes suivantes par le navigateur
      guLogger.success('AUTH', 'Authentification par cookie (pas de token JSON)')
      console.log('✅ Authentification par cookie (pas de token JSON)')

      // Créer un token "virtuel" pour indiquer que l'auth est par cookie
      const authResponse: GUAuthResponse = {
        access_token: '__COOKIE_AUTH__', // Token spécial pour indiquer l'auth par cookie
        token_type: 'Cookie',
        expires_in: 3600,
      }
      return setToken(authResponse)
    }
  } catch (error) {
    if (error instanceof GUApiError) {
      guLogger.error('AUTH', 'Erreur API lors de l\'authentification', {}, error)
      throw error
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    guLogger.error('AUTH', `Erreur de connexion au Guichet Unique: ${errorMessage}`, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error
    }, error instanceof Error ? error : undefined)
    
    throw new GUApiError(
      `Erreur de connexion au Guichet Unique: ${errorMessage}`
    )
  }
}

/**
 * Rafraîchit le token d'authentification
 * TODO: Adapter selon le mode de refresh de l'API
 */
async function refreshToken(token: GUAuthToken, apiUrl: string): Promise<GUAuthToken> {
  if (!token.refreshToken) {
    throw new GUAuthenticationError('Pas de refresh token disponible')
  }

  try {
    // TODO: Adapter l'endpoint selon la documentation
    const endpoint = `${apiUrl}/auth/refresh`

    const fetchFn = await getFetchFunction()
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: token.refreshToken,
      }),
    })

    if (!response.ok) {
      clearToken()
      throw new GUAuthenticationError('Échec du rafraîchissement du token')
    }

    const authResponse: GUAuthResponse = await response.json()
    return setToken(authResponse)
  } catch (error) {
    clearToken()
    throw error
  }
}

// ==============================================
// REQUÊTES HTTP
// ==============================================

/**
 * Effectue une requête HTTP authentifiée à l'API GU
 */
async function apiRequest<T>(
  endpoint: string,
  config: GUConfig,
  options: RequestInit = {}
): Promise<T> {
  // Vérifier et obtenir un token valide
  let token = getToken()

  // Si pas de token ou token expiré, s'authentifier
  if (!token || isTokenExpired(token)) {
    token = await authenticate(config.credentials, config.apiUrl)
  }

  // Préparer les headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  // Ajouter l'Authorization header SEULEMENT si on a un vrai token (pas en mode cookie)
  if (token.accessToken !== '__COOKIE_AUTH__') {
    headers.Authorization = `${token.tokenType} ${token.accessToken}`
  } else if (sessionCookies.length > 0) {
    // En mode cookie, ajouter les cookies de session manuellement (pour Node.js)
    headers.Cookie = sessionCookies.join('; ')
  }

  // En développement, utiliser le proxy Vite
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
  let url: string
  if (isDev) {
    // Via proxy Vite : /gu-api/... -> /api/...
    // Si endpoint commence par /api/, l'enlever pour éviter /gu-api/api/
    const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint
    url = `/gu-api${cleanEndpoint}`
  } else {
    url = `${config.apiUrl}${endpoint}`
  }

  try {
    guLogger.debug('API', 'Requête API', {
      url,
      method: options.method || 'GET',
      headers,
      isTauri: isTauriApp(),
    })
    
    const fetchFn = await getFetchFunction()
    const response = await fetchFn(url, {
      ...options,
      headers,
      credentials: (isDev ? 'same-origin' : 'include') as RequestCredentials, // Important pour envoyer les cookies
      signal: AbortSignal.timeout(config.timeout || 30000),
    })

    // Si 401, essayer de rafraîchir le token une fois (seulement si on a un refresh token)
    if (response.status === 401 && token.refreshToken) {
      guLogger.debug('API', 'Token expiré, tentative de rafraîchissement')
      token = await refreshToken(token, config.apiUrl)

      // Mettre à jour le header Authorization si on a un vrai token
      if (token.accessToken !== '__COOKIE_AUTH__') {
        headers.Authorization = `${token.tokenType} ${token.accessToken}`
      } else if (sessionCookies.length > 0) {
        headers.Cookie = sessionCookies.join('; ')
      }

      // Réessayer la requête
      guLogger.debug('API', 'Retry de la requête avec nouveau token')
      const retryResponse = await fetchFn(url, {
        ...options,
        headers,
        credentials: (isDev ? 'same-origin' : 'include') as RequestCredentials,
        signal: AbortSignal.timeout(config.timeout || 30000),
      })

      if (!retryResponse.ok) {
        throw await handleErrorResponse(retryResponse)
      }

      return await retryResponse.json()
    }

    if (!response.ok) {
      throw await handleErrorResponse(response)
    }

    guLogger.debug('API', 'Réponse API reçue', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })
    
    // Retourner la réponse JSON
    return await response.json()
  } catch (error) {
    if (error instanceof GUApiError) {
      guLogger.error('API', 'Erreur API', {}, error)
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        guLogger.error('API', 'Timeout de la requête', {
          name: error.name,
          message: error.message,
        }, error)
        throw new GUApiError('La requête a expiré. Vérifiez votre connexion.')
      }
      guLogger.error('API', `Erreur réseau: ${error.message}`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }, error)
      throw new GUApiError(`Erreur réseau: ${error.message}`)
    }

    guLogger.error('API', 'Erreur inconnue lors de la requête', { error })
    throw new GUApiError('Erreur inconnue lors de la requête')
  }
}

/**
 * Gère les erreurs de réponse HTTP
 */
async function handleErrorResponse(response: Response): Promise<GUApiError> {
  let errorMessage = `Erreur ${response.status}: ${response.statusText}`
  let errors: GUError[] | undefined
  let errorData: any

  try {
    const text = await response.text()
    console.error('❌ Réponse d\'erreur du serveur GU:', text)

    try {
      errorData = JSON.parse(text)
      console.error('❌ Données d\'erreur parsées:', errorData)

      if (errorData.message) {
        errorMessage = errorData.message
      }
      if (errorData.errors) {
        errors = errorData.errors
      }
      // Autres formats possibles
      if (errorData.detail) {
        errorMessage = errorData.detail
      }
      if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch {
      // Pas du JSON, utiliser le texte brut
      if (text) {
        errorMessage = `${errorMessage}: ${text.substring(0, 500)}`
      }
    }
  } catch {
    // Si on ne peut pas lire la réponse, on garde le message par défaut
  }

  if (response.status === 400) {
    return new GUValidationError(errorMessage, errors)
  }

  if (response.status === 401 || response.status === 403) {
    return new GUAuthenticationError(errorMessage)
  }

  return new GUApiError(errorMessage, response.status, errors)
}

// ==============================================
// API PUBLIQUE
// ==============================================

/**
 * Vérifie si le service GU est configuré
 */
export function isGuichetUniqueConfigured(): boolean {
  return getConfigFromEnv() !== null
}

/**
 * Récupère la configuration actuelle
 */
export function getGuichetUniqueConfig(): GUConfig | null {
  return getConfigFromEnv()
}

/**
 * Teste la connexion au Guichet Unique
 * @returns true si la connexion et l'authentification fonctionnent
 */
export async function testConnection(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const config = getConfigFromEnv()
    if (!config) {
      return {
        success: false,
        error: 'Configuration du Guichet Unique manquante',
      }
    }

    await authenticate(config.credentials, config.apiUrl)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Nettoie un objet en supprimant les champs undefined et null
 * Supprime aussi les champs indésirables comme formeSociale pour les individus
 * Garde les chaînes vides car certains champs peuvent légitimement être vides
 * Utile pour éviter d'envoyer des champs invalides à l'API GU
 */
function cleanObject(obj: any, parentKey?: string): any {
  if (obj === null || obj === undefined) {
    return undefined // Retourner undefined pour qu'il soit filtré
  }

  if (Array.isArray(obj)) {
    const cleaned = obj.map((item) => cleanObject(item, parentKey)).filter((item) => item !== undefined)
    return cleaned.length > 0 ? cleaned : undefined
  }

  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = cleanObject(obj[key], key)
        // Ne pas ajouter les valeurs undefined ou null
        // GARDER les chaînes vides '' car elles peuvent être valides
        if (value !== undefined) {
          cleaned[key] = value
        }
      }
    }
    // Si l'objet est vide après nettoyage, retourner undefined
    return Object.keys(cleaned).length > 0 ? cleaned : undefined
  }

  return obj
}

/**
 * Crée une nouvelle formalité sur le Guichet Unique
 * Documentation : Section 3.3 - Envoi d'une nouvelle formalité
 * Endpoint : POST /formalities
 */
export async function createDraftFormality(
  formalityData: GUFormaliteCreation
): Promise<GUCreateFormalityResponse> {
  const config = getConfigFromEnv()
  if (!config) {
    throw new GUApiError('Configuration du Guichet Unique manquante')
  }

  try {
    // Endpoint officiel : POST /api/formalities
    const endpoint = '/api/formalities'

    console.log('📤 Envoi de la formalité au GU:', {
      companyName: formalityData.companyName,
      typeFormalite: formalityData.typeFormalite,
    })

    // Nettoyer la formalité pour supprimer les champs undefined/null/vides
    const cleanedData = cleanObject(formalityData)

    // Logger la structure complète pour debug
    console.log('🔍 Structure complète envoyée:', JSON.stringify(cleanedData, null, 2))

    const response = await apiRequest<GUCreateFormalityResponse>(endpoint, config, {
      method: 'POST',
      body: JSON.stringify(cleanedData),
    })

    console.log('✅ Formalité créée:', response)

    return response
  } catch (error) {
    if (error instanceof GUApiError) {
      throw error
    }
    throw new GUApiError(
      `Erreur lors de la création de la formalité: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    )
  }
}

/**
 * Récupère une formalité existante
 * TODO: Adapter l'endpoint selon la documentation
 */
export async function getFormality(formalityId: string): Promise<GUGetFormalityResponse> {
  const config = getConfigFromEnv()
  if (!config) {
    throw new GUApiError('Configuration du Guichet Unique manquante')
  }

  try {
    // TODO: Adapter l'endpoint selon la documentation
    const endpoint = `/formalities/${formalityId}`

    const response = await apiRequest<GUGetFormalityResponse>(endpoint, config, {
      method: 'GET',
    })

    return response
  } catch (error) {
    if (error instanceof GUApiError) {
      throw error
    }
    throw new GUApiError(
      `Erreur lors de la récupération de la formalité: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    )
  }
}

/**
 * Met à jour une formalité en brouillon
 * TODO: Adapter l'endpoint selon la documentation
 */
export async function updateFormality(
  formalityId: string,
  formalityData: Partial<GUFormaliteCreation>
): Promise<GUCreateFormalityResponse> {
  const config = getConfigFromEnv()
  if (!config) {
    throw new GUApiError('Configuration du Guichet Unique manquante')
  }

  try {
    // TODO: Adapter l'endpoint selon la documentation
    const endpoint = `/formalities/${formalityId}`

    const response = await apiRequest<GUCreateFormalityResponse>(endpoint, config, {
      method: 'PATCH',
      body: JSON.stringify(formalityData),
    })

    return response
  } catch (error) {
    if (error instanceof GUApiError) {
      throw error
    }
    throw new GUApiError(
      `Erreur lors de la mise à jour de la formalité: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    )
  }
}

/**
 * Supprime (annule) une formalité en brouillon
 * TODO: Adapter l'endpoint selon la documentation
 */
export async function deleteFormality(formalityId: string): Promise<void> {
  const config = getConfigFromEnv()
  if (!config) {
    throw new GUApiError('Configuration du Guichet Unique manquante')
  }

  try {
    // TODO: Adapter l'endpoint selon la documentation
    const endpoint = `/formalities/${formalityId}`

    await apiRequest<void>(endpoint, config, {
      method: 'DELETE',
    })
  } catch (error) {
    if (error instanceof GUApiError) {
      throw error
    }
    throw new GUApiError(
      `Erreur lors de la suppression de la formalité: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    )
  }
}

/**
 * Déconnecte l'utilisateur (supprime le token)
 */
export function logout(): void {
  clearToken()
}
