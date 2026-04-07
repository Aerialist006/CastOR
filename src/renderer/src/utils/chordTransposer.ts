export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']

function noteIndex(note: string): number {
  return SHARP.indexOf(note) !== -1 ? SHARP.indexOf(note) : FLAT.indexOf(note)
}

function parseChord(chord: string): { root: string; quality: string } | null {
  const match = chord.match(/^([A-G][#b]?)(.*)$/)
  return match ? { root: match[1], quality: match[2] } : null
}

export function transposeChord(chord: string, fromKey: string, toKey: string): string {
  const parsed = parseChord(chord)
  if (!parsed) return chord

  const semitones = (noteIndex(toKey) - noteIndex(fromKey) + 12) % 12
  const rootIdx = noteIndex(parsed.root)
  if (rootIdx === -1) return chord

  const chromatic = FLAT_KEYS.includes(toKey) ? FLAT : SHARP
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
  if (acc === '#') semitones = (semitones + 1) % 12

  const chromatic = FLAT_KEYS.includes(key) ? FLAT : SHARP
  return chromatic[(keyIdx + semitones) % 12] + quality
}

export function transposeSongContent(content: string, fromKey: string, toKey: string): string {
  if (fromKey === toKey) return content
  return content.replace(/\{&([^}]+)\}/g, (match, symbol) => {
    if (/^[b#]?\d/.test(symbol)) return match // Nashville stays as-is
    return `{&${transposeChord(symbol, fromKey, toKey)}}`
  })
}