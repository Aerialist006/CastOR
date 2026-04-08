import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { BibleTranslation } from '../../../types/bible'
import { Input } from '@/components/ui/input'

interface Props {
  bible: BibleTranslation | undefined
  onNavigate: (book: string, chapter: number, verse: number) => void
  onStartTyping?: () => void // ← add this
}

type Stage = 'book' | 'chapter' | 'verse'

interface Parsed {
  stage: Stage
  book?: string
  chapter?: number
  bookQuery?: string
  chapterQuery?: string
  verseQuery?: string
}

function parseInput(input: string, bookNames: string[]): Parsed {
  const colonIdx = input.indexOf(':')
  const spaceIdx = input.indexOf(' ')

  if (colonIdx !== -1) {
    const beforeColon = input.slice(0, colonIdx)
    const lastSpace = beforeColon.lastIndexOf(' ')
    if (lastSpace !== -1) {
      const bookPart = beforeColon.slice(0, lastSpace)
      const chStr = beforeColon.slice(lastSpace + 1)
      const chapter = parseInt(chStr, 10)
      const matchedBook = bookNames.find((b) => b.toLowerCase() === bookPart.toLowerCase())

      if (matchedBook && !isNaN(chapter)) {
        return {
          stage: 'verse',
          book: matchedBook,
          chapter,
          verseQuery: input.slice(colonIdx + 1)
        }
      }
    }

    return { stage: 'book', bookQuery: input }
  }

  if (spaceIdx !== -1) {
    const bookPart = input.slice(0, spaceIdx)
    const exactBook = bookNames.find((b) => b.toLowerCase() === bookPart.toLowerCase())

    if (exactBook) {
      return {
        stage: 'chapter',
        book: exactBook,
        chapterQuery: input.slice(spaceIdx + 1)
      }
    }
  }

  return { stage: 'book', bookQuery: input }
}

function getSuggestions(parsed: Parsed, bible: BibleTranslation, max = 8): string[] {
  if (parsed.stage === 'book') {
    const q = (parsed.bookQuery ?? '').toLowerCase()
    if (!q) return []
    return bible.bookNames.filter((b) => b.toLowerCase().includes(q)).slice(0, max)
  }

  if (parsed.stage === 'chapter' && parsed.book) {
    const bookData = bible.books.get(parsed.book)
    if (!bookData) return []

    const q = parsed.chapterQuery ?? ''
    const results: string[] = []

    for (let c = 1; c <= bookData.chapterCount; c++) {
      if (String(c).startsWith(q)) {
        results.push(`${parsed.book} ${c}:`)
        if (results.length >= max) break
      }
    }

    return results
  }

  if (parsed.stage === 'verse' && parsed.book && parsed.chapter) {
    const chData = bible.books.get(parsed.book)?.chapters.get(parsed.chapter)
    if (!chData) return []

    const q = parsed.verseQuery ?? ''
    const results: string[] = []

    for (let v = 1; v <= chData.verseCount; v++) {
      if (String(v).startsWith(q)) {
        results.push(`${parsed.book} ${parsed.chapter}:${v}`)
        if (results.length >= max) break
      }
    }

    return results
  }

  return []
}

function resolveRef(
  suggestion: string,
  bookNames: string[]
): { book: string; chapter: number; verse: number } | null {
  const colonIdx = suggestion.indexOf(':')
  if (colonIdx === -1) return null

  const beforeColon = suggestion.slice(0, colonIdx)
  const lastSpace = beforeColon.lastIndexOf(' ')
  if (lastSpace === -1) return null

  const book = beforeColon.slice(0, lastSpace)
  const chapter = parseInt(beforeColon.slice(lastSpace + 1), 10)
  const verse = parseInt(suggestion.slice(colonIdx + 1), 10)

  const matchedBook = bookNames.find((b) => b.toLowerCase() === book.toLowerCase())
  if (!matchedBook || isNaN(chapter) || isNaN(verse)) return null

  return { book: matchedBook, chapter, verse }
}

export function BibleSearchBar({ bible, onNavigate, onStartTyping }: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const bookNames = bible?.bookNames ?? []

  useEffect(() => {
    if (!bible || !value.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const parsed = parseInput(value, bookNames)
    const sugs = getSuggestions(parsed, bible)
    setSuggestions(sugs)
    setActiveIndex(0)
    setOpen(sugs.length > 0)
  }, [value, bible, bookNames])

  const accept = useCallback(
    (suggestion: string) => {
      const ref = resolveRef(suggestion, bookNames)

      if (ref) {
        setValue(suggestion)
        setOpen(false)
        onNavigate(ref.book, ref.chapter, ref.verse)
        return
      }

      setValue(suggestion.endsWith(':') ? suggestion : `${suggestion} `)
      setOpen(false)
      inputRef.current?.focus()
    },
    [bookNames, onNavigate]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      if (suggestions[activeIndex]) accept(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onStartTyping?.()
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => value && setOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t('dashboard.bibleQuick')}
      />

      {open && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover shadow-xl">
          {suggestions.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => accept(s)}
              className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                i === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'text-popover-foreground hover:bg-accent/50'
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
