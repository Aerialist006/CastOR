import { useRef, useEffect, useState } from 'react'
import { FoldbackCanvas } from './FoldbackCanvas'
import type { FoldbackPayload } from '@/types/foldback'

interface FoldbackPreviewProps {
  payload: FoldbackPayload | null
  showChords?: boolean
  showNext?: boolean
  songKey?: string // ← add
}

export function FoldbackPreview({
  payload,
  showChords = true,
  showNext = true,
  songKey // ← add
}: FoldbackPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(18)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height
      setFontSize(Math.max(10, Math.floor(h * 0.01)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full rounded overflow-hidden">
      <FoldbackCanvas
        payload={payload}
        showChords={showChords}
        showNext={showNext}
        fontSize={fontSize}
        songKey={songKey}
      />
    </div>
  )
}
