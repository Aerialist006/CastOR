import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback
} from 'react'
import { parseBible } from '../utils/bibleParser'
import { TRANSLATION_CONFIGS, BibleTranslation } from '../types/bible'
import { AppConfig, DEFAULT_CONFIG } from '../lib/appConfig'
import { useAppConfig } from '../hooks/useAppConfig'
import type { BackgroundConfig } from '@/types/background' // ADD

interface BibleContextValue {
  activeBible: BibleTranslation | undefined
  isLoading: boolean
  config: AppConfig
  setConfig: (partial: Partial<AppConfig>) => void
  updateBackground: (bg: BackgroundConfig) => void // ADD
}

const BibleContext = createContext<BibleContextValue>({
  activeBible: undefined,
  isLoading: false,
  config: DEFAULT_CONFIG,
  setConfig: () => {},
  updateBackground: () => {} // ADD
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

  // ADD — updates background in config, persists, and broadcasts to CastWindow
  const updateBackground = useCallback(
    (bg: BackgroundConfig) => {
      setConfig({ background: bg }) // setConfig handles save + broadcast automatically
    },
    [setConfig]
  )

  return (
    <BibleContext.Provider value={{ activeBible, isLoading, config, setConfig, updateBackground }}>
      {children}
    </BibleContext.Provider>
  )
}

export const useBibleContext = () => useContext(BibleContext)
