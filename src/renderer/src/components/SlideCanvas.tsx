import { useRef, useLayoutEffect, useState } from 'react'
import type { AppConfig } from '@/lib/appConfig'
import type { SceneItem } from '@/context/PresentationContext'
import { getBibleAbbrev } from '@/lib/fontOptions'

const PLACEHOLDER_VERSE = {
  book: 'John',
  chapter: 3,
  verse: 16,
  text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
}

interface SlideCanvasProps {
  content: SceneItem | null | undefined
  cfg: AppConfig
  verseIdx?: number
  onVerseClick?: (idx: number) => void
  isLive?: boolean
  showPlaceholder?: boolean
  availableH?: number
}

export function SlideCanvas({
  content,
  cfg,
  verseIdx = 0,
  onVerseClick,
  isLive = false,
  showPlaceholder = false,
  availableH
}: SlideCanvasProps) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [autoFontSize, setAutoFontSize] = useState(cfg.fontSize)
  const fitKeyRef = useRef('')


  // Iteratively shrink font size until content fits the available height
  useLayoutEffect(() => {
    // Feature off — always use cfg.fontSize
    if (!cfg.autoSizeFit) {
      if (autoFontSize !== cfg.fontSize) setAutoFontSize(cfg.fontSize)
      return
    }
    if (!measureRef.current || !availableH) return

    // Recompute when content, max font size, or available height changes
    const fitKey = `${content?.id}|${content?.content}|${cfg.fontSize}|${availableH}`
    const isNewContent = fitKeyRef.current !== fitKey

    if (isNewContent) {
      fitKeyRef.current = fitKey
      if (autoFontSize !== cfg.fontSize) {
        // Reset to max first, then re-run to measure
        setAutoFontSize(cfg.fontSize)
        return
      }
      // Already at max — fall through to measure immediately
    }

    // Proportional reduction: converges in 1–3 iterations instead of 50+
    const el = measureRef.current
    if (el.scrollHeight > availableH + 2 && autoFontSize > 8) {
      const ratio = availableH / el.scrollHeight
      setAutoFontSize(Math.max(Math.floor(autoFontSize * ratio) - 1, 8))
    }
  }, [autoFontSize, cfg.autoSizeFit, cfg.fontSize, availableH, content?.id, content?.content])

  const fontSize = cfg.autoSizeFit ? autoFontSize : cfg.fontSize

  const refSize = cfg.refSyncSize ? fontSize * 0.45 : cfg.refFontSize
  const abbrev = getBibleAbbrev(cfg.activeBibleId)

  const shadowCSS = cfg.textShadow
    ? `2px 2px ${cfg.textShadowBlur}px ${cfg.textShadowColor}, -1px -1px ${Math.ceil(cfg.textShadowBlur / 2)}px ${cfg.textShadowColor}`
    : 'none'
  const outlineCSS = cfg.textOutline
    ? `${cfg.textOutlineWidth}px ${cfg.textOutlineColor}`
    : undefined

  const textBase: React.CSSProperties = {
    fontFamily: cfg.fontFamily,
    textShadow: shadowCSS,
    WebkitTextStroke: outlineCSS,
    paintOrder: cfg.textOutline ? 'stroke fill' : undefined
  }

  const justifyContent =
    cfg.textAlign === 'left' ? 'flex-start' : cfg.textAlign === 'right' ? 'flex-end' : 'center'

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!content) {
    if (!showPlaceholder) {
      return (
        <p
          style={{
            ...textBase,
            fontSize: 48,
            color: 'rgba(255,255,255,0.35)',
            textAlign: 'center'
          }}
        >
          {isLive ? '' : ''}
        </p>
      )
    }
    // Fall through to render PLACEHOLDER_VERSE as bible
    const verse = PLACEHOLDER_VERSE
    return (
      <div ref={measureRef} style={{ width: '100%' }}>
        <BibleContent
          verse={verse}
          content={null}
          cfg={cfg}
          textBase={textBase}
          fontSize={fontSize}
          refSize={refSize}
          abbrev={abbrev}
          justifyContent={justifyContent}
          verseIdx={0}
          onVerseClick={undefined}
        />
      </div>
    )
  }

  // ── Bible ────────────────────────────────────────────────────────────────────
  if (content.type === 'bible' && content.verses?.length) {
    const verse = content.verses[verseIdx] ?? content.verses[0]
    return (
      <div ref={measureRef} style={{ width: '100%' }}>
        <BibleContent
          verse={verse}
          content={content}
          cfg={cfg}
          textBase={textBase}
          fontSize={fontSize}
          refSize={refSize}
          abbrev={abbrev}
          justifyContent={justifyContent}
          verseIdx={verseIdx}
          onVerseClick={onVerseClick}
        />
      </div>
    )
  }

  // ── Song / general ───────────────────────────────────────────────────────────
  return (
    <div
      ref={measureRef}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: justifyContent
      }}
    >
      {/* Intro: title + author */}
      {content.showTitle && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
            gap: fontSize * 0.25
          }}
        >
          <p
            style={{
              ...textBase,
              fontSize: fontSize * 1.1,
              color: 'white',
              textAlign: 'center',
              width: '100%',
              margin: 0
            }}
          >
            {content.title}
          </p>
          {content.subtitle && (
            <p
              style={{
                ...textBase,
                fontSize: fontSize * 0.55,
                color: 'rgba(255,255,255,0.75)',
                textAlign: 'center',
                width: '100%',
                margin: 0
              }}
            >
              {content.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Lyric / content slide */}
      {content.content && (
        <p
          style={{
            ...textBase,
            fontSize,
            lineHeight: cfg.lineHeight,
            textAlign: cfg.textAlign,
            color: 'white',
            width: '100%',
            whiteSpace: 'pre-wrap',
            margin: 0
          }}
        >
          {content.content}
        </p>
      )}

      {/* Non-song generic title */}
      {!content.showTitle && !content.content && content.title && (
        <p
          style={{
            ...textBase,
            fontSize: fontSize * 0.5,
            textAlign: cfg.textAlign,
            color: 'rgba(255,255,255,0.6)',
            width: '100%',
            whiteSpace: 'pre-wrap',
            margin: 0
          }}
        >
          {content.title}
        </p>
      )}
    </div>
  )
}

