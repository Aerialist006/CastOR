interface Window {
  api: {
    isCastWindowOpen(): unknown
    onCastWindowClosed(arg0: () => void): unknown
    loadBible: (filename: string) => Promise<string>
    loadConfig: () => Promise<Record<string, unknown>>
    saveConfig: (config: object) => Promise<void>
    broadcastLiveContent: (payload: { content: unknown; config?: unknown }) => void
    onLiveContentUpdate: (cb: (payload: any) => void) => () => void
    onConfigUpdate: (cb: (config: any) => void) => () => void
    getDisplays: () => Promise<any[]>
    openCastWindow: () => Promise<void>
    closeCastWindow: () => Promise<void>
    castWindowClosed: (cb: () => void) => () => void
    castWindowReady: () => void
    onCastWindowReady: (cb: () => void) => () => void
    songs: {
      getAll: () => Promise<Song[]>
      save: (song: Song) => Promise<Song>
      delete: (id: string) => Promise<string>
    }
  }
}
