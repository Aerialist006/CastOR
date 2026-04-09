// src/hooks/usePdfRenderer.ts
import { useEffect, useRef, useState } from 'react'

export function usePdfRenderer(filePath: string | null, pageIndex: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    if (!filePath || !canvasRef.current) return

    let cancelled = false

    ;(async () => {
      // Dynamic import keeps pdfjs out of the main bundle
      const pdfjs = await import('pdfjs-dist')

      // Worker runs fine in the renderer (Chromium context)
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString()

      const buffer = await window.api.presentations.getPdfBuffer(filePath)
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise

      if (cancelled) return
      setPageCount(pdf.numPages)

      const page = await pdf.getPage(pageIndex + 1)
      const canvas = canvasRef.current!
      const viewport = page.getViewport({ scale: window.devicePixelRatio ?? 1 })

      // Fill the canvas to the container size
      const containerWidth = canvas.parentElement?.clientWidth ?? 1280
      const scale = containerWidth / viewport.width
      const scaled = page.getViewport({ scale })

      canvas.width = scaled.width
      canvas.height = scaled.height

      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise
    })()

    return () => {
      cancelled = true
    }
  }, [filePath, pageIndex])

  return { canvasRef, pageCount }
}
