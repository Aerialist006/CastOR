import { useEffect, useState } from 'react'
import type { SceneItem } from '../context/PresentationContext'
import { DEFAULT_CONFIG, type AppConfig } from '../lib/appConfig'
import { getBibleAbbrev } from '../lib/fontOptions'
import { useFontLoader } from '../hooks/useFontLoader'

const REF_W_BY_RATIO: Record<string, number> = {
  '16:9': 1920,
  '4:3': 1440
}
const REF_H = 1080

export default function CastWindow() {
  const [content, setContent] = useState<SceneItem | null>(null)
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CONFIG)
  const [verseIdx, setVerseIdx] = useState(0)
  const [scale, setScale] = useState(1)

  const ratio = cfg.aspectRatio ?? '16:9'
  const REF_W = REF_W_BY_RATIO[ratio] ?? 1920

  useFontLoader(cfg.fontFamily)

  // ── Load persisted config ────────────────────────────────────────────────
  useEffect(() => {
    window.api.loadConfig().then((saved: any) => setCfg({ ...DEFAULT_CONFIG, ...saved }))
  }, [])

  // ── Signal main window that this renderer is ready to receive content ────
  // Without this, the cast window often misses the first broadcast because
  // it hadn't registered its IPC listener yet when openCastWindow() fired.
  useEffect(() => {
    window.api?.castWindowReady?.()
  }, [])

  // ── IPC: live content + config piggyback ─────────────────────────────────
  useEffect(() => {
    const unsub = window.api?.onLiveContentUpdate?.(
      (payload: { content: SceneItem | null; config?: AppConfig }) => {
        setContent(payload.content)
        if (payload.config) setCfg({ ...DEFAULT_CONFIG, ...payload.config })
        setVerseIdx(0)
      }
    )
    return () => unsub?.()
  }, [])

  // ── IPC: settings-only config updates ───────────────────────────────────
  useEffect(() => {
    const unsub = window.api?.onConfigUpdate?.((saved: any) =>
      setCfg({ ...DEFAULT_CONFIG, ...saved })
    )
    return () => unsub?.()
  }, [])

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!content?.verses?.length) return
      if (['ArrowRight', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault()
        setVerseIdx((i) => Math.min(i + 1, content.verses!.length - 1))
      } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        setVerseIdx((i) => Math.max(i - 1, 0))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [content])

  // ── Scale ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const measure = () => setScale(Math.min(window.innerWidth / REF_W, window.innerHeight / REF_H))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [REF_W])

  // ── Style helpers ────────────────────────────────────────────────────────
  const refSize = cfg.refSyncSize ? cfg.fontSize * 0.45 : cfg.refFontSize
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

  // ── Canvas content ───────────────────────────────────────────────────────
  let inner: React.ReactNode

  if (!content) {
    inner = (
      // 0.35 instead of 0.15 — actually visible on a dark screen
      <p
        style={{ ...textBase, fontSize: 48, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}
      >
        Waiting for content…
      </p>
    )
  } else if (content.type === 'bible' && content.verses?.length) {
    const verse = content.verses[verseIdx] ?? content.verses[0]
    inner = (
      <>
        <p
          style={{
            ...textBase,
            fontSize: cfg.fontSize,
            lineHeight: cfg.lineHeight,
            textAlign: cfg.textAlign,
            color: 'white',
            width: '100%',
            marginBottom: cfg.showVerseRef || cfg.showBibleVersion ? cfg.fontSize * 0.5 : 0
          }}
        >
          {cfg.showVerseNumbers && (
            <sup
              style={{
                ...textBase,
                fontSize: cfg.fontSize * 0.5,
                marginRight: cfg.fontSize * 0.2,
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
              alignItems: 'baseline'
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
                {content.verses.length > 1
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

        {content.verses.length > 1 && (
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
                onClick={() => setVerseIdx(idx)}
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
        )}

        {content.verses.length > 1 && (
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
        )}
      </>
    )
  } else {
    inner = (
      <>
        {content.title && (
          <p
            style={{
              ...textBase,
              fontSize: cfg.fontSize * 0.5,
              textAlign: cfg.textAlign,
              color: 'rgba(255,255,255,0.6)',
              width: '100%',
              marginBottom: cfg.fontSize * 0.3
            }}
          >
            {content.title}
          </p>
        )}
        {content.content && (
          <p
            style={{
              ...textBase,
              fontSize: cfg.fontSize,
              lineHeight: cfg.lineHeight,
              textAlign: cfg.textAlign,
              color: 'white',
              width: '100%',
              whiteSpace: 'pre-wrap'
            }}
          >
            {content.content}
          </p>
        )}
      </>
    )
  }

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen w-screen bg-black overflow-hidden select-none"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ position: 'relative', width: REF_W * scale, height: REF_H * scale }}>
        <div
          style={{
            width: REF_W,
            height: REF_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            paddingTop: `${cfg.marginTop}%`,
            paddingBottom: `${cfg.marginBottom}%`,
            paddingLeft: `${cfg.marginLeft}%`,
            paddingRight: `${cfg.marginRight}%`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: justifyContent,
            justifyContent: 'center'
          }}
        >
          {inner}
        </div>
      </div>
    </div>
  )
}
