export interface Song {
  id: string
  title: string
  author: string
  tone: string
  bpm: number
  content: string
  createdAt: string
  updatedAt: string
}

export interface ParsedVerse {
  title?: string
  lines: ParsedLine[]
}

export interface ParsedLine {
  type: 'chord' | 'text' | 'empty'
  content: string
  chords?: ParsedChord[]
}

export interface ParsedChord {
  symbol: string
  isNashville: boolean
  raw: string
}

export interface GroupedVerse {
  id: string
  title?: string
  content: string
}

export interface SongSubverse {
  id: string
  text: string
}

export interface SongVerseGroup {
  id: string
  title?: string
  slides: SongSubverse[]
}