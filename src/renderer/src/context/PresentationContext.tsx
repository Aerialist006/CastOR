import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode
} from 'react'
import type { VerseData } from '../lib/bibleTypes'
import { useBibleContext } from './BibleContext'

export type SceneType = 'bible' | 'song' | 'note' | 'announcement' | 'media'

export interface SceneItem {
  id: string
  type: SceneType
  title: string
  content: string
  verses?: VerseData[]
  mediaUrl?: string
}

export interface PresentationState {
  schedule: SceneItem[]
  currentSceneIndex: number
  previewContent: SceneItem | null
  liveContent: SceneItem | null
  castWindowOpen: boolean
}

interface PresentationContextValue extends PresentationState {
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
}

const PresentationContext = createContext<PresentationContextValue | null>(null)

let idCounter = 0
export function generateId(): string {
  return `scene-${Date.now()}-${++idCounter}`
}

export function PresentationProvider({ children }: { children: ReactNode }) {
  const { config } = useBibleContext()

  const [schedule, setSchedule] = useState<SceneItem[]>([])
  const [currentSceneIndex, setCurrentSceneIndex] = useState(-1)
  const [previewContent, setPreviewContentState] = useState<SceneItem | null>(null)
  const [liveContent, setLiveContent] = useState<SceneItem | null>(null)
  const [castWindowOpen, setCastWindowOpen] = useState(false)

  useEffect(() => {
    const unsub = window.api?.onCastWindowReady?.(() => {
      window.api?.broadcastLiveContent?.({ content: liveContent, config })
    })
    return () => unsub?.()
  }, [liveContent, config])

  // ── Cast window ─────────────────────────────────────────────
  const openCastWindow = useCallback(() => {
    window.api?.openCastWindow?.()
    setCastWindowOpen(true)
    // The new window needs ~400ms to mount and register its IPC listener.
    // Then push the current state so it doesn't sit blank.
    setTimeout(() => {
      window.api?.broadcastLiveContent?.({ content: liveContent, config })
    }, 400)
  }, [liveContent, config]) // ← depend on current live content

  const closeCastWindow = useCallback(() => {
    window.api?.closeCastWindow?.()
    setCastWindowOpen(false)
  }, [])

  // Listen for cast window being closed from OS (user closes it directly)
  useEffect(() => {
    const unsub = window.api?.castWindowClosed?.(() => setCastWindowOpen(false))
    return () => unsub?.()
  }, [])

  // ── Schedule ────────────────────────────────────────────────
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

  // ── Navigation ──────────────────────────────────────────────
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
        setPreviewContentState(schedule[index])
      }
    },
    [schedule]
  )

  // ── Preview ─────────────────────────────────────────────────
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

  // ── Live ────────────────────────────────────────────────────
  const broadcast = useCallback(
    (content: SceneItem | null) => {
      window.api?.broadcastLiveContent?.({ content, config })
    },
    [config]
  )

  const goLive = useCallback(() => {
    if (!previewContent) return
    setLiveContent(previewContent)
    broadcast(previewContent)
  }, [previewContent, broadcast])

  const clearLive = useCallback(() => {
    setLiveContent(null)
    broadcast(null)
  }, [broadcast])

  // Re-broadcast when config changes so cast window reflects new settings live
  useEffect(() => {
    if (liveContent && castWindowOpen) broadcast(liveContent)
  }, [config, castWindowOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Context value ───────────────────────────────────────────
  const value: PresentationContextValue = {
    schedule,
    currentSceneIndex,
    previewContent,
    liveContent,
    castWindowOpen,
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
    setCastWindowOpen
  }

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>
}

export function usePresentationContext() {
  const context = useContext(PresentationContext)
  if (!context) throw new Error('usePresentationContext must be used within PresentationProvider')
  return context
}
