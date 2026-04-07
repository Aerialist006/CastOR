import { useEffect } from 'react'
import { FONT_OPTIONS } from '@/lib/fontOptions'

/**
 * Dynamically injects a Google Fonts <link> into the document head
 * when the selected fontFamily requires one. Safe to call multiple times.
 */
export function useFontLoader(fontFamily: string) {
  useEffect(() => {
    const option = FONT_OPTIONS.find((f) => f.value === fontFamily)
    if (!option?.googleFont) return

    const id = `gfont-${option.googleFont}`
    if (document.getElementById(id)) return  // already loaded

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${option.googleFont}:wght@400;700&display=swap`
    document.head.appendChild(link)
  }, [fontFamily])
}