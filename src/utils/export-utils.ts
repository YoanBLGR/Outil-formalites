import { 
  Document, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  HeadingLevel, 
  Packer, 
  PageNumber,
  Footer,
  Header,
  UnderlineType,
} from 'docx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'

/**
 * Type d'export disponible
 */
export type ExportFormat = 'docx' | 'pdf'

/**
 * Options d'export
 */
export interface ExportOptions {
  filename: string
  format: ExportFormat
}

/**
 * Exporte le contenu des statuts au format DOCX avec formatage professionnel
 */
export async function exportToDocx(content: string, filename: string): Promise<void> {
  try {
    // Parse le contenu pour créer les sections du document
    const lines = content.split('\n')
    const paragraphs: Paragraph[] = []

    let isEnTete = true
    let enTeteLines: string[] = []
    let currentArticleNumber = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // Détection de la fin de l'en-tête
      if (isEnTete && (trimmedLine.includes('Le soussigné') || trimmedLine.includes('La soussignée') || trimmedLine.includes('STATUTS'))) {
        // Traiter l'en-tête collecté
        if (enTeteLines.length > 0) {
          enTeteLines.forEach((headerLine, idx) => {
            if (idx === 0 && headerLine !== '') {
              // Première ligne = dénomination en gras, centré (sans soulignement)
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: headerLine,
                      bold: true,
                      size: 32, // 16pt
                      allCaps: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 240 },
                })
              )
            } else if (headerLine !== '') {
              // Autres lignes de l'en-tête en gras
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: headerLine,
                      bold: true,
                      size: 24, // 12pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 120 },
                })
              )
            }
          })
          // Espace après l'en-tête
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '' })],
              spacing: { after: 480 },
            })
          )
        }
        isEnTete = false
      }

      // Collection de l'en-tête
      if (isEnTete && !trimmedLine.includes('STATUTS')) {
        enTeteLines.push(trimmedLine)
        continue
      }

      // Titre "STATUTS"
      if (trimmedLine.match(/^STATUTS\s*(DE|D')?\s*/i)) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                bold: true,
                size: 36, // 18pt
                allCaps: true,
                underline: {
                  type: UnderlineType.DOUBLE,
                },
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 480, after: 480 },
          })
        )
        continue
      }

      // Début d'un article
      if (trimmedLine.match(/^ARTICLE\s+\d+/i)) {
        currentArticleNumber++

        // Extraire le titre de l'article
        const articleMatch = trimmedLine.match(/^ARTICLE\s+\d+\s*[-–]\s*(.+)$/i)
        const articleTitle = articleMatch ? articleMatch[1] : trimmedLine

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `ARTICLE ${currentArticleNumber}`,
                bold: true,
                size: 28, // 14pt
                allCaps: true,
              }),
              new TextRun({
                text: ` - ${articleTitle.replace(/^ARTICLE\s+\d+\s*[-–]\s*/i, '')}`,
                bold: true,
                size: 28, // 14pt
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 160 },
            keepNext: true, // Empêche le titre d'être séparé du contenu suivant
          })
        )
        continue
      }

      // Lignes vides - réduire l'espacement entre les paragraphes
      if (trimmedLine === '') {
        // Ne pas ajouter trop d'espaces vides consécutifs
        if (paragraphs.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '' })],
              spacing: { after: 80 },
            })
          )
        }
        continue
      }

      // Détection des listes (lignes commençant par -, •, ou un nombre suivi de .)
      const isBulletPoint = trimmedLine.match(/^[-•]\s+/)
      const isNumberedList = trimmedLine.match(/^\d+\.\s+/)

      if (isBulletPoint || isNumberedList) {
        // Garder le texte avec le symbole pour compatibilité maximale
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120 },
            indent: { left: 720 }, // Indentation à gauche
          })
        )
        continue
      }

      // Contenu normal avec justification
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { 
            after: 160,
            line: 360, // Interligne 1.5
          },
        })
      )
    }

    // Créer le document avec en-tête et pied de page compatibles Word Windows
    const doc = new Document({
      creator: 'Formalyse',
      description: 'Statuts générés par Formalyse',
      title: `Statuts - ${filename.split('_')[1] || 'Société'}`,
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch = 1440 twips
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Statuts - ${filename.split('_')[1] || 'Société'}`,
                      size: 18,
                      color: '666666',
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 120 },
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Page ',
                      size: 18,
                      color: '666666',
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 18,
                      color: '666666',
                    }),
                    new TextRun({
                      text: ' sur ',
                      size: 18,
                      color: '666666',
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      size: 18,
                      color: '666666',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 120 },
                }),
              ],
            }),
          },
          children: paragraphs,
        },
      ],
    })

    // Générer et télécharger
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${filename}.docx`)
  } catch (error) {
    console.error('Erreur lors de l\'export DOCX:', error)
    throw new Error('Impossible de générer le fichier DOCX')
  }
}

/**
 * Exporte le contenu des statuts au format PDF professionnel avec texte natif
 */
export async function exportToPdf(content: string, filename: string): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Dimensions A4 en mm
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const contentWidth = pageWidth - 2 * margin
    
    let currentY = margin
    let currentPage = 1

    // Fonction pour ajouter un en-tête de page
    const addPageHeader = (pageNum: number) => {
      if (pageNum > 1) {
        pdf.setFontSize(9)
        pdf.setTextColor(100, 100, 100)
        pdf.text(`Statuts - ${filename.split('_')[1] || 'Société'}`, pageWidth - margin, margin - 10, { align: 'right' })
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, margin - 5, pageWidth - margin, margin - 5)
      }
    }

    // Fonction pour ajouter un pied de page
    const addPageFooter = (pageNum: number, totalPages: number) => {
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Page ${pageNum} sur ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
    }

    // Fonction pour vérifier si on doit ajouter une nouvelle page
    const checkNewPage = (requiredSpace: number = 10): boolean => {
      if (currentY + requiredSpace > pageHeight - margin - 20) {
        pdf.addPage()
        currentPage++
        currentY = margin + 10
        addPageHeader(currentPage)
        return true
      }
      return false
    }

    // Parse le contenu
    const lines = content.split('\n')
    let isEnTete = true
    let enTeteLines: string[] = []
    let totalPages = 1 // On calculera le vrai nombre après

    // Premier passage : compter les pages approximativement
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine === '') continue
      
      const estimatedHeight = trimmedLine.match(/^ARTICLE\s+\d+/i) ? 15 : 
                              trimmedLine.match(/^STATUTS/i) ? 20 : 7
      
      if (currentY + estimatedHeight > pageHeight - margin - 20) {
        totalPages++
        currentY = margin + 10
      }
      currentY += estimatedHeight
    }

    // Réinitialiser pour le vrai rendu
    currentY = margin
    currentPage = 1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // Détection de la fin de l'en-tête
      if (isEnTete && (trimmedLine.includes('Le soussigné') || trimmedLine.includes('La soussignée') || trimmedLine.includes('STATUTS'))) {
        // Traiter l'en-tête collecté
        if (enTeteLines.length > 0) {
          enTeteLines.forEach((headerLine, idx) => {
            if (headerLine !== '') {
              checkNewPage(10)
              if (idx === 0) {
                // Première ligne = dénomination en gras, centré (sans soulignement)
                pdf.setFontSize(16)
                pdf.setFont('helvetica', 'bold')
                pdf.text(headerLine.toUpperCase(), pageWidth / 2, currentY, { align: 'center' })
                currentY += 8
              } else {
                // Autres lignes de l'en-tête en gras
                pdf.setFontSize(12)
                pdf.setFont('helvetica', 'bold')
                pdf.text(headerLine, pageWidth / 2, currentY, { align: 'center' })
                currentY += 6
              }
            }
          })
          currentY += 10 // Espace après l'en-tête
        }
        isEnTete = false
      }

      // Collection de l'en-tête
      if (isEnTete && !trimmedLine.includes('STATUTS')) {
        enTeteLines.push(trimmedLine)
        continue
      }

      // Titre "STATUTS"
      if (trimmedLine.match(/^STATUTS\s*(DE|D')?\s*/i)) {
        checkNewPage(25)
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(46, 80, 144)
        pdf.text(trimmedLine.toUpperCase(), pageWidth / 2, currentY, { align: 'center' })
        currentY += 5
        pdf.setDrawColor(46, 80, 144)
        pdf.setLineWidth(1)
        pdf.line(margin + 30, currentY, pageWidth - margin - 30, currentY)
        pdf.line(margin + 30, currentY + 1, pageWidth - margin - 30, currentY + 1)
        currentY += 12
        pdf.setTextColor(0, 0, 0)
        continue
      }

      // Début d'un article
      if (trimmedLine.match(/^ARTICLE\s+\d+/i)) {
        // Vérifier qu'il reste au moins 35mm pour le titre + quelques lignes de contenu
        checkNewPage(35)
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(46, 80, 144)
        pdf.text(trimmedLine.toUpperCase(), margin, currentY)
        currentY += 5
        pdf.setDrawColor(46, 80, 144)
        pdf.setLineWidth(0.3)
        pdf.line(margin, currentY, pageWidth - margin, currentY)
        currentY += 8
        pdf.setTextColor(0, 0, 0)
        continue
      }

      // Lignes vides
      if (trimmedLine === '') {
        currentY += 4
        continue
      }

      // Contenu normal
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)

      // Découper le texte en lignes pour qu'il tienne dans la largeur
      const textLines = pdf.splitTextToSize(trimmedLine, contentWidth)
      
      for (const textLine of textLines) {
        checkNewPage(7)
        pdf.text(textLine, margin, currentY, { align: 'justify', maxWidth: contentWidth })
        currentY += 6
      }
      currentY += 2 // Petit espace après chaque paragraphe
    }

    // Ajouter les pieds de page à toutes les pages
    for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
      pdf.setPage(page)
      if (page > 1) {
        addPageHeader(page)
      }
      addPageFooter(page, pdf.getNumberOfPages())
    }

    // Télécharger le PDF
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
    throw new Error('Impossible de générer le fichier PDF')
  }
}

/**
 * Export générique qui route vers la bonne fonction selon le format
 */
export async function exportStatuts(
  content: string,
  format: ExportFormat,
  filename: string
): Promise<void> {
  switch (format) {
    case 'docx':
      await exportToDocx(content, filename)
      break
    case 'pdf':
      await exportToPdf(content, filename)
      break
    default:
      throw new Error(`Format d'export non supporté: ${format}`)
  }
}
