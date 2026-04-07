import { app, ipcMain, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join }                from 'path'

const configPath = () => join(app.getPath('userData'), 'config.json')

let getCastWin: (() => BrowserWindow | null) | null = null

export function setCastWindowGetter(fn: () => BrowserWindow | null) {
  getCastWin = fn
}

export function registerConfigIpc(): void {
  ipcMain.handle('config:load', async () => {
    try   { return JSON.parse(await readFile(configPath(), 'utf-8')) }
    catch { return {} }
  })

  ipcMain.handle('config:save', async (_event, config: object) => {
    await writeFile(configPath(), JSON.stringify(config, null, 2), 'utf-8')
    getCastWin?.()?.webContents.send('config-update', config)
  })
}