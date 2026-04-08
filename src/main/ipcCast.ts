import { BrowserWindow, ipcMain, screen } from 'electron' // ← add screen
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { readFile } from 'fs/promises'
import { app } from 'electron'

let castWindow: BrowserWindow | null = null

async function getConfig(): Promise<Record<string, unknown>> {
  try {
    const p = join(app.getPath('userData'), 'config.json')
    return JSON.parse(await readFile(p, 'utf-8'))
  } catch {
    return {}
  }
}

async function createCastWindow(): Promise<void> {
  const config = await getConfig()
  const monitorIndex = typeof config.castMonitorIndex === 'number' ? config.castMonitorIndex : -1 // -1 = auto: pick first non-primary

  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()

  // Resolve target display
  let target =
    monitorIndex >= 0
      ? displays[monitorIndex] // explicit index
      : (displays.find((d) => d.id !== primary.id) ?? primary) // auto: first secondary, fallback to primary

  const { x, y, width, height } = target.bounds

  castWindow = new BrowserWindow({
    x, // ← position on the right display
    y,
    width,
    height,
    fullscreen: true,
    frame: false,
    alwaysOnTop: true, // stay on top of other apps on that monitor
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    castWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/cast`)
  } else {
    castWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/cast' })
  }

  castWindow.on('closed', () => {
    castWindow = null
    BrowserWindow.getAllWindows()
      .filter((w) => !w.isDestroyed())
      .forEach((w) => w.webContents.send('cast-window-closed'))
  })
}

export function registerCastIpc(): void {
  ipcMain.handle('open-cast-window', async () => {
    if (castWindow && !castWindow.isDestroyed()) {
      castWindow.focus()
      return
    }
    await createCastWindow()
  })

  ipcMain.handle('close-cast-window', () => {
    if (castWindow && !castWindow.isDestroyed()) {
      castWindow.close()
      castWindow = null
    }
  })

  ipcMain.handle('cast:get-displays', () =>
    screen.getAllDisplays().map((d, index) => ({
      index,
      id: d.id,
      label: `Display ${index + 1}${d.id === screen.getPrimaryDisplay().id ? ' (Primary)' : ''}`,
      bounds: d.bounds,
      isPrimary: d.id === screen.getPrimaryDisplay().id
    }))
  )

  ipcMain.handle('cast:is-open', () => !!(castWindow && !castWindow.isDestroyed()))

  ipcMain.on('broadcast-live-content', (_event, payload) => {
    castWindow?.webContents.send('live-content', payload)
  })
}

export function getCastWindow(): BrowserWindow | null {
  return castWindow && !castWindow.isDestroyed() ? castWindow : null
}

ipcMain.on('close-cast-window', () => {
  if (castWindow && !castWindow.isDestroyed()) {
    castWindow.close() // 'closed' event will null it and notify main window
  }
})
