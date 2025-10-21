/**
 * Export d'Avis de Constitution en DOCX et PDF
 */

import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, convertInchesToTwip } from 'docx'
import { saveAs } from 'file-saver'
import { Packer } from 'docx'
import jsPDF from 'jspdf'

/**
 * Exporte un avis de constitution en DOCX
 */
export async function exportAvisToDocx(content: string, filename: string): Promise<void> {
  const lines = content.split('\n')
  const paragraphs: Paragraph[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Titre principal "Avis de constitution"
    if (trimmedLine === 'Avis de constitution') {
      paragraphs.push(
        new Paragraph({
          text: trimmedLine,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: convertInchesToTwip(0.2),
          },
        })
      )
      continue
    }

    // Lignes vides
    if (trimmedLine === '') {
      paragraphs.push(
        new Paragraph({
          text: '',
          spacing: {
            after: convertInchesToTwip(0.1),
          },
        })
      )
      continue
    }

    // Lignes qui commencent par un label (ex: "Forme :", "Dénomination sociale :")
    const labelMatch = trimmedLine.match(/^([^:]+)\s*:\s*(.*)$/)
    if (labelMatch) {
      const [, label, value] = labelMatch
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${label.trim()} : `,
              bold: true,
            }),
            new TextRun({
              text: value.trim(),
            }),
          ],
          spacing: {
            after: convertInchesToTwip(0.05),
          },
        })
      )
      continue
    }

    // Paragraphes normaux
    paragraphs.push(
      new Paragraph({
        text: trimmedLine,
        spacing: {
          after: convertInchesToTwip(0.1),
        },
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: paragraphs,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${filename}.docx`)
}

/**
 * Exporte un avis de constitution en PDF
 */
export async function exportAvisToPdf(content: string, filename: string): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 25
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  const lines = content.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Vérifier si on doit ajouter une nouvelle page
    if (yPosition > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
    }

    // Titre principal "Avis de constitution"
    if (trimmedLine === 'Avis de constitution') {
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      const textWidth = pdf.getTextWidth(trimmedLine)
      const xPosition = (pageWidth - textWidth) / 2
      pdf.text(trimmedLine, xPosition, yPosition)
      yPosition += 12
      continue
    }

    // Lignes vides
    if (trimmedLine === '') {
      yPosition += 5
      continue
    }

    // Lignes avec label (ex: "Forme :", "Dénomination sociale :")
    const labelMatch = trimmedLine.match(/^([^:]+)\s*:\s*(.*)$/)
    if (labelMatch) {
      const [, label, value] = labelMatch
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      const labelText = `${label.trim()} : `
      const labelWidth = pdf.getTextWidth(labelText)
      pdf.text(labelText, margin, yPosition)
      
      pdf.setFont('helvetica', 'normal')
      // Gérer le wrap du texte si nécessaire
      const valueLines = pdf.splitTextToSize(value.trim(), maxWidth - labelWidth)
      pdf.text(valueLines[0], margin + labelWidth, yPosition)
      
      yPosition += 6
      
      // Si le texte continue sur plusieurs lignes
      for (let i = 1; i < valueLines.length; i++) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
        pdf.text(valueLines[i], margin, yPosition)
        yPosition += 6
      }
      continue
    }

    // Paragraphes normaux
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    const textLines = pdf.splitTextToSize(trimmedLine, maxWidth)
    
    for (const textLine of textLines) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
      }
      pdf.text(textLine, margin, yPosition)
      yPosition += 6
    }
  }

  pdf.save(`${filename}.pdf`)
}

/**
 * Fonction wrapper pour exporter selon le format
 */
export async function exportAvis(
  content: string,
  format: 'docx' | 'pdf',
  filename: string
): Promise<void> {
  if (format === 'docx') {
    await exportAvisToDocx(content, filename)
  } else {
    await exportAvisToPdf(content, filename)
  }
}

