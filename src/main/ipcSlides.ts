import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { basename, extname } from 'path'
import { readFileSync } from 'fs'
import type {
  Presentation,
  PresentationSlide,
  PresentationFileType
} from '../renderer/src/types/presentation'

// ── PDF ───────────────────────────────────────────────────────────────────────

function getPdfPageCount(filePath: string): number {
  const content = readFileSync(filePath, 'latin1')
  const match = content.match(/\/Count\s+(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

function parsePdf(filePath: string): PresentationSlide[] {
  const count = getPdfPageCount(filePath)
  return Array.from({ length: count }, (_, i) => ({
    id: randomUUID(),
    index: i,
    title: `Page ${i + 1}`
  }))
}

// ── PPTX ──────────────────────────────────────────────────────────────────────

async function parsePptx(filePath: string): Promise<PresentationSlide[]> {
  const { default: PptxParser } = await import('node-pptx-parser')
  const AdmZip = (await import('adm-zip')).default

  const parser = new PptxParser(filePath)
  const textContent = await parser.extractText()

  let globalThumb: string | undefined
  try {
    const zip = new AdmZip(filePath)
    const thumbEntry =
      zip.getEntry('docProps/thumbnail.jpeg') ??
      zip.getEntry('docProps/thumbnail.jpg') ??
      zip.getEntry('docProps/thumbnail.png')

    if (thumbEntry) {
      const mime = thumbEntry.name.endsWith('.png') ? 'image/png' : 'image/jpeg'
      globalThumb = `data:${mime};base64,${thumbEntry.getData().toString('base64')}`
    }
  } catch {
    // no thumbnail — fine
  }

  return textContent.map((slide, index) => ({
    id: randomUUID(),
    index,
    title: slide.text[0] ?? undefined,
    text: slide.text.join('\n'),
    thumbnailUrl: index === 0 ? globalThumb : undefined
  }))
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

export function registerSlidesIpc(): void {
  ipcMain.handle('presentations:import', async (_e, filePath: string): Promise<Presentation> => {
    const ext = extname(filePath).toLowerCase().replace('.', '') as PresentationFileType
    const fileName = basename(filePath)
    const title = basename(filePath, extname(filePath))
    const now = new Date().toISOString()

    const slides = ext === 'pdf' ? parsePdf(filePath) : await parsePptx(filePath)

    return {
      id: randomUUID(),
      title,
      fileName,
      filePath,
      fileType: ext,
      slideCount: slides.length,
      slides,
      createdAt: now,
      updatedAt: now
    }
  })

  // Serves raw PDF bytes to the renderer so pdfjs can render pages there
  ipcMain.handle('presentations:getPdfBuffer', (_e, filePath: string): Buffer => {
    return readFileSync(filePath)
  })
}
