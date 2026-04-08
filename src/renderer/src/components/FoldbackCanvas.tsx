import { useMemo } from 'react'
import type { FoldbackPayload } from '@/types/foldback'
import { nashvilleToChord } from '@/utils/chordTransposer'

// ── Regex (one backslash before { is correct) ──────────────────────────────
const CHORD_TOKEN_RE = /\{&([^}]+)\}/g

interface ChordSegment {
  chord?: string
  text: string
}

function resolveChord(symbol: string, songKey?: string): string {
  if (!songKey) return symbol
  // Nashville: b3, 4, #5, 1m, etc.
  if (/^[b#]?\d/.test(symbol)) return nashvilleToChord(symbol, songKey)
  return symbol
}

function parseChordLine(raw: string, songKey?: string): ChordSegment[] {
  const segments: ChordSegment[] = []
  let last = 0
  const re = new RegExp(CHORD_TOKEN_RE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null) {
    if (match.index > last) segments.push({ text: raw.slice(last, match.index) })
    segments.push({ chord: resolveChord(match[1], songKey), text: '' })
    last = match.index + match[0].length
  }
  if (last < raw.length) segments.push({ text: raw.slice(last) })
  return segments
}

function stripTokens(raw: string): string {
  return raw.replace(CHORD_TOKEN_RE, '').replace(/ {2,}/g, ' ').trim()
}

function ChordLine({
  raw,
  fontSize,
  songKey
}: {
  raw: string
  fontSize: number
  songKey?: string
}) {
  const segments = useMemo(() => parseChordLine(raw, songKey), [raw, songKey])
  const hasChords = segments.some((s) => s.chord !== undefined)
  const lyricText = segments
    .map((s) => s.text)
    .join('')
    .replace(/\s+/g, '')
    .trim()

  // Plain lyric line
  if (!hasChords) {
    return (
      <div style={{ fontSize, lineHeight: 1.4 }} className="text-white">
        {raw}
      </div>
    )
  }

  // Pure chord line — no lyric text
  if (!lyricText) {
    return (
      <div
        style={{ fontSize, lineHeight: 1.4, whiteSpace: 'pre' }}
        className="text-yellow-300 font-mono"
      >
        {segments.map((s) => s.chord ?? s.text).join('')}
      </div>
    )
  }

  // Mixed: chord above syllable
  return (
    <div className="flex flex-wrap items-end" style={{ lineHeight: 1 }}>
      {segments.map((seg, i) => (
        <span key={i} className="inline-flex flex-col items-start">
          <span
            style={{ fontSize, lineHeight: 1.1 }}
            className="text-yellow-300 font-mono font-bold whitespace-pre min-w-[0.4ch]"
          >
            {seg.chord ?? ' '}
          </span>
          <span style={{ fontSize, lineHeight: 1.4 }} className="text-white whitespace-pre">
            {seg.text || (seg.chord !== undefined ? '\u00A0' : '')}
          </span>
        </span>
      ))}
    </div>
  )
}

// ── Next sidebar ───────────────────────────────────────────────────────────

function NextSidebar({
  label,
  lines,
  fontSize
}: {
  label?: string
  lines: string[]
  fontSize: number
}) {
  return (
    <div
      className="shrink-0 border-l border-white/10 bg-zinc-900 flex flex-col p-3 gap-1.5 overflow-hidden"
      style={{ width: `${Math.max(80, fontSize * 10)}px` }}
    >
      <div
        className="text-white/40 uppercase tracking-widest font-semibold"
        style={{ fontSize: fontSize * 0.5 }}
      >
        Next
      </div>
      {label && (
        <div
          className="text-white/70 font-bold uppercase tracking-wide truncate"
          style={{ fontSize: fontSize * 0.55 }}
        >
          {label}
        </div>
      )}
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {lines.slice(0, 4).map((line, i) => (
          <div key={i} className="text-white/50 truncate" style={{ fontSize: fontSize * 0.75 }}>
            {stripTokens(line)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main canvas ────────────────────────────────────────────────────────────

interface FoldbackCanvasProps {
  payload: FoldbackPayload | null
  showChords?: boolean
  showNext?: boolean
  fontSize?: number
  songKey?: string // ← needed to resolve Nashville numbers
}

export function FoldbackCanvas({
  payload,
  showChords = true,
  showNext = true,
  fontSize = 120,
  songKey
}: FoldbackCanvasProps) {
  const current = payload?.current ?? null
  const next = payload?.next ?? null

  // ── Blank ────────────────────────────────────────────────────────────────
  if (!current || current.type === 'blank') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <span className="text-white/20 font-mono" style={{ fontSize: fontSize * 0.5 }}>
          ●
        </span>
      </div>
    )
  }

  // ── Song ─────────────────────────────────────────────────────────────────
  if (current.type === 'song') {
    const lines = current.rawLines ?? current.cleanText?.split('\n') ?? []
    const nextLines = next?.rawLines ?? next?.cleanText?.split('\n') ?? []

    return (
      <div className="w-full h-full flex bg-zinc-950 overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col p-6 gap-1 overflow-hidden">
          {current.verseTitle && (
            <div
              className="text-yellow-400 font-bold uppercase tracking-widest mb-2"
              style={{ fontSize: fontSize * 0.55 }}
            >
              {current.verseTitle}
            </div>
          )}
          <div className="flex flex-col gap-1 overflow-hidden">
            {lines.map((line, i) => (
              <div key={i}>
                {showChords ? (
                  <ChordLine raw={line} fontSize={fontSize} songKey={songKey} />
                ) : (
                  <div style={{ fontSize, lineHeight: 1.5 }} className="text-white">
                    {stripTokens(line)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {showNext && next && next.type !== 'blank' && (
          <NextSidebar label={next.verseTitle} lines={nextLines} fontSize={fontSize} />
        )}
      </div>
    )
  }

  // ── Bible ─────────────────────────────────────────────────────────────────
  if (current.type === 'bible') {
    const nextLines = next?.cleanText
      ? next.cleanText.split(' ').reduce<string[]>((acc, word, i) => {
          const lineIdx = Math.floor(i / 6)
          acc[lineIdx] = acc[lineIdx] ? acc[lineIdx] + ' ' + word : word
          return acc
        }, [])
      : []

    return (
      <div className="w-full h-full flex bg-zinc-950 overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col justify-center p-6 gap-3 overflow-hidden">
          {current.reference && (
            <div
              className="text-yellow-400 font-bold uppercase tracking-widest"
              style={{ fontSize: fontSize * 0.75 }}
            >
              {current.reference}
            </div>
          )}
          <div style={{ fontSize, lineHeight: 1.5 }} className="text-white overflow-hidden">
            {current.cleanText}
          </div>
        </div>

        {showNext && next && next.type !== 'blank' && (
          <NextSidebar
            label={next.reference ?? next.verseTitle}
            lines={nextLines}
            fontSize={fontSize}
          />
        )}
      </div>
    )
  }

  return null
}
