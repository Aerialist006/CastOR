import { app, ipcMain } from 'electron'
import { readFile }     from 'fs/promises'
import { existsSync }   from 'fs'
import { join }         from 'path'

function getBiblesDir(): string {
  if (app.isPackaged) return join(process.resourcesPath, 'bibles')
  const candidates = [
    join(__dirname, '../../resources/bibles'),
    join(__dirname, '../../../resources/bibles'),
    join(process.cwd(), 'resources/bibles'),
  ]
  return candidates.find(existsSync) ?? candidates[0]
}

export function registerBibleIpc(): void {
  ipcMain.handle('bible:load', async (_event, filename: string) => {
    const safe = filename.replace(/[^a-zA-Z0-9_.\-]/g, '')
    const buf  = await readFile(join(getBiblesDir(), safe))
    return buf.toString('latin1')
  })
}