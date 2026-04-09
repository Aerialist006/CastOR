import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { usePresentationContext } from '@/context/PresentationContext'
import type { SceneItem } from '@/context/PresentationContext'
import { useBibleContext } from '@/context/BibleContext'
import { LivePanel } from '@/components/preview/LivePanel'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { usePreviewSongNav } from '@/hooks/usePreviewSongNav'
import { makeBibleItem, slideToFoldbackInfo } from '@/utils/preview'


// ── Slide nav types ────────────────────────────────────────────────────────

interface SlideNavState {
  sceneId: string
  title: string
  slides: NonNullable<SceneItem['presentationSlides']>
  cursor: number
  presentationId?: string
}


const Preview = () => {
  const { config, activeBible } = useBibleContext()
  const { t } = useTranslation()

  const {
    previewContent,
    liveContent,
    goLive,
    clearLive,
    castWindowOpen,
    foldbackWindowOpen,
    setPreviewContent,
    setLiveContent,
    broadcastFoldbackContent,
    schedule,
    currentSceneIndex
  } = usePresentationContext()

  const [liveCanvasW, setLiveCanvasW] = useState<number | undefined>(undefined)
  const [slideNav, setSlideNav] = useState<SlideNavState | null>(null)

  const { songNav, isSongActive, handleNext, handlePrev, handleHome, handleFirstVerse } =
    usePreviewSongNav()


  // ── Bible foldback on live change ─────────────────────────────────────────
  useEffect(() => {
    if (!liveContent || liveContent.type !== 'bible') return

    const verse = liveContent.verses?.[0]
    const nextVerse = previewContent?.type === 'bible' ? previewContent.verses?.[0] : null

    broadcastFoldbackContent({
      current: {
        type: 'bible',
        reference: verse ? `${verse.book} ${verse.chapter}:${verse.verse}` : liveContent.title,
        cleanText: liveContent.content ?? '',
        rawLines: [liveContent.content ?? ''],
        verseTitle: liveContent.title
      },
      next: nextVerse
        ? {
            type: 'bible',
            reference: `${nextVerse.book} ${nextVerse.chapter}:${nextVerse.verse}`,
            cleanText: previewContent?.content ?? '',
            rawLines: [previewContent?.content ?? ''],
            verseTitle: previewContent?.title
          }
        : null
    })
  }, [liveContent, previewContent, broadcastFoldbackContent])


  // ── Init slide nav on schedule selection ─────────────────────────────────
  useEffect(() => {
    const scene = schedule[currentSceneIndex ?? -1]

    if (!scene || scene.type !== 'slide' || !scene.presentationSlides?.length) {
      setSlideNav(null)
      return
    }

    if (slideNav?.sceneId === scene.id) return

    const nav: SlideNavState = {
      sceneId: scene.id,
      title: scene.title,
      slides: scene.presentationSlides,
      cursor: scene.navIndex ?? 0,
      presentationId: scene.presentationId
    }

    setSlideNav(nav)

    const first = nav.slides[nav.cursor] ?? nav.slides[0]
    if (first) {
      setPreviewContent({
        ...scene,
        navIndex: first.index,
        content: first.text ?? '',
        thumbnailUrl: first.thumbnailUrl
      })
    }
  }, [currentSceneIndex, schedule])


  // ── Derived active states ─────────────────────────────────────────────────
  const isSlideActive = slideNav !== null
  const isBibleActive = !isSongActive && !isSlideActive && previewContent?.type === 'bible'
  const bibleVerse = isBibleActive ? previewContent?.verses?.[0] : null


  // ── Bible boundary checks ─────────────────────────────────────────────────
  const bibleIsAtStart = useMemo(() => {
    if (!bibleVerse) return true
    return bibleVerse.chapter === 1 && bibleVerse.verse === 1
  }, [bibleVerse])

  const bibleIsAtEnd = useMemo(() => {
    if (!bibleVerse || !activeBible) return true
    const bookData = activeBible.books.get(bibleVerse.book)
    if (!bookData) return true
    const chData = bookData.chapters.get(bibleVerse.chapter)
    if (!chData) return true
    return bibleVerse.chapter === bookData.chapterCount && bibleVerse.verse === chData.verseCount
  }, [bibleVerse, activeBible])

  const verseLabel = bibleVerse
    ? `${bibleVerse.book} ${bibleVerse.chapter}:${bibleVerse.verse}`
    : ''


  // ── Song slide label ──────────────────────────────────────────────────────
  const slideLabel = useMemo(() => {
    if (!songNav) return ''
    const currentSlide = songNav.flatSlides[songNav.cursor]
    if (!currentSlide) {
      if (songNav.cursor === songNav.flatSlides.length) return t('song.finishing', 'Finishing...')
      if (songNav.cursor > songNav.flatSlides.length) return t('song.done', 'Done')
      return ''
    }
    if (currentSlide.isIntro) return t('song.intro', 'Intro')
    if (currentSlide.groupTitle) {
      return `${currentSlide.groupTitle}  ·  ${songNav.cursor} / ${songNav.flatSlides.length - 1}`
    }
    return `${t('song.slide', 'Slide')} ${songNav.cursor} / ${songNav.flatSlides.length - 1}`
  }, [songNav, t])


  // ── Presentation slide label ──────────────────────────────────────────────
  const presentationSlideLabel = useMemo(() => {
    if (!slideNav) return ''
    return `${t('slide.slide', 'Slide')} ${slideNav.cursor + 1} / ${slideNav.slides.length}`
  }, [slideNav, t])


  // ── Bible navigation ──────────────────────────────────────────────────────
  const handleBibleNext = useCallback(() => {
    if (!previewContent || !activeBible) return
    const verse = previewContent.verses?.[0]
    if (!verse) return

    goLive()

    const bookData = activeBible.books.get(verse.book)
    const chData = bookData?.chapters.get(verse.chapter)
    if (!bookData || !chData) return

    let nextChapter = verse.chapter
    let nextVerse = verse.verse + 1

    if (nextVerse > chData.verseCount) {
      if (verse.chapter >= bookData.chapterCount) {
        setPreviewContent(null)
        return
      }
      nextChapter = verse.chapter + 1
      nextVerse = 1
    }

    const text = activeBible.books.get(verse.book)?.chapters.get(nextChapter)?.verses.get(nextVerse)
    if (!text) return

    setPreviewContent(makeBibleItem({ book: verse.book, chapter: nextChapter, verse: nextVerse, text }))
  }, [previewContent, activeBible, goLive, setPreviewContent])

  const handleBiblePrev = useCallback(() => {
    if (!previewContent || !activeBible) return
    const verse = previewContent.verses?.[0]
    if (!verse) return

    let prevChapter = verse.chapter
    let prevVerse = verse.verse - 1

    if (prevVerse < 1) {
      if (verse.chapter <= 1) return
      prevChapter = verse.chapter - 1
      const chData = activeBible.books.get(verse.book)?.chapters.get(prevChapter)
      if (!chData) return
      prevVerse = chData.verseCount
    }

    const prevText = activeBible.books
      .get(verse.book)
      ?.chapters.get(prevChapter)
      ?.verses.get(prevVerse)
    if (!prevText) return

    const prevItem = makeBibleItem({ book: verse.book, chapter: prevChapter, verse: prevVerse, text: prevText })

    const liveVerse = liveContent?.verses?.[0]
    if (liveVerse) {
      let prevLiveChapter = liveVerse.chapter
      let prevLiveVerse = liveVerse.verse - 1

      if (prevLiveVerse < 1) {
        if (liveVerse.chapter > 1) {
          prevLiveChapter = liveVerse.chapter - 1
          const chData = activeBible.books.get(liveVerse.book)?.chapters.get(prevLiveChapter)
          if (chData) {
            prevLiveVerse = chData.verseCount
            const liveText = activeBible.books
              .get(liveVerse.book)
              ?.chapters.get(prevLiveChapter)
              ?.verses.get(prevLiveVerse)
            if (liveText) {
              setLiveContent(makeBibleItem({
                book: liveVerse.book, chapter: prevLiveChapter,
                verse: prevLiveVerse, text: liveText
              }))
            }
          }
        }
      } else {
        const liveText = activeBible.books
          .get(liveVerse.book)
          ?.chapters.get(prevLiveChapter)
          ?.verses.get(prevLiveVerse)
        if (liveText) {
          setLiveContent(makeBibleItem({
            book: liveVerse.book, chapter: prevLiveChapter,
            verse: prevLiveVerse, text: liveText
          }))
        }
      }
    }

    setPreviewContent(prevItem)
  }, [previewContent, liveContent, activeBible, setPreviewContent, setLiveContent])


  // ── Slide navigation ──────────────────────────────────────────────────────
  const handleSlideNext = useCallback(() => {
    if (!slideNav) return

    goLive()

    const lastIdx = slideNav.slides.length - 1
    if (slideNav.cursor >= lastIdx) return

    const next = slideNav.cursor + 1
    const nextSlide = slideNav.slides[next]
    setSlideNav((prev) => (prev ? { ...prev, cursor: next } : null))

    // Fix: setPreviewContent is not a React state setter — use previewContent from closure
    if (nextSlide && previewContent) {
      setPreviewContent({
        ...previewContent,
        type: 'slide',
        navIndex: nextSlide.index,
        content: nextSlide.text ?? '',
        thumbnailUrl: nextSlide.thumbnailUrl
      })
    }
  }, [slideNav, previewContent, goLive, setPreviewContent])

  const handleSlidePrev = useCallback(() => {
    if (!slideNav || slideNav.cursor <= 0) return

    const prev = slideNav.cursor - 1
    const prevSlide = slideNav.slides[prev]
    setSlideNav((state) => (state ? { ...state, cursor: prev } : null))

    if (!prevSlide) return

    const previewItem =
      previewContent?.type === 'slide'
        ? {
            ...previewContent,
            navIndex: prevSlide.index,
            content: prevSlide.text ?? '',
            thumbnailUrl: prevSlide.thumbnailUrl
          }
        : null

    const liveIdx = Math.max(prev - 1, 0)
    const liveSlide = slideNav.slides[liveIdx]

    if (previewItem) setPreviewContent(previewItem)
    if (liveSlide && liveContent?.type === 'slide') {
      setLiveContent({
        ...liveContent,
        navIndex: liveSlide.index,
        content: liveSlide.text ?? '',
        thumbnailUrl: liveSlide.thumbnailUrl
      })
    }
  }, [slideNav, previewContent, liveContent, setPreviewContent, setLiveContent])


  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault()
        if (isSongActive) handleNext()
        else if (isSlideActive) handleSlideNext()
        else if (isBibleActive) handleBibleNext()
      }

      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        if (isSongActive) handlePrev()
        else if (isSlideActive) handleSlidePrev()
        else if (isBibleActive) handleBiblePrev()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    isSongActive, isSlideActive, isBibleActive,
    handleNext, handlePrev,
    handleSlideNext, handleSlidePrev,
    handleBibleNext, handleBiblePrev
  ])


  // ── Stage monitor payload ─────────────────────────────────────────────────
  const stageMonitorPayload = useMemo(() => {
    if (isSongActive && songNav) {
      const liveCursor = liveContent?.type === 'song' ? (liveContent.navIndex ?? 0) : songNav.cursor
      const currentSlide = songNav.flatSlides[liveCursor] ?? songNav.flatSlides[0]
      const nextSlide = songNav.flatSlides[liveCursor + 1] ?? undefined
      return {
        current: slideToFoldbackInfo(currentSlide, songNav.title),
        next: slideToFoldbackInfo(nextSlide, songNav.title)
      }
    }

    if (liveContent?.type === 'bible' || previewContent?.type === 'bible') {
      const bibleContent =
        liveContent?.type === 'bible'
          ? liveContent
          : previewContent?.type === 'bible'
            ? previewContent
            : null
      if (!bibleContent) return null

      const verse = bibleContent.verses?.[0]
      const nextContent =
        liveContent?.type === 'bible' &&
        previewContent?.type === 'bible' &&
        previewContent.id !== liveContent.id
          ? previewContent
          : null
      const nextVerse = nextContent?.verses?.[0]

      return {
        current: {
          type: 'bible',
          reference: verse ? `${verse.book} ${verse.chapter}:${verse.verse}` : bibleContent.title,
          cleanText: bibleContent.content ?? '',
          rawLines: [bibleContent.content ?? ''],
          verseTitle: bibleContent.title
        },
        next: nextVerse
          ? {
              type: 'bible',
              reference: `${nextVerse.book} ${nextVerse.chapter}:${nextVerse.verse}`,
              cleanText: nextContent!.content ?? '',
              rawLines: [nextContent!.content ?? ''],
              verseTitle: nextContent!.title
            }
          : null
      }
    }

    return null
  }, [isSongActive, songNav, liveContent, previewContent])

  const activeSongKey = songNav?.tone


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="flex-1 border-b border-r p-4 h-full flex gap-4 overflow-hidden min-w-0">
      <LivePanel
        t={t}
        config={config}
        liveContent={liveContent}
        castWindowOpen={!!castWindowOpen}
        foldbackWindowOpen={!!foldbackWindowOpen}
        onClearLive={clearLive}
        onCanvasSize={setLiveCanvasW}
        liveCanvasW={liveCanvasW}
      />

      <PreviewPanel
        t={t}
        config={config}
        previewContent={previewContent}
        isSongActive={isSongActive}
        isBibleActive={isBibleActive}
        isSlideActive={isSlideActive}
        songNav={songNav}
        slideNav={slideNav}
        handleHome={handleHome}
        handleFirstVerse={handleFirstVerse}
        handlePresentPreview={goLive}
        goLive={goLive}
        handlePrev={handlePrev}
        handleNext={handleNext}
        handleBiblePrev={handleBiblePrev}
        handleBibleNext={handleBibleNext}
        handleSlidePrev={handleSlidePrev}
        handleSlideNext={handleSlideNext}
        isAtStart={isSongActive ? songNav!.cursor <= 0 : false}
        isAtEnd={isSongActive ? songNav!.cursor >= songNav!.flatSlides.length - 1 : false}
        bibleIsAtStart={bibleIsAtStart}
        bibleIsAtEnd={bibleIsAtEnd}
        slideIsAtStart={isSlideActive ? slideNav!.cursor <= 0 : false}
        slideIsAtEnd={isSlideActive ? slideNav!.cursor >= slideNav!.slides.length - 1 : false}
        slideLabel={slideLabel}
        presentationSlideLabel={presentationSlideLabel}
        verseLabel={verseLabel}
        castWindowOpen={castWindowOpen}
        foldbackWindowOpen={!!foldbackWindowOpen}
        stageMonitorPayload={stageMonitorPayload}
        activeSongKey={activeSongKey}
      />
    </section>
  )
}

export default Preview