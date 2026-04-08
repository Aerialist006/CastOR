import { useEffect, useState } from 'react'
import type { SceneItem } from '../context/PresentationContext'
import { DEFAULT_CONFIG, type AppConfig } from '../lib/appConfig'
import { useFontLoader } from '../hooks/useFontLoader'
import { SlideCanvas } from '@/components/SlideCanvas'
import { getBackgroundStyle } from '@/utils/backgroundUtils'

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
  const availableH = REF_H * (1 - (cfg.marginTop ?? 0) / 600 - (cfg.marginBottom ?? 0) / 600)

  useFontLoader(cfg.fontFamily)

  useEffect(() => {
    window.api.loadConfig().then((saved: any) => setCfg({ ...DEFAULT_CONFIG, ...saved }))
  }, [])

  useEffect(() => {
    window.api?.castWindowReady?.()
  }, [])

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

  useEffect(() => {
    const unsub = window.api?.onConfigUpdate?.((saved: any) =>
      setCfg({ ...DEFAULT_CONFIG, ...saved })
    )
    return () => unsub?.()
  }, [])

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

  useEffect(() => {
    const measure = () => setScale(Math.min(window.innerWidth / REF_W, window.innerHeight / REF_H))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [REF_W])

  const justifyContent =
    cfg.textAlign === 'left' ? 'flex-start' : cfg.textAlign === 'right' ? 'flex-end' : 'center'

  const bgStyle = getBackgroundStyle(cfg.background) // ADD

  return (
    // Outer: pure black letterbox — never shows the background itself
    <div
      className="h-screen w-screen bg-black overflow-hidden select-none"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ position: 'relative', width: REF_W * scale, height: REF_H * scale }}>
        <div
          style={{
            ...bgStyle, // CHANGE: background lives here, on the canvas
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
          <SlideCanvas
            content={content}
            cfg={cfg}
            verseIdx={verseIdx}
            onVerseClick={setVerseIdx}
            isLive
            availableH={availableH}
          />
        </div>
      </div>
    </div>
  )
}
