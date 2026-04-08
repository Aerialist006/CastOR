import { useRef, useEffect, useState } from 'react'
import { cn } from '@/utils/utils'
import type { SceneItem } from '@/context/PresentationContext'
import type { AppConfig } from '@/lib/appConfig'
import { DEFAULT_CONFIG } from '@/lib/appConfig'
import { useFontLoader } from '@/hooks/useFontLoader'
import { SlideCanvas } from '@/components/SlideCanvas'
import { getBackgroundStyle } from '@/utils/backgroundUtils'

const REF_W_BY_RATIO: Record<string, number> = {
  '16:9': 1920,
  '4:3': 1440
}
const REF_H = 1080

interface CastPreviewProps {
  content?: SceneItem | null
  config?: Partial<AppConfig>
  isLive?: boolean
  showPlaceholder?: boolean
  className?: string
  onCanvasSize?: (w: number) => void
}

export function CastPreview({
  content,
  config = {},
  isLive = false,
  showPlaceholder = false,
  className,
  onCanvasSize
}: CastPreviewProps) {
  const c = { ...DEFAULT_CONFIG, ...config }
  const bgStyle = getBackgroundStyle(c.background)
  const ratio = c.aspectRatio ?? '16:9'
  const REF_W = REF_W_BY_RATIO[ratio] ?? 1920
  const availableH = REF_H * (1 - (c.marginTop ?? 0) / 600 - (c.marginBottom ?? 0) / 600)

  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useFontLoader(c.fontFamily)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const s = Math.min(width / REF_W, height / REF_H)
      setScale(s)
      onCanvasSize?.(Math.round(REF_W * s)) // ← notify parent
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [REF_W, onCanvasSize])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setScale(Math.min(width / REF_W, height / REF_H))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [REF_W])

  const justifyContent =
    c.textAlign === 'left' ? 'flex-start' : c.textAlign === 'right' ? 'flex-end' : 'center'

  // Actual pixel size the scaled canvas occupies
  const canvasW = Math.round(REF_W * scale)
  const canvasH = Math.round(REF_H * scale)

  return (
    // Outer: fills available space, used only for measurement — no border, no clip
    <div ref={wrapRef} className={cn('w-full h-full flex items-start justify-start', className)}>
      {/* Inner: exactly as big as the scaled canvas — border hugs the content */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg shrink-0',
          isLive && content
            ? 'border-2 border-red-600'
            : isLive
              ? 'border-2 border-red-600/30'
              : content
                ? 'border-2 border-primary'
                : 'border-2 border-accent'
        )}
        style={{ width: canvasW, height: canvasH }}
      >
        <div
          style={{
            width: REF_W,
            height: REF_H,
            ...bgStyle,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            paddingTop: `${c.marginTop}%`,
            paddingBottom: `${c.marginBottom}%`,
            paddingLeft: `${c.marginLeft}%`,
            paddingRight: `${c.marginRight}%`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <SlideCanvas
            content={content}
            cfg={c}
            verseIdx={0}
            isLive={isLive}
            showPlaceholder={showPlaceholder}
            availableH={availableH}
          />
        </div>
      </div>
    </div>
  )
}
