export interface FontOption {
  value: string
  label: string
  googleFont: string | null // null = system font, no fetch needed
}

export const FONT_OPTIONS: FontOption[] = [
  { value: 'Inter, sans-serif', label: 'Inter', googleFont: 'Inter' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans', googleFont: 'Open+Sans' },
  { value: 'Lato, sans-serif', label: 'Lato', googleFont: 'Lato' },
  { value: 'Roboto, sans-serif', label: 'Roboto', googleFont: 'Roboto' },
  { value: '"Noto Sans", sans-serif', label: 'Noto Sans', googleFont: 'Noto+Sans' },
  { value: '"Playfair Display", serif', label: 'Playfair Display', googleFont: 'Playfair+Display' },
  { value: '"EB Garamond", serif', label: 'EB Garamond', googleFont: 'EB+Garamond' },
  {
    value: '"Libre Baskerville", serif',
    label: 'Libre Baskerville',
    googleFont: 'Libre+Baskerville'
  },
  { value: 'Merriweather, serif', label: 'Merriweather', googleFont: 'Merriweather' },
  { value: '"Source Serif 4", serif', label: 'Source Serif 4', googleFont: 'Source+Serif+4' },
  { value: 'Georgia, serif', label: 'Georgia', googleFont: null },
  { value: 'Arial, sans-serif', label: 'Arial', googleFont: null },
  { value: '"Times New Roman", serif', label: 'Times New Roman', googleFont: null }
]

/** Maps an activeBibleId to its display abbreviation */
export function getBibleAbbrev(id: string): string {
  const map: Record<string, string> = {
    kjv: 'KJV',
    rv1960: 'RV1960',
    nvi: 'NVI',
    lbla: 'LBLA'
  }
  return map[id] ?? id.toUpperCase()
}
