import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode
} from 'react'
import type { VerseData } from '../types/bible'
import { useBibleContext } from './BibleContext'
import { SongVerseGroup } from '@/types/song'
import type { FoldbackPayload } from '@/types/foldback'

export type SceneType = 'bible' | 'song' | 'note' | 'announcement' | 'media'

export interface SceneItem {
  id: string
  type: SceneType
  title: string
  content?: string
  verses?: VerseData[]
  songId?: string
  songGroups?: SongVerseGroup[]
  showTitle?: boolean
  subtitle?: string
  navIndex?: number
  tone?: string
  originalTone?: string
}

export interface PresentationState {
  schedule: SceneItem[]
  currentSceneIndex: number
  previewContent: SceneItem | null
  liveContent: SceneItem | null
  castWindowOpen: boolean
  foldbackWindowOpen: boolean
}

interface PresentationContextValue extends PresentationState {
  setLiveContent: (content: SceneItem | null) => void
  addToSchedule: (item: SceneItem) => void
  removeFromSchedule: (id: string) => void
  reorderSchedule: (fromIndex: number, toIndex: number) => void
  clearSchedule: () => void
  skipLeft: () => void
  skipRight: () => void
  selectScene: (index: number) => void
  setPreviewContent: (content: SceneItem | null) => void
  addVerseToPreview: (verse: VerseData) => void
  goLive: () => void
  clearLive: () => void
  openCastWindow: () => void
  closeCastWindow: () => void
  setCastWindowOpen: (open: boolean) => void
  broadcastFoldbackContent: (payload: FoldbackPayload) => void
}

const PresentationContext = createContext<PresentationContextValue | null>(null)

let idCounter = 0
export function generateId(): string {
  return `scene-${Date.now()}-${++idCounter}`
}

// ── Defined outside component so it's stable and has no hook dependencies ──
function toFoldbackScene(item: SceneItem | null | undefined): FoldbackPayload['current'] {
  if (!item) return null
  if (item.type === 'song') {
    const group = item.songGroups?.[0]
    return {
      type: 'song',
      verseTitle: group?.title ?? item.title,
      // Each slide's rawText preserves chord tokens; fall back to plain text
      rawLines: group?.slides.map((s) => s.rawText ?? s.text) ?? item.content?.split('\n') ?? [],
      cleanText: group?.slides.map((s) => s.text).join('\n') ?? item.content ?? ''
    }
  }
  if (item.type === 'bible') {
    return {
      type: 'bible',
      reference: item.title,
      cleanText: item.content ?? '',
      rawLines: item.content?.split('\n') ?? []
    }
  }
  return { type: 'blank' }
}

export function PresentationProvider({ children }: { children: ReactNode }) {
  const { config } = useBibleContext()

  const [schedule, setSchedule] = useState<SceneItem[]>([])
  const [currentSceneIndex, setCurrentSceneIndex] = useState(-1)
  const [previewContent, setPreviewContentState] = useState<SceneItem | null>(null)
  const [liveContent, setLiveContent] = useState<SceneItem | null>(null)
  const [castWindowOpen, setCastWindowOpen] = useState(false)
  const [foldbackWindowOpen, setFoldbackWindowOpen] = useState(false)

  // ── Refs: always-fresh values for IPC callbacks ───────────────────────────
  const liveContentRef = useRef(liveContent)
  const configRef = useRef(config)
  const lastFoldbackPayloadRef = useRef<FoldbackPayload | null>(null)

  useEffect(() => {
    liveContentRef.current = liveContent
  }, [liveContent])
  useEffect(() => {
    configRef.current = config
  }, [config])

  // ── Cast window ready → re-push live content ──────────────────────────────
  useEffect(() => {
    const unsub = window.api?.onCastWindowReady?.(() => {
      window.api?.broadcastLiveContent?.({
        content: liveContentRef.current,
        config: configRef.current
      })
    })
    return () => unsub?.()
  }, [])

  // ── Foldback window signals ───────────────────────────────────────────────
  useEffect(() => {
    const unsubReady = window.api?.onFoldbackWindowReady?.(() => {
      setFoldbackWindowOpen(true)
      if (lastFoldbackPayloadRef.current) {
        window.api?.broadcastFoldbackContent?.(lastFoldbackPayloadRef.current)
      }
    })
    const unsubClosed = window.api?.onFoldbackWindowClosed?.(() => setFoldbackWindowOpen(false))
    return () => {
      unsubReady?.()
      unsubClosed?.()
    }
  }, [])

  // ── Cast window closed from OS ────────────────────────────────────────────
  useEffect(() => {
    const unsub = window.api?.castWindowClosed?.(() => setCastWindowOpen(false))
    return () => unsub?.()
  }, [])

  // ── Cast window open/close ────────────────────────────────────────────────
  const openCastWindow = useCallback(() => {
    window.api?.openCastWindow?.()
    setCastWindowOpen(true)

    if (configRef.current.foldbackEnabled) {
      window.api?.openFoldbackWindow?.()
    }

    setTimeout(() => {
      window.api?.broadcastLiveContent?.({
        content: liveContentRef.current,
        config: configRef.current
      })
    }, 400)
  }, [])

  const closeCastWindow = useCallback(() => {
    window.api?.closeCastWindow?.()
    setCastWindowOpen(false)

    if (configRef.current.foldbackEnabled) {
      window.api?.closeFoldbackWindow?.()
    }
  }, [])

  // ── Foldback broadcast — caches payload for ready-handler replay ──────────
  const broadcastFoldbackContent = useCallback((payload: FoldbackPayload) => {
    lastFoldbackPayloadRef.current = payload
    window.api?.broadcastFoldbackContent?.(payload)
  }, [])

  // ── Re-broadcast when config changes ─────────────────────────────────────
  useEffect(() => {
    if (liveContentRef.current && castWindowOpen) {
      window.api?.broadcastLiveContent?.({
        content: liveContentRef.current,
        config: configRef.current
      })
    }
  }, [config, castWindowOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Schedule ──────────────────────────────────────────────────────────────
  const addToSchedule = useCallback((item: SceneItem) => {
    setSchedule((prev) => [...prev, item])
  }, [])

  const removeFromSchedule = useCallback(
    (id: string) => {
      setSchedule((prev) => {
        const index = prev.findIndex((item) => item.id === id)
        const next = prev.filter((item) => item.id !== id)
        if (index <= currentSceneIndex && currentSceneIndex > 0) setCurrentSceneIndex((c) => c - 1)
        return next
      })
    },
    [currentSceneIndex]
  )

  const reorderSchedule = useCallback(
    (fromIndex: number, toIndex: number) => {
      setSchedule((prev) => {
        const result = Array.from(prev)
        const [moved] = result.splice(fromIndex, 1)
        result.splice(toIndex, 0, moved)
        if (currentSceneIndex === fromIndex) setCurrentSceneIndex(toIndex)
        else if (fromIndex < currentSceneIndex && toIndex >= currentSceneIndex)
          setCurrentSceneIndex((c) => c - 1)
        else if (fromIndex > currentSceneIndex && toIndex <= currentSceneIndex)
          setCurrentSceneIndex((c) => c + 1)
        return result
      })
    },
    [currentSceneIndex]
  )

  const clearSchedule = useCallback(() => {
    setSchedule([])
    setCurrentSceneIndex(-1)
    setPreviewContentState(null)
  }, [])

  // ── Navigation ────────────────────────────────────────────────────────────
  const skipLeft = useCallback(() => {
    if (!schedule.length) return
    setCurrentSceneIndex((prev) => {
      const i = prev <= 0 ? schedule.length - 1 : prev - 1
      setPreviewContentState(schedule[i])
      return i
    })
  }, [schedule])

  const skipRight = useCallback(() => {
    if (!schedule.length) return
    setCurrentSceneIndex((prev) => {
      const i = prev >= schedule.length - 1 ? 0 : prev + 1
      setPreviewContentState(schedule[i])
      return i
    })
  }, [schedule])

  const selectScene = useCallback(
    (index: number) => {
      if (index >= 0 && index < schedule.length) {
        setCurrentSceneIndex(index)
        const item = schedule[index]
        if (item.type !== 'song') {
          setPreviewContentState(item)
        }
      }
    },
    [schedule]
  )

  // ── Preview ───────────────────────────────────────────────────────────────
  const setPreviewContent = useCallback(
    (content: SceneItem | null) => {
      setPreviewContentState(content)
      if (content) {
        const index = schedule.findIndex((item) => item.id === content.id)
        if (index !== -1) setCurrentSceneIndex(index)
      }
    },
    [schedule]
  )

  const addVerseToPreview = useCallback((verse: VerseData) => {
    setPreviewContentState({
      id: generateId(),
      type: 'bible',
      title: `${verse.book} ${verse.chapter}:${verse.verse}`,
      content: verse.text,
      verses: [verse]
    })
  }, [])

  // ── Live ──────────────────────────────────────────────────────────────────
  const broadcast = useCallback((content: SceneItem | null) => {
    window.api?.broadcastLiveContent?.({ content, config: configRef.current })
  }, [])

  const goLive = useCallback(() => {
    if (!previewContent) return
    setLiveContent(previewContent)
    broadcast(previewContent)

    const nextItem = schedule[currentSceneIndex + 1] ?? null
    broadcastFoldbackContent({
      current: toFoldbackScene(previewContent),
      next: toFoldbackScene(nextItem)
    })
  }, [previewContent, broadcast, broadcastFoldbackContent, schedule, currentSceneIndex])

  const clearLive = useCallback(() => {
    setLiveContent(null)
    broadcast(null)
    broadcastFoldbackContent({ current: { type: 'blank' }, next: null })
  }, [broadcast, broadcastFoldbackContent])

  // ── Context value ─────────────────────────────────────────────────────────
  const value: PresentationContextValue = {
    schedule,
    currentSceneIndex,
    previewContent,
    liveContent,
    castWindowOpen,
    foldbackWindowOpen,
    addToSchedule,
    removeFromSchedule,
    reorderSchedule,
    clearSchedule,
    skipLeft,
    skipRight,
    selectScene,
    setPreviewContent,
    addVerseToPreview,
    goLive,
    clearLive,
    openCastWindow,
    closeCastWindow,
    setCastWindowOpen,
    setLiveContent,
    broadcastFoldbackContent
  }

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>
}

export function usePresentationContext() {
  const context = useContext(PresentationContext)
  if (!context) throw new Error('usePresentationContext must be used within PresentationProvider')
  return context
}