// ── Bible sub-component ──────────────────────────────────────────────────────

interface BibleContentProps {
  verse: { book: string; chapter: number; verse: number; text: string }
  content: SceneItem | null
  cfg: AppConfig
  textBase: React.CSSProperties
  fontSize: number
  refSize: number
  abbrev: string
  justifyContent: string
  verseIdx: number
  onVerseClick?: (idx: number) => void
}

function BibleContent({
  verse,
  content,
  cfg,
  textBase,
  fontSize,
  refSize,
  abbrev,
  justifyContent,
  verseIdx,
  onVerseClick
}: BibleContentProps) {
  return (
    <>
      <p
        style={{
          ...textBase,
          fontSize,
          lineHeight: cfg.lineHeight,
          textAlign: cfg.textAlign,
          color: 'white',
          width: '100%',
          marginBottom: cfg.showVerseRef || cfg.showBibleVersion ? fontSize * 0.5 : 0,
          margin: 0
        }}
      >
        {cfg.showVerseNumbers && (
          <sup
            style={{
              ...textBase,
              fontSize: fontSize * 0.5,
              marginRight: fontSize * 0.2,
              opacity: 0.7,
              verticalAlign: 'super'
            }}
          >
            {verse.verse}
          </sup>
        )}
        {verse.text}
      </p>

      {(cfg.showVerseRef || cfg.showBibleVersion) && (
        <div
          style={{
            display: 'flex',
            gap: refSize * 0.8,
            width: '100%',
            justifyContent,
            alignItems: 'baseline',
            marginTop: fontSize * 0.5
          }}
        >
          {cfg.showVerseRef && (
            <p
              style={{
                ...textBase,
                fontSize: refSize,
                textAlign: cfg.textAlign,
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
          {cfg.showVerseRef && cfg.showBibleVersion && (
            <span style={{ ...textBase, fontSize: refSize, color: 'rgba(255,255,255,0.3)' }}>
              ·
            </span>
          )}
          {cfg.showBibleVersion && (
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

      {/* Dot nav — only in CastWindow (onVerseClick provided) */}
      {content?.verses && content.verses.length > 1 && onVerseClick && (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: 64,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 16
            }}
          >
            {content.verses.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onVerseClick(idx)}
                style={{
                  width: idx === verseIdx ? 20 : 14,
                  height: idx === verseIdx ? 20 : 14,
                  borderRadius: '50%',
                  background: idx === verseIdx ? 'white' : 'rgba(255,255,255,0.25)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 180ms ease'
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 22,
              right: 32,
              color: 'rgba(255,255,255,0.2)',
              fontSize: 26,
              fontFamily: cfg.fontFamily
            }}
          >
            {verseIdx + 1} / {content.verses.length}
          </div>
        </>
      )}
    </>
  )
}
