export interface Api {
  loadBible: (filename: string) => Promise<string>
  loadConfig: () => Promise<Record<string, unknown>>
  saveConfig: (config: Record<string, unknown>) => Promise<void>
  onConfigUpdate: (cb: (saved: Record<string, unknown>) => void) => () => void
  getDisplays: () => Promise<
    Array<{
      index: number
      id: number
      label: string
      bounds: { x: number; y: number; width: number; height: number }
      isPrimary: boolean
    }>
  >
  isCastWindowOpen: () => Promise<boolean>
  toggleCastFullscreen: () => Promise<void>
  openCastWindow: () => void
  closeCastWindow: () => void
  castWindowReady: () => void
  castWindowClosed: (cb: () => void) => () => void
  onCastWindowReady: (cb: () => void) => () => void
  onCastWindowClosed: (cb: () => void) => () => void
  broadcastLiveContent: (payload: unknown) => void
  onLiveContentUpdate: (cb: (payload: unknown) => void) => () => void
  sendVerseDoubleClick: (verse: unknown) => void
  onVerseDoubleClick: (cb: (verse: unknown) => void) => () => void
  songs: {
    getAll: () => Promise<Song[]>
    save: (song: Song) => Promise<Song>
    delete: (id: string) => Promise<string>
  }
  openFoldbackWindow: () => Promise<void>
  closeFoldbackWindow: () => Promise<void>
  foldbackWindowReady: () => void
  broadcastFoldbackContent: (payload: unknown) => void
  onFoldbackContentUpdate: (cb: (payload: any) => void) => () => void
  onFoldbackWindowReady: (cb: () => void) => () => void
  onFoldbackWindowClosed: (cb: () => void) => () => void
}

declare global {
  interface Window {
    api: Api
  }
}
