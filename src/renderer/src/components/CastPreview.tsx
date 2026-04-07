import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { SceneItem } from '@/context/PresentationContext'
import type { AppConfig } from '@/lib/appConfig'
import { DEFAULT_CONFIG } from '@/lib/appConfig'
import { getBibleAbbrev } from '@/lib/fontOptions'
import { useFontLoader } from '@/hooks/useFontLoader'

const REF_W_BY_RATIO: Record<string, number> = {
  '16:9': 1920,
  '4:3': 1440
}
const REF_H = 1080

const PLACEHOLDER_VERSE = {
  book: 'John',
  chapter: 3,
  verse: 16,
  text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
}

interface CastPreviewProps {
  content?: SceneItem | null
  config?: Partial<AppConfig>
  isLive?: boolean
  showPlaceholder?: boolean
  className?: string
}

export function CastPreview({
  content,
  config = {}, 
  isLive = false,
  showPlaceholder = false,
  className
}: CastPreviewProps) {
  const c = { ...DEFAULT_CONFIG, ...config }
  const ratio = c.aspectRatio ?? '16:9'
  const REF_W = REF_W_BY_RATIO[ratio] ?? 1920

  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useFontLoader(c.fontFamily)

  // Re-run whenever REF_W changes (ratio toggle) so scale stays correct
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect

      const scaleByW = width / REF_W
      const scaleByH = height / REF_H
      setScale(Math.min(scaleByW, scaleByH)) // ← use whichever is the binding constraint
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [REF_W])

  const verse =
    content?.type === 'bible' && content.verses?.[0]
      ? content.verses[0]
      : showPlaceholder
        ? PLACEHOLDER_VERSE
        : null

  const isEmpty = !verse && !content?.title && !content?.content

  const refSize = c.refSyncSize ? c.fontSize * 0.45 : c.refFontSize
  const abbrev = getBibleAbbrev(c.activeBibleId)

  const shadowCSS = c.textShadow
    ? `2px 2px ${c.textShadowBlur}px ${c.textShadowColor}, -1px -1px ${Math.ceil(c.textShadowBlur / 2)}px ${c.textShadowColor}`
    : 'none'

  const outlineCSS = c.textOutline ? `${c.textOutlineWidth}px ${c.textOutlineColor}` : undefined

  const textBase: React.CSSProperties = {
    fontFamily: c.fontFamily,
    textShadow: shadowCSS,
    WebkitTextStroke: outlineCSS,
    paintOrder: c.textOutline ? 'stroke fill' : undefined
  }

  const justifyContent =
    c.textAlign === 'left' ? 'flex-start' : c.textAlign === 'right' ? 'flex-end' : 'center'

  return (
    <div
      ref={wrapRef}
      className={cn(
        // ↓ was hardcoded 'aspect-video', now respects ratio
        'relative w-full overflow-hidden rounded-lg bg-black',
        ratio === '4:3' ? 'aspect-[4/3]' : 'aspect-video',
        isLive && content
          ? 'border-2 border-red-600'
          : isLive
            ? 'border-2 border-red-600/30'
            : content
              ? 'border-2 border-primary'
              : 'border-2 border-accent',
        className
      )}
    >
      <div
        style={{
          width: REF_W,
          height: REF_H,
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
          alignItems: justifyContent,
          justifyContent: 'center'
        }}
      >
        {isEmpty ? (
          <p
            style={{
              ...textBase,
              fontSize: 36,
              color: 'rgba(255,255,255,0.25)',
              textAlign: 'center'
            }}
          >
            {isLive ? 'Nothing live' : 'Select content to preview'}
          </p>
        ) : verse ? (
          <>
            <p
              style={{
                ...textBase,
                fontSize: c.fontSize,
                lineHeight: c.lineHeight,
                textAlign: c.textAlign,
                color: 'white',
                width: '100%',
                marginBottom: c.showVerseRef || c.showBibleVersion ? c.fontSize * 0.5 : 0
              }}
            >
              {c.showVerseNumbers && (
                <sup
                  style={{
                    ...textBase,
                    fontSize: c.fontSize * 0.5,
                    marginRight: c.fontSize * 0.2,
                    opacity: 0.7,
                    verticalAlign: 'super'
                  }}
                >
                  {verse.verse}
                </sup>
              )}
              {verse.text}
            </p>

            {(c.showVerseRef || c.showBibleVersion) && (
              <div
                style={{
                  display: 'flex',
                  gap: refSize * 0.8,
                  width: '100%',
                  justifyContent,
                  alignItems: 'baseline'
                }}
              >
                {c.showVerseRef && (
                  <p
                    style={{
                      ...textBase,
                      fontSize: refSize,
                      textAlign: c.textAlign,
                      color: 'rgba(255,255,255,0.65)',
                      margin: 0
                    }}
                  >
                    {verse.book} {verse.chapter}:{verse.verse}
                    {content?.verses && content.verses.length > 1
                      ? `–${content.verses[content.verses.length - 1].verse}`
                      : ''}
                  </p>
                )}

                {c.showVerseRef && c.showBibleVersion && (
                  <span style={{ ...textBase, fontSize: refSize, color: 'rgba(255,255,255,0.3)' }}>
                    ·
                  </span>
                )}

                {c.showBibleVersion && (
                  <p
                    style={{
                      ...textBase,
                      fontSize: refSize,
                      color: 'rgba(255,255,255,0.45)',
                      fontStyle: 'italic',
                      margin: 0
                    }}
                  >
                    {abbrev}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {content?.title && (
              <p
                style={{
                  ...textBase,
                  fontSize: c.fontSize * 0.5,
                  textAlign: c.textAlign,
                  color: 'rgba(255,255,255,0.6)',
                  width: '100%',
                  marginBottom: c.fontSize * 0.3
                }}
              >
                {content.title}
              </p>
            )}
            {content?.content && (
              <p
                style={{
                  ...textBase,
                  fontSize: c.fontSize,
                  lineHeight: c.lineHeight,
                  textAlign: c.textAlign,
                  color: 'white',
                  width: '100%'
                }}
              >
                {content.content}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
