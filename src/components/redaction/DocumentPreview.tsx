import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Download, Eye, ChevronDown, FileText, File } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface DocumentPreviewProps {
  content: string
  onExport: (format: 'docx' | 'pdf') => void
  isGenerating?: boolean
  activeSection?: string
  activeField?: {
    name: string
    value: string
    context?: string
  }
}

export interface DocumentPreviewRef {
  scrollToSection: (sectionId: string) => void
}

export const DocumentPreview = forwardRef<DocumentPreviewRef, DocumentPreviewProps>(
  ({ content, onExport, isGenerating = false, activeSection, activeField }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const articleRefs = useRef<Map<string, HTMLElement>>(new Map())
  const highlightedElementRef = useRef<HTMLElement | null>(null)

  // Expose scrollToSection method to parent
  useImperativeHandle(ref, () => ({
    scrollToSection: (sectionId: string) => {
      const element = articleRefs.current.get(sectionId)
      if (element && containerRef.current) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }
    }
  }))

  // Auto-scroll et highlight quand activeField change
  useEffect(() => {
    if (activeField && containerRef.current) {
      // Petit délai pour s'assurer que le DOM est à jour
      const timeoutId = setTimeout(() => {
        const container = containerRef.current
        if (!container) return

        // Si pas de valeur, ne rien faire
        if (!activeField.value) {
          highlightedElementRef.current = null
          return
        }

        // Nettoyer la valeur pour la recherche
        const searchValue = activeField.value.trim()
        if (!searchValue) {
          highlightedElementRef.current = null
          return
        }

        // Définir la zone de recherche (tout le container par défaut)
        let searchRoot: HTMLElement = container

        // Si on a un contexte, essayer de limiter la recherche à cette zone
        if (activeField.context) {
          const contextLower = activeField.context.toLowerCase()
          
          // Chercher l'élément qui contient le contexte
          const allElements = container.querySelectorAll('h2, h3, h4, p, div')
          for (const element of Array.from(allElements)) {
            const textContent = element.textContent?.toLowerCase() || ''
            if (textContent.includes(contextLower)) {
              // Utiliser le parent de cet élément comme zone de recherche
              // ou l'élément lui-même s'il a des enfants
              searchRoot = element.parentElement as HTMLElement || element as HTMLElement
              break
            }
          }
        }

        // Chercher tous les éléments de texte dans la zone définie
        const walker = document.createTreeWalker(
          searchRoot,
          NodeFilter.SHOW_TEXT,
          null
        )

        let foundNode: Node | null = null
        let bestMatch: { node: Node; score: number } | null = null

        while (walker.nextNode()) {
          const node = walker.currentNode
          if (node.textContent) {
            // Recherche case-insensitive
            const textLower = node.textContent.toLowerCase()
            const searchLower = searchValue.toLowerCase()
            
            // Vérifier si le texte contient la valeur recherchée
            if (textLower.includes(searchLower)) {
              // Score basé sur la position dans le texte (plus tôt = meilleur)
              const index = textLower.indexOf(searchLower)
              const score = 1000 - index // Score plus élevé si trouvé plus tôt
              
              if (!bestMatch || score > bestMatch.score) {
                bestMatch = { node, score }
              }
            }
          }
        }

        if (bestMatch && bestMatch.node.parentElement) {
          // Scroller vers l'élément
          bestMatch.node.parentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })
          
          highlightedElementRef.current = bestMatch.node.parentElement
        } else {
          highlightedElementRef.current = null
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    } else {
      highlightedElementRef.current = null
    }
  }, [activeField])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Prévisualisation</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isGenerating} size="sm">
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Génération...' : 'Exporter'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('docx')}>
              <FileText className="mr-2 h-4 w-4" />
              Exporter en DOCX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')}>
              <File className="mr-2 h-4 w-4" />
              Exporter en PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-8 bg-background scroll-smooth">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-12">
            <div
              id="document-preview-content"
              className="prose prose-sm max-w-none"
              style={{
                fontFamily: 'Georgia, serif',
                lineHeight: '1.8',
              }}
            >
              {(() => {
                const lines = content.split('\n')
                const elements: React.ReactElement[] = []
                let currentArticleId: string | null = null
                let currentArticleLines: string[] = []
                let currentArticleIndex = 0
                let inEnTete = true // Flag pour détecter l'en-tête
                let enTeteLines: string[] = []

                // Fonction helper pour appliquer le highlight
                const applyHighlight = (text: string) => {
                  if (!activeField || !activeField.value || !text) return text

                  const searchValue = activeField.value.trim()
                  if (!searchValue) return text

                  const index = text.toLowerCase().indexOf(searchValue.toLowerCase())
                  if (index === -1) return text

                  const before = text.substring(0, index)
                  const highlighted = text.substring(index, index + searchValue.length)
                  const after = text.substring(index + searchValue.length)

                  return (
                    <>
                      {before}
                      <mark className="bg-blue-400/30 dark:bg-blue-500/40 text-inherit px-1 rounded-sm animate-in fade-in duration-300">
                        {highlighted}
                      </mark>
                      {after}
                    </>
                  )
                }

                const flushEnTete = () => {
                  if (enTeteLines.length > 0) {
                    elements.push(
                      <div key="entete" className="text-center mb-12 pb-6 border-b-2 border-border">
                        {enTeteLines.map((line, idx) => {
                          // Première ligne = dénomination (en gras et plus grande)
                          if (idx === 0 && line.trim() !== '') {
                            return (
                              <h1 key={idx} className="text-lg font-bold uppercase mb-4 tracking-wide">
                                {applyHighlight(line)}
                              </h1>
                            )
                          }
                          // Autres lignes de l'en-tête
                          if (line.trim() === '') {
                            return <div key={idx} className="h-2" />
                          }
                          return (
                            <p key={idx} className="text-sm mb-1 font-medium text-muted-foreground">
                              {applyHighlight(line)}
                            </p>
                          )
                        })}
                      </div>
                    )
                    enTeteLines = []
                    inEnTete = false
                  }
                }

                const flushArticle = () => {
                  if (currentArticleId && currentArticleLines.length > 0) {
                    const isActive = activeSection === currentArticleId
                    const articleId = currentArticleId // Capture the ID in a local variable
                    const articleElement = (
                      <div
                        key={`article-${currentArticleIndex}`}
                        ref={(el) => {
                          if (el && articleId) {
                            articleRefs.current.set(articleId, el)
                            console.log('📌 Ref created for:', articleId)
                          }
                        }}
                        className={`relative transition-all duration-300 rounded ${
                          isActive ? 'bg-blue-50/80 dark:bg-blue-900/30 px-4 py-3 border-l-4 border-blue-500 shadow-sm' : 'px-1 py-1'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute -top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                            ✏️ En cours d'édition
                          </div>
                        )}
                        {currentArticleLines.map((line, idx) => {
                          if (line.startsWith('ARTICLE')) {
                            return (
                              <h2 key={idx} className="text-base font-bold mt-8 mb-4 uppercase">
                                {applyHighlight(line)}
                              </h2>
                            )
                          }
                          if (line.trim() === '') {
                            return <div key={idx} className="h-4" />
                          }
                          return (
                            <p key={idx} className="text-sm mb-4 text-justify">
                              {applyHighlight(line)}
                            </p>
                          )
                        })}
                      </div>
                    )
                    elements.push(articleElement)
                    currentArticleLines = []
                    currentArticleIndex++
                  }
                }

                lines.forEach((line, index) => {
                  // Collecte de l'en-tête (avant "Le soussigné")
                  if (inEnTete && !line.includes('Le soussigné') && !line.includes('STATUTS')) {
                    enTeteLines.push(line)
                    return
                  }

                  // Fin de l'en-tête détectée
                  if (inEnTete && (line.includes('Le soussigné') || line.includes('STATUTS'))) {
                    flushEnTete()
                  }

                  // Titre principal (préambule)
                  if (line.includes('STATUTS')) {
                    flushArticle()
                    const isActive = activeSection === 'preambule'
                    elements.push(
                      <div
                        key={`preambule-${index}`}
                        ref={(el) => {
                          if (el) articleRefs.current.set('preambule', el)
                        }}
                        className={`relative transition-all duration-300 rounded ${
                          isActive ? 'bg-blue-50/80 dark:bg-blue-900/30 px-4 py-3 border-l-4 border-blue-500 shadow-sm' : 'px-1 py-1'
                        }`}
                      >
                        <h1
                          className="text-center text-xl font-bold mb-8 uppercase"
                          style={{ textDecoration: 'underline' }}
                        >
                          {line}
                        </h1>
                      </div>
                    )
                    return
                  }

                  // Début d'un nouvel article
                  if (line.startsWith('ARTICLE')) {
                    flushArticle()
                    const match = line.match(/ARTICLE\s+(\d+)/)
                    const articleNum = match ? match[1] : null
                    currentArticleId = articleNum ? `article-${articleNum}` : `article-${index}`
                    currentArticleLines = [line]
                    return
                  }

                  // Contenu d'un article en cours
                  if (currentArticleId) {
                    currentArticleLines.push(line)
                    return
                  }

                  // Lignes avant le premier article (préambule)
                  if (line.trim() === '') {
                    elements.push(<div key={index} className="h-4" />)
                  } else {
                    const isPreambuleActive = activeSection === 'preambule'
                    elements.push(
                      <p
                        key={index}
                        className={`text-sm mb-4 text-justify transition-all duration-300 ${
                          isPreambuleActive ? 'bg-blue-100/50 dark:bg-blue-900/20 px-4 py-2 rounded' : ''
                        }`}
                      >
                        {line}
                      </p>
                    )
                  }
                })

                // Flush dernier article
                flushArticle()

                return elements
              })()}

              {!content && (
                <div className="text-center py-20 text-muted-foreground">
                  <Eye className="mx-auto h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg">La prévisualisation apparaîtra ici</p>
                  <p className="text-sm mt-2">Complétez le formulaire pour générer le document</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

DocumentPreview.displayName = 'DocumentPreview'
