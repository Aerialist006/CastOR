import { useEffect, useState } from 'react'
import { AppConfig, DEFAULT_CONFIG } from '../lib/appConfig'

export function useAppConfig() {
  const [config, setConfigState] = useState<AppConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    window.api?.loadConfig()?.then((saved: Partial<AppConfig>) => {
      setConfigState({ ...DEFAULT_CONFIG, ...saved })
    })
  }, [])

  function setConfig(partial: Partial<AppConfig>) {
    const next = { ...config, ...partial }
    setConfigState(next)
    window.api.saveConfig(next)
  }

  return { config, setConfig }
}