import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer } from 'docx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
 * Exporte le contenu des statuts au format DOCX
 */
export async function exportToDocx(content: string, filename: string): Promise<void> {
  try {
    // Parse le contenu pour créer les sections du document
    const lines = content.split('\n')
    const paragraphs: Paragraph[] = []

    let isEnTete = true
    let isPreambule = false
    let enTeteLines: string[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Détection de la fin de l'en-tête
      if (isEnTete && (trimmedLine.includes('Le soussigné') || trimmedLine.includes('STATUTS'))) {
        // Traiter l'en-tête collecté
        if (enTeteLines.length > 0) {
          enTeteLines.forEach((headerLine, idx) => {
            if (idx === 0 && headerLine !== '') {
              // Première ligne = dénomination en gras et centré
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: headerLine,
                      bold: true,
                      size: 28, // 14pt
                      allCaps: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 },
                })
              )
            } else if (headerLine !== '') {
              // Autres lignes de l'en-tête
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: headerLine,
                      size: 22, // 11pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 },
                })
              )
            }
          })
          // Ligne de séparation (paragraphe vide avec espacement)
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '' })],
              spacing: { after: 400 },
              border: {
                bottom: {
                  color: '000000',
                  space: 1,
                  style: 'single',
                  size: 6,
                },
              },
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
      if (trimmedLine.includes('STATUTS')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                bold: true,
                size: 32, // 16pt
                allCaps: true,
                underline: {},
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 320, after: 320 },
          })
        )
        isPreambule = true
        continue
      }

      // Début d'un article
      if (trimmedLine.startsWith('ARTICLE')) {
        isPreambule = false
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                bold: true,
                size: 24, // 12pt
                allCaps: true,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 320, after: 100 },
          })
        )
        continue
      }

      // Lignes vides
      if (trimmedLine === '') {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { after: 120 },
          })
        )
        continue
      }

      // Contenu normal
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt
            }),
          ],
          alignment: isPreambule ? AlignmentType.JUSTIFIED : AlignmentType.JUSTIFIED,
          spacing: { after: 140 },
        })
      )
    }

    // Créer le document
    const doc = new Document({
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
 * Exporte le contenu des statuts au format PDF
 * Utilise html2canvas pour capturer le rendu visuel
 */
export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Élément non trouvé pour l\'export PDF')
    }

    // Capturer l'élément en canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Augmente la qualité
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Dimensions A4 en mm
    const pdfWidth = 210
    const pdfHeight = 297

    // Calculer les dimensions de l'image pour qu'elle tienne sur la page
    const imgWidth = pdfWidth - 20 // Marges de 10mm de chaque côté
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Calculer le nombre de pages nécessaires
    let heightLeft = imgHeight
    let position = 10 // Marge du haut

    // Première page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight - 20 // 20mm de marges (haut + bas)

    // Pages suivantes si nécessaire
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight - 20
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
  filename: string,
  elementId?: string
): Promise<void> {
  switch (format) {
    case 'docx':
      await exportToDocx(content, filename)
      break
    case 'pdf':
      if (!elementId) {
        throw new Error('elementId requis pour l\'export PDF')
      }
      await exportToPdf(elementId, filename)
      break
    default:
      throw new Error(`Format d'export non supporté: ${format}`)
  }
}
