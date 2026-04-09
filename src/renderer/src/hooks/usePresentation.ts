import { useCallback, useState } from 'react'
import type { Presentation } from '@/types/presentation'

export function usePresentations() {
  const [presentations, setPresentations] = useState<Presentation[]>([])

  const addPresentation = useCallback((presentation: Presentation) => {
    setPresentations((prev) => [presentation, ...prev])
  }, [])

  const updatePresentation = useCallback((presentation: Presentation) => {
    setPresentations((prev) => prev.map((p) => (p.id === presentation.id ? presentation : p)))
  }, [])

  const deletePresentation = useCallback((id: string) => {
    setPresentations((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return {
    presentations,
    addPresentation,
    updatePresentation,
    deletePresentation
  }
}