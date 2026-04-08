export interface FoldbackVerseInfo {
  type: 'song' | 'bible' | 'blank'
  verseTitle?: string
  rawLines?: string[]   // original lines WITH {&chord} tokens — for chord rendering
  cleanText?: string    // stripped fallback
  reference?: string    // bible only
}

export interface FoldbackPayload {
  current: FoldbackVerseInfo | null
  next: FoldbackVerseInfo | null
}