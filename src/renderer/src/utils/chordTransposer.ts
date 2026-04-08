export const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'])

// Passthrough tokens — never attempt to transpose these
const SKIP_RE = /^(N\.?C\.?|%|x+)$/i

function noteIndex(note: string): number {
  const s = SHARP.indexOf(note)
  return s !== -1 ? s : FLAT.indexOf(note)
}

function parseChord(chord: string): { root: string; quality: string } | null {
  const match = chord.match(/^([A-G][#b]?)(.*)$/)
  return match ? { root: match[1], quality: match[2] } : null
}

export function transposeChord(chord: string, fromKey: string, toKey: string): string {
  if (SKIP_RE.test(chord)) return chord

  // ── Slash chords: G/B, Am/E, D/F# ──────────────────────────────────────
  const slashIdx = chord.indexOf('/')
  if (slashIdx !== -1) {
    const main = chord.slice(0, slashIdx)
    const bass = chord.slice(slashIdx + 1)
    return `${transposeChord(main, fromKey, toKey)}/${transposeChord(bass, fromKey, toKey)}`
  }

  const parsed = parseChord(chord)
  if (!parsed) return chord

  const fromIdx = noteIndex(fromKey)
  const toIdx = noteIndex(toKey)
  const rootIdx = noteIndex(parsed.root)
  if (rootIdx === -1 || fromIdx === -1 || toIdx === -1) return chord

  const semitones = (toIdx - fromIdx + 12) % 12
  const chromatic = FLAT_KEYS.has(toKey) ? FLAT : SHARP
  return chromatic[(rootIdx + semitones) % 12] + parsed.quality
}

// Nashville number (e.g. "1", "b7", "4m") → chord name in given key
export function nashvilleToChord(degree: string, key: string): string {
  const match = degree.match(/^([b#]?)(\d)(.*)$/)
  if (!match) return degree

  const [, acc, numStr, quality] = match
  const num = parseInt(numStr) - 1
  if (num < 0 || num > 6) return degree

  const keyIdx = noteIndex(key)
  if (keyIdx === -1) return degree

  let semitones = MAJOR_SCALE[num]
  if (acc === 'b') semitones = (semitones - 1 + 12) % 12
  else if (acc === '#') semitones = (semitones + 1) % 12

  const chromatic = FLAT_KEYS.has(key) ? FLAT : SHARP
  return chromatic[(keyIdx + semitones) % 12] + quality
}

export function transposeSongContent(content: string, fromKey: string, toKey: string): string {
  if (fromKey === toKey) return content
  return content.replace(/\{&([^}]+)\}/g, (_match, symbol) => {
    // Nashville numbers stay as-is — they're key-relative, not absolute
    if (/^[b#]?\d/.test(symbol)) return _match
    return `{&${transposeChord(symbol, fromKey, toKey)}}`
  })
}