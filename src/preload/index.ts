import { contextBridge, ipcRenderer } from 'electron'

const api = {
  loadBible: (filename: string) => ipcRenderer.invoke('bible:load', filename),
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config: object) => ipcRenderer.invoke('config:save', config),

  onConfigUpdate: (cb: (saved: unknown) => void) => {
    const h = (_e: unknown, saved: unknown) => cb(saved)
    ipcRenderer.on('config-update', h)
    return () => ipcRenderer.removeListener('config-update', h)
  },

  getDisplays: () => ipcRenderer.invoke('cast:get-displays'),
  isCastWindowOpen: () => ipcRenderer.invoke('cast:is-open'),
  toggleCastFullscreen: () => ipcRenderer.invoke('cast:toggle-fullscreen'),
  openCastWindow: () => ipcRenderer.invoke('open-cast-window'),
  closeCastWindow: () => ipcRenderer.invoke('close-cast-window'),

  castWindowReady: () => ipcRenderer.send('cast-window-ready'),

  castWindowClosed: (cb: () => void) => {
    const h = () => cb()
    ipcRenderer.on('cast-window-closed', h)
    return () => ipcRenderer.off('cast-window-closed', h)
  },

  onCastWindowReady: (cb: () => void) => {
    const h = () => cb()
    ipcRenderer.on('cast-window-ready-relay', h)
    return () => ipcRenderer.removeListener('cast-window-ready-relay', h)
  },

  onCastWindowClosed: (cb: () => void) => {
    const h = () => cb()
    ipcRenderer.on('cast-window-closed', h)
    return () => ipcRenderer.removeListener('cast-window-closed', h)
  },

  broadcastLiveContent: (payload: unknown) => ipcRenderer.send('broadcast-live-content', payload),

  onLiveContentUpdate: (cb: (payload: unknown) => void) => {
    const h = (_e: unknown, payload: unknown) => cb(payload)
    ipcRenderer.on('live-content', h)
    return () => ipcRenderer.removeListener('live-content', h)
  },

  sendVerseDoubleClick: (verse: unknown) => ipcRenderer.send('cast:verse-double-click', verse),

  onVerseDoubleClick: (cb: (verse: unknown) => void) => {
    const h = (_e: unknown, verse: unknown) => cb(verse)
    ipcRenderer.on('verse-double-click', h)
    return () => ipcRenderer.removeListener('verse-double-click', h)
  },

  songs: {
    getAll: () => ipcRenderer.invoke('songs:getAll'),
    save: (song: unknown) => ipcRenderer.invoke('songs:save', song),
    delete: (id: string) => ipcRenderer.invoke('songs:delete', id)
  },
  openFoldbackWindow: () => ipcRenderer.invoke('open-foldback-window'),
  foldbackWindowReady: () => ipcRenderer.send('foldback-window-ready'),
  closeFoldbackWindow: () => ipcRenderer.send('close-foldback-window'),
  broadcastFoldbackContent: (payload) => ipcRenderer.send('foldback:broadcast', payload),
  onFoldbackContentUpdate: (cb) => {
    const handler = (_, payload) => cb(payload)
    ipcRenderer.on('foldback:content', handler)
    return () => ipcRenderer.removeListener('foldback:content', handler)
  },
  onFoldbackWindowReady: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('foldback-window-ready', handler)
    return () => ipcRenderer.removeListener('foldback-window-ready', handler)
  },
  onFoldbackWindowClosed: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('foldback-window-closed', handler)
    return () => ipcRenderer.removeListener('foldback-window-closed', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
// window.electron not exposed — unused
