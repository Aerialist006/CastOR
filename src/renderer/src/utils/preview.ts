import { generateId } from '@/context/PresentationContext'
import type { SceneItem } from '@/context/PresentationContext'
import type { SongVerseGroup } from '@/types/song'
import type { VerseData } from '@/types/bible'
import type { FoldbackVerseInfo } from '@/types/foldback'

export interface FlatSlide {
  content: string
  rawLines: string[]
  groupTitle?: string
  flatIndex: number
  isIntro: boolean
}

export function flattenGroups(groups: SongVerseGroup[]): FlatSlide[] {
  const slides: FlatSlide[] = [{ content: '', rawLines: [], flatIndex: 0, isIntro: true }]
  let idx = 1

  for (const group of groups) {
    for (const slide of group.slides) {
      slides.push({
        content: slide.text,
        rawLines: (slide.rawText ?? slide.text).split('\n'),
        groupTitle: group.title,
        flatIndex: idx++,
        isIntro: false
      })
    }
  }

  return slides
}

export function makeSongItem(
  slide: FlatSlide,
  title: string,
  author: string,
  navIndex: number
): SceneItem {
  return {
    id: generateId(),
    type: 'song',
    title,
    subtitle: slide.isIntro ? author : undefined,
    content: slide.isIntro ? '' : slide.content,
    showTitle: slide.isIntro,
    navIndex
  }
}

export function makeBibleItem(verse: VerseData): SceneItem {
  return {
    id: generateId(),
    type: 'bible',
    title: `${verse.book} ${verse.chapter}:${verse.verse}`,
    content: verse.text,
    verses: [verse]
  }
}

export function slideToFoldbackInfo(
  slide: FlatSlide | undefined,
  songTitle: string
): FoldbackVerseInfo | null {
  if (!slide) return null
  if (slide.isIntro) return { type: 'song', verseTitle: songTitle, rawLines: [], cleanText: '' }

  return {
    type: 'song',
    verseTitle: slide.groupTitle,
    rawLines: slide.rawLines,
    cleanText: slide.content
  }
}