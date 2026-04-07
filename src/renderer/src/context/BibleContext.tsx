import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { parseBible } from '../utils/bibleParser'
import { TRANSLATION_CONFIGS, BibleTranslation } from '../types/bibleTypes'
import { AppConfig, DEFAULT_CONFIG } from '../lib/appConfig'
import { useAppConfig } from '../hooks/useAppConfig'

interface BibleContextValue {
  activeBible: BibleTranslation | undefined
  isLoading: boolean
  config: AppConfig
  setConfig: (partial: Partial<AppConfig>) => void
}

const BibleContext = createContext<BibleContextValue>({
  activeBible: undefined,
  isLoading: false,
  config: DEFAULT_CONFIG,
  setConfig: () => {},
})

export function BibleProvider({ children }: { children: ReactNode }) {
  const { config, setConfig } = useAppConfig()
  const [activeBible, setActiveBible] = useState<BibleTranslation | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const cfg = TRANSLATION_CONFIGS.find((t) => t.id === config.activeBibleId)
    if (!cfg) return

    setIsLoading(true)
    setActiveBible(undefined)

    parseBible(cfg.filename, cfg.id, cfg.name, cfg.abbreviation, cfg.language)
      .then(setActiveBible)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [config.activeBibleId])

  return (
    <BibleContext.Provider value={{ activeBible, isLoading, config, setConfig }}>
      {children}
    </BibleContext.Provider>
  )
}

export const useBibleContext = () => useContext(BibleContext)
