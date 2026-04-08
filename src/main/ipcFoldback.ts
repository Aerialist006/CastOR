import { BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let foldbackWindow: BrowserWindow | null = null
let mainWindowGetter: (() => BrowserWindow | null) | null = null
let lastFoldbackPayload: unknown = null

export function setFoldbackMainWindowGetter(getter: () => BrowserWindow | null) {
  mainWindowGetter = getter
}

export function registerFoldbackIpc(): void {
  ipcMain.handle('open-foldback-window', async () => {
    if (foldbackWindow && !foldbackWindow.isDestroyed()) {
      foldbackWindow.focus()
      return
    }

    const displays = screen.getAllDisplays()
    const display = displays[2] ?? displays[displays.length - 1]

    foldbackWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      fullscreen: true,
      frame: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    const RENDERER_URL = process.env['ELECTRON_RENDERER_URL']
    if (is.dev && RENDERER_URL) {
      foldbackWindow.loadURL(`${RENDERER_URL}#/foldback`)
    } else {
      foldbackWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: '/foldback'
      })
    }

    foldbackWindow.on('closed', () => {
      foldbackWindow = null
      mainWindowGetter?.()?.webContents.send('foldback-window-closed')
    })
  })


  ipcMain.on('foldback:broadcast', (_e, payload) => {
    lastFoldbackPayload = payload
    foldbackWindow?.webContents.send('foldback:content', payload)
  })

  ipcMain.on('foldback-window-ready', () => {
    mainWindowGetter?.()?.webContents.send('foldback-window-ready')
    if (lastFoldbackPayload && foldbackWindow && !foldbackWindow.isDestroyed()) {
      foldbackWindow.webContents.send('foldback:content', lastFoldbackPayload)
    }
  })

  ipcMain.on('close-foldback-window', () => {
    if (foldbackWindow && !foldbackWindow.isDestroyed()) {
      foldbackWindow.close()
    }
  })

  ipcMain.on('config:save', (_event, cfg) => {
    foldbackWindow?.webContents.send('config:update', cfg)
  })
}
