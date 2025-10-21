import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  PageNumber,
  Footer,
  Header,
} from 'docx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'

/**
 * Type d'export disponible
 */
export type ExportFormat = 'docx' | 'pdf'

/**
 * Exporte le mandat CCI au format DOCX
 */
export async function exportMandatToDocx(
  mandatContent: string,
  filename: string
): Promise<void> {
  try {
    const lines = mandatContent.split('\n')
    const paragraphs: Paragraph[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // Titre principal "MANDAT"
      if (trimmedLine === 'MANDAT') {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                bold: true,
                size: 32, // 16pt
                allCaps: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          })
        )
        continue
      }

      // Sous-titre "Pour la réalisation..."
      if (trimmedLine.startsWith('Pour la réalisation des formalités')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 20, // 10pt
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          })
        )
        continue
      }

      // Section "Je soussigné"
      if (trimmedLine.startsWith('Je soussigné')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
              }),
            ],
            spacing: { before: 120, after: 120 },
          })
        )
        continue
      }

      // Sections avec "Domiciliée à", "Agissant en qualité"
      if (
        trimmedLine.startsWith('Domiciliée à') ||
        trimmedLine.startsWith('Agissant en qualité')
      ) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
              }),
            ],
            spacing: { after: 120 },
          })
        )
        continue
      }

      // Section "CCI Oise" (bloc centré)
      if (
        trimmedLine === 'CCI Oise' ||
        trimmedLine.startsWith('Pôle Démarches') ||
        trimmedLine.startsWith('N° Siret') ||
        trimmedLine.startsWith('18 rue') ||
        trimmedLine === '60000 BEAUVAIS'
      ) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
                bold: trimmedLine === 'CCI Oise',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 40 },
          })
        )
        continue
      }

      // Paragraphe principal "Donne pouvoir"
      if (trimmedLine.startsWith('Donne pouvoir')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 240, after: 120 },
          })
        )
        continue
      }

      // Cases à cocher (☒ et ☐)
      if (trimmedLine.startsWith('☒') || trimmedLine.startsWith('☐')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
              }),
            ],
            spacing: { after: 80 },
          })
        )
        continue
      }

      // Liste à puces
      if (trimmedLine.startsWith('- ')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 80 },
            indent: { left: 720 }, // Indentation
          })
        )
        continue
      }

      // Paragraphe "Le présent mandat prend effet"
      if (trimmedLine.startsWith('Le présent mandat prend effet')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 240, after: 240 },
          })
        )
        continue
      }

      // Sections RGPD longues
      if (
        trimmedLine.startsWith('En qualité de responsable de traitement') ||
        trimmedLine.startsWith('Vos données de contact') ||
        trimmedLine.startsWith('Si vous l\'acceptez') ||
        trimmedLine.startsWith('Conformément à la règlementation') ||
        trimmedLine.startsWith('Pour plus d\'informations')
      ) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 18, // 9pt (plus petit pour la section légale)
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 120, after: 120 },
          })
        )
        continue
      }

      // Date et lieu "Fait à"
      if (trimmedLine.startsWith('Fait à')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
              }),
            ],
            spacing: { before: 360, after: 360 },
          })
        )
        continue
      }

      // Signature
      if (trimmedLine.startsWith('Signature')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 22, // 11pt
                bold: true,
              }),
            ],
            spacing: { before: 240, after: 120 },
          })
        )
        continue
      }

      // Note signature
      if (trimmedLine.includes('Bon pour pouvoir')) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 20, // 10pt
                italics: true,
              }),
            ],
            spacing: { after: 120 },
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
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        })
      )
    }

    // Créer le document avec métadonnées complètes (compatibilité Word Windows)
    const doc = new Document({
      creator: 'Formalyse',
      description: 'Mandat CCI généré par Formalyse',
      title: `Mandat CCI - ${filename}`,
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
                      text: 'Mandat CCI',
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
    console.error('Erreur lors de l\'export DOCX du mandat:', error)
    throw new Error('Impossible d\'exporter le mandat au format DOCX')
  }
}

/**
 * Exporte le mandat CCI au format PDF
 */
export async function exportMandatToPdf(
  mandatContent: string,
  filename: string
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 25
    const contentWidth = pageWidth - 2 * margin
    let yPosition = margin

    // Fonction pour ajouter une nouvelle page si nécessaire
    const checkNewPage = (requiredSpace: number = 15) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
        
        // En-tête sur nouvelle page
        pdf.setFontSize(9)
        pdf.setTextColor(100, 100, 100)
        pdf.text('Mandat CCI', pageWidth - margin, margin / 2, { align: 'right' })
        pdf.setTextColor(0, 0, 0)
        yPosition = margin + 10
      }
    }

    // En-tête première page
    pdf.setFontSize(9)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Mandat CCI', pageWidth - margin, margin / 2, { align: 'right' })
    pdf.setTextColor(0, 0, 0)

    const lines = mandatContent.split('\n')

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (!trimmedLine) {
        yPosition += 5
        continue
      }

      // Titre "MANDAT"
      if (trimmedLine === 'MANDAT') {
        checkNewPage(20)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text(trimmedLine, pageWidth / 2, yPosition, { align: 'center' })
        yPosition += 8
        continue
      }

      // Sous-titre "Pour la réalisation..."
      if (trimmedLine.startsWith('Pour la réalisation des formalités')) {
        checkNewPage(15)
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        const textLines = pdf.splitTextToSize(trimmedLine, contentWidth)
        pdf.text(textLines, pageWidth / 2, yPosition, { align: 'center' })
        yPosition += textLines.length * 5 + 10
        continue
      }

      // Sections importantes
      if (
        trimmedLine.startsWith('Je soussigné') ||
        trimmedLine.startsWith('Domiciliée à') ||
        trimmedLine.startsWith('Agissant en qualité')
      ) {
        checkNewPage(10)
        pdf.setFontSize(11)
        const textLines = pdf.splitTextToSize(trimmedLine, contentWidth)
        pdf.text(textLines, margin, yPosition)
        yPosition += textLines.length * 6 + 3
        continue
      }

      // Section CCI Oise
      if (
        trimmedLine === 'CCI Oise' ||
        trimmedLine.startsWith('Pôle Démarches') ||
        trimmedLine.startsWith('N° Siret') ||
        trimmedLine.startsWith('18 rue') ||
        trimmedLine === '60000 BEAUVAIS' ||
        trimmedLine.startsWith('Représentée par')
      ) {
        checkNewPage(8)
        pdf.setFontSize(11)
        if (trimmedLine === 'CCI Oise') pdf.setFont('helvetica', 'bold')
        pdf.text(trimmedLine, margin, yPosition)
        if (trimmedLine === 'CCI Oise') pdf.setFont('helvetica', 'normal')
        yPosition += 6
        continue
      }

      // Cases à cocher
      if (trimmedLine.startsWith('☒') || trimmedLine.startsWith('☐')) {
        checkNewPage(8)
        pdf.setFontSize(11)
        const textLines = pdf.splitTextToSize(trimmedLine, contentWidth)
        pdf.text(textLines, margin, yPosition)
        yPosition += textLines.length * 6 + 2
        continue
      }

      // Sections RGPD (texte plus petit)
      if (
        trimmedLine.startsWith('En qualité de responsable de traitement') ||
        trimmedLine.startsWith('Vos données de contact') ||
        trimmedLine.startsWith('Si vous l\'acceptez') ||
        trimmedLine.startsWith('Conformément à la règlementation') ||
        trimmedLine.startsWith('Pour plus d\'informations')
      ) {
        checkNewPage(15)
        pdf.setFontSize(9)
        const textLines = pdf.splitTextToSize(trimmedLine, contentWidth)
        pdf.text(textLines, margin, yPosition, { align: 'justify' })
        yPosition += textLines.length * 5 + 4
        pdf.setFontSize(11)
        continue
      }

      // "Fait à"
      if (trimmedLine.startsWith('Fait à')) {
        checkNewPage(15)
        yPosition += 10
        pdf.setFontSize(11)
        pdf.text(trimmedLine, margin, yPosition)
        yPosition += 15
        continue
      }

      // Signature
      if (trimmedLine.startsWith('Signature')) {
        checkNewPage(20)
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.text(trimmedLine, margin, yPosition)
        yPosition += 8
        pdf.setFont('helvetica', 'normal')
        continue
      }

      // Note signature
      if (trimmedLine.includes('Bon pour pouvoir')) {
        checkNewPage(10)
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'italic')
        const textLines = pdf.splitTextToSize(trimmedLine, contentWidth)
        pdf.text(textLines, margin, yPosition)
        yPosition += textLines.length * 5
        pdf.setFont('helvetica', 'normal')
        continue
      }

      // Contenu normal
      checkNewPage(15)
      pdf.setFontSize(11)
      const textLines = pdf.splitTextToSize(trimmedLine, contentWidth)
      pdf.text(textLines, margin, yPosition, { align: 'justify' })
      yPosition += textLines.length * 6 + 2
    }

    // Pied de page avec numéro de page
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `Page ${i}`,
        pageWidth / 2,
        pageHeight - margin / 2,
        { align: 'center' }
      )
      pdf.setTextColor(0, 0, 0)
    }

    // Télécharger
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('Erreur lors de l\'export PDF du mandat:', error)
    throw new Error('Impossible d\'exporter le mandat au format PDF')
  }
}

/**
 * Exporte le mandat CCI dans le format spécifié
 */
export async function exportMandat(
  mandatContent: string,
  format: ExportFormat,
  filename: string
): Promise<void> {
  if (format === 'docx') {
    await exportMandatToDocx(mandatContent, filename)
  } else {
    await exportMandatToPdf(mandatContent, filename)
  }
}

