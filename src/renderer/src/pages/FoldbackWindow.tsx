import { useEffect, useState } from 'react'
import type { FoldbackPayload } from '../types/foldback'
import { DEFAULT_CONFIG, type AppConfig } from '../lib/appConfig'
import { FoldbackCanvas } from '@/components/FoldbackCanvas'

export default function FoldbackWindow() {
  const [payload, setPayload] = useState<FoldbackPayload | null>(null)
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CONFIG)

  // Load initial config
  useEffect(() => {
    window.api?.loadConfig?.().then((saved: any) => setCfg({ ...DEFAULT_CONFIG, ...saved }))
  }, [])

  // Signal ready (triggers onFoldbackWindowReady in main app)
  useEffect(() => {
    window.api?.foldbackWindowReady?.()
  }, [])

  // Receive foldback content
  useEffect(() => {
    const unsub = window.api?.onFoldbackContentUpdate?.((incoming: FoldbackPayload) =>
      setPayload(incoming)
    )
    return () => unsub?.()
  }, [])

  // Config updates (font size etc.)
  useEffect(() => {
    const unsub = window.api?.onConfigUpdate?.((saved: any) =>
      setCfg({ ...DEFAULT_CONFIG, ...saved })
    )
    return () => unsub?.()
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden select-none bg-zinc-950">
      <FoldbackCanvas
        payload={payload}
        showChords={cfg.foldbackShowChords ?? true}
        showNext={cfg.foldbackShowNextVerse ?? true}
        fontSize={cfg.foldbackFontSize ?? 120}
      />
    </div>
  )
}
