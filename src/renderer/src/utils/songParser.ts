import { ParsedVerse, ParsedLine, ParsedChord, GroupedVerse, SongVerseGroup } from '@/types/song'
import { transposeSongContent } from './chordTransposer'

const VERSE_TITLE_RE = /^\[(.+)\]$/
const CHORD_TOKEN_RE = /\{&([^}]+)\}/

export function parseSong(content: string): ParsedVerse[] {
  const lines = content.split('\n')
  const verses: ParsedVerse[] = []
  let current: ParsedVerse | null = null
  let unnamedCount = 0

  const flush = () => {
    if (current && current.lines.some((l) => l.type !== 'empty')) {
      verses.push(current)
    }
    current = null
  }

  for (const raw of lines) {
    const titleMatch = raw.match(VERSE_TITLE_RE)
    if (titleMatch) {
      flush()
      current = { title: titleMatch[1], lines: [] }
    } else if (raw.trim() === '') {
      if (current) {
        if (!current.title) flush()
        else current.lines.push({ type: 'empty', content: '' })
      }
    } else {
      if (!current) {
        current = { title: `__unnamed_${unnamedCount++}`, lines: [] }
      }
      current.lines.push(parseLine(raw))
    }
  }
  flush()
  return verses
}

function parseLine(raw: string): ParsedLine {
  if (!CHORD_TOKEN_RE.test(raw)) return { type: 'text', content: raw }
  const chords: ParsedChord[] = []
  const re = /\{&([^}]+)\}/g
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null) {
    const symbol = match[1]
    chords.push({ symbol, isNashville: /^[b#]?\d/.test(symbol), raw: match[0] })
  }
  return { type: 'chord', content: raw, chords }
}

export function stripChords(content: string): string {
  return content
    .replace(/\{&[^}]+\}/g, '')
    .replace(/ {2,}/g, ' ')
    .trim()
}

export function groupVerses(content: string): GroupedVerse[] {
  const parsed = parseSong(content)
  const groups = new Map<string, { title?: string; lines: string[] }>()
  const order: string[] = []

  for (const verse of parsed) {
    const isUnnamed = !verse.title || verse.title.startsWith('__unnamed_')
    // ── Fix: unnamed sections use a stable unique key so they don't merge ──
    const key = isUnnamed ? `__unnamed_${order.length}` : verse.title!
    const displayTitle = isUnnamed ? undefined : verse.title

    const textLines = verse.lines
      .filter((l) => l.type !== 'empty')
      .map((l) => stripChords(l.content))
      .filter(Boolean)

    if (!groups.has(key)) {
      groups.set(key, { title: displayTitle, lines: [] })
      order.push(key)
    }

    const group = groups.get(key)!
    if (group.lines.length > 0) group.lines.push('')
    group.lines.push(...textLines)
  }

  return order.map((key) => {
    const group = groups.get(key)!
    return {
      id: crypto.randomUUID(),
      title: group.title,
      content: group.lines.join('\n')
    }
  })
}

export function getVersePreview(content: string, maxLines = 2): string {
  return content
    .split('\n')
    .filter((l) => l.trim())
    .slice(0, maxLines)
    .join(' / ')
}

export function buildSongGroups(
  content: string,
  fromKey?: string,
  toKey?: string
): SongVerseGroup[] {
  const source =
    fromKey && toKey && fromKey !== toKey ? transposeSongContent(content, fromKey, toKey) : content

  const parsed = parseSong(source)
  const groupMap = new Map<string, SongVerseGroup>()
  const order: string[] = []

  for (const verse of parsed) {
    const isUnnamed = !verse.title || verse.title.startsWith('__unnamed_')
    const key = isUnnamed ? `__unnamed_${order.length}` : verse.title!
    const displayTitle = isUnnamed ? undefined : verse.title

    if (!groupMap.has(key)) {
      groupMap.set(key, { id: crypto.randomUUID(), title: displayTitle, slides: [] })
      order.push(key)
    }

    const nonEmpty = verse.lines.filter((l) => l.type !== 'empty')
    const text = nonEmpty
      .map((l) => stripChords(l.content))
      .filter(Boolean)
      .join('\n')
    const rawText = nonEmpty
      .map((l) => l.content)
      .filter(Boolean)
      .join('\n')

    if (text) {
      groupMap.get(key)!.slides.push({ id: crypto.randomUUID(), text, rawText })
    }
  }

  return order.map((k) => groupMap.get(k)!)
}
