export type Language = 'en' | 'es'

export interface VerseData {
  book: string
  chapter: number
  verse: number
  text: string
}

export interface ChapterData {
  number: number
  verseCount: number
  verses: Map<number, string>
}

export interface BookData {
  name: string
  chapterCount: number
  chapters: Map<number, ChapterData>
}

export interface BibleTranslation {
  id: string
  name: string
  abbreviation: string
  language: Language
  books: Map<string, BookData>
  bookNames: string[]
}

export interface TranslationConfig {
  id: string
  name: string
  abbreviation: string
  language: Language
  filename: string
}

export const TRANSLATION_CONFIGS: TranslationConfig[] = [
  { id: 'kjv',    name: 'King James Version',          abbreviation: 'KJV',    language: 'en', filename: 'KJV.xmm'    },
  { id: 'rv1960', name: 'Reina Valera 1960',            abbreviation: 'RV1960', language: 'es', filename: 'RV1960.xmm' },
  { id: 'nvi',    name: 'Nueva Versión Internacional',  abbreviation: 'NVI',    language: 'es', filename: 'NVI.xmm'    },
  { id: 'lbla',   name: 'La Biblia de las Américas',    abbreviation: 'LBLA',   language: 'es', filename: 'LBLA.xmm'   },
]