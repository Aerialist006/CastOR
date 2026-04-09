import { useEffect, useState, useCallback } from 'react'
import { usePresentationContext } from '@/context/PresentationContext'
import type { SongVerseGroup } from '@/types/song'
import { flattenGroups, makeSongItem, slideToFoldbackInfo, type FlatSlide } from '@/utils/preview'
import { transposeSongContent } from '@/utils/chordTransposer'

interface SongNavState {
  sceneId: string
  title: string
  author: string
  tone: string
  flatSlides: FlatSlide[]
  cursor: number
}

export function usePreviewSongNav() {
  const {
    goLive,
    clearLive,
    setPreviewContent,
    setLiveContent,
    schedule,
    currentSceneIndex,
    broadcastFoldbackContent
  } = usePresentationContext()

  const [songNav, setSongNav] = useState<SongNavState | null>(null)

  useEffect(() => {
    const scene = schedule[currentSceneIndex ?? -1]

    if (!scene || scene.type !== 'song') {
      setSongNav(null)
      return
    }

    if (songNav?.sceneId === scene.id) return

    const originalTone = (scene as any).originalTone ?? (scene as any).tone ?? 'C'
    const currentTone = (scene as any).tone ?? 'C'
    const baseGroups: SongVerseGroup[] = (scene as any).songGroups ?? []

    const groups =
      originalTone !== currentTone
        ? baseGroups.map((group) => ({
            ...group,
            slides: group.slides.map((slide) => ({
              ...slide,
              rawText: transposeSongContent(slide.rawText ?? slide.text, originalTone, currentTone)
            }))
          }))
        : baseGroups

    const flatSlides = flattenGroups(groups)

    const nav: SongNavState = {
      sceneId: scene.id,
      title: scene.title,
      author: scene.subtitle ?? '',
      tone: currentTone,
      flatSlides,
      cursor: 0
    }

    setSongNav(nav)
    setPreviewContent(makeSongItem(flatSlides[0], nav.title, nav.author, 0))
    broadcastFoldbackContent({
      current: slideToFoldbackInfo(flatSlides[0], nav.title),
      next: slideToFoldbackInfo(flatSlides[1], nav.title)
    })
  }, [currentSceneIndex, schedule, songNav?.sceneId, setPreviewContent, broadcastFoldbackContent])

  const broadcastFoldback = useCallback(
    (cursor: number) => {
      if (!songNav) return
      broadcastFoldbackContent({
        current: slideToFoldbackInfo(songNav.flatSlides[cursor], songNav.title),
        next: slideToFoldbackInfo(songNav.flatSlides[cursor + 1], songNav.title)
      })
    },
    [songNav, broadcastFoldbackContent]
  )

  const handleNext = useCallback(() => {
    if (!songNav) {
      goLive()
      return
    }

    const { flatSlides, cursor, title, author } = songNav
    const lastIdx = flatSlides.length - 1

    if (cursor < lastIdx) {
      goLive()
      const next = cursor + 1
      setSongNav((prev) => (prev ? { ...prev, cursor: next } : null))
      setPreviewContent(makeSongItem(flatSlides[next], title, author, next))

      broadcastFoldbackContent({
        current: slideToFoldbackInfo(flatSlides[cursor], title),
        next: slideToFoldbackInfo(flatSlides[next], title)
      })
    } else if (cursor === lastIdx) {
      goLive()
      setSongNav((prev) => (prev ? { ...prev, cursor: lastIdx + 1 } : null))
      setPreviewContent(null)

      // Keep final slide visible on foldback while preview is empty
      broadcastFoldbackContent({
        current: slideToFoldbackInfo(flatSlides[lastIdx], title),
        next: null
      })
    } else if (cursor === lastIdx + 1) {
      clearLive()
      setSongNav((prev) => (prev ? { ...prev, cursor: lastIdx + 2 } : null))
      broadcastFoldbackContent({ current: null, next: null })
    }
  }, [songNav, goLive, clearLive, setPreviewContent, broadcastFoldbackContent])

  const handlePrev = useCallback(() => {
    if (!songNav) return

    const { flatSlides, cursor, title, author } = songNav
    const lastIdx = flatSlides.length - 1

    if (cursor > lastIdx) {
      const item = makeSongItem(flatSlides[lastIdx], title, author, lastIdx)
      setSongNav((p) => (p ? { ...p, cursor: lastIdx } : null))
      setPreviewContent(item)
      setLiveContent(item)
      broadcastFoldbackContent({
        current: slideToFoldbackInfo(flatSlides[lastIdx], title),
        next: null
      })
      return
    }

    if (cursor <= 0) return

    const prev = cursor - 1
    const prevPreview = makeSongItem(flatSlides[prev], title, author, prev)
    const prevLiveIdx = Math.max(prev - 1, 0)
    const prevLive = makeSongItem(flatSlides[prevLiveIdx], title, author, prevLiveIdx)

    setSongNav((p) => (p ? { ...p, cursor: prev } : null))
    setPreviewContent(prevPreview)
    setLiveContent(prevLive)
    broadcastFoldback(prevLiveIdx)
  }, [songNav, setPreviewContent, setLiveContent, broadcastFoldback, broadcastFoldbackContent])

  const handleHome = useCallback(() => {
    if (!songNav) return
    const item = makeSongItem(songNav.flatSlides[0], songNav.title, songNav.author, 0)
    setSongNav((p) => (p ? { ...p, cursor: 0 } : null))
    setPreviewContent(item)
    setLiveContent(item)
    broadcastFoldback(0)
  }, [songNav, setPreviewContent, setLiveContent, broadcastFoldback])

  const handleFirstVerse = useCallback(() => {
    if (!songNav || songNav.flatSlides.length < 2) return
    const item = makeSongItem(songNav.flatSlides[1], songNav.title, songNav.author, 1)
    setSongNav((p) => (p ? { ...p, cursor: 1 } : null))
    setPreviewContent(item)
    setLiveContent(item)
    broadcastFoldback(1)
  }, [songNav, setPreviewContent, setLiveContent, broadcastFoldback])

  return {
    songNav,
    isSongActive: songNav !== null,
    handleNext,
    handlePrev,
    handleHome,
    handleFirstVerse,
    broadcastFoldback
  }
}