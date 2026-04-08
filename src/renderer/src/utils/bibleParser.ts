import type { BibleTranslation, BookData, ChapterData } from '../types/bible'

export async function parseBible(
  filename: string,
  id: string,
  name: string,
  abbreviation: string,
  language: 'en' | 'es'
): Promise<BibleTranslation> {
  const raw: string = await window.api.loadBible(filename)
  const xmlText = raw.replace(/encoding="[^"]*"/i, 'encoding="UTF-8"')

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')

  if (doc.querySelector('parsererror')) {
    throw new Error(`XML parse error in ${filename}`)
  }

  const books = new Map<string, BookData>()
  const bookNames: string[] = []

  doc.querySelectorAll('b').forEach((bookEl) => {
    const bookName = bookEl.getAttribute('n') ?? ''
    const chapters = new Map<number, ChapterData>()

    bookEl.querySelectorAll('c').forEach((chEl) => {
      const chNum = Number(chEl.getAttribute('n'))
      const verses = new Map<number, string>()

      chEl.querySelectorAll('v').forEach((vEl) => {
        verses.set(Number(vEl.getAttribute('n')), vEl.textContent ?? '')
      })

      chapters.set(chNum, { number: chNum, verseCount: verses.size, verses })
    })

    books.set(bookName, { name: bookName, chapterCount: chapters.size, chapters })
    bookNames.push(bookName)
  })

  return { id, name, abbreviation, language, books, bookNames }
}