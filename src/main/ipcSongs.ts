import { ipcMain, app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'fs'
import type { Song } from '../renderer/src/types/song'

function getSongsDir(): string {
  const dir = join(app.getPath('userData'), 'songs')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export function registerSongsIpc(): void {
  ipcMain.handle('songs:getAll', (): Song[] => {
    const dir = getSongsDir()
    return readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .flatMap(f => {
        try {
          return [JSON.parse(readFileSync(join(dir, f), 'utf-8')) as Song]
        } catch {
          return []
        }
      })
  })

  ipcMain.handle('songs:save', (_, song: Song): Song => {
    writeFileSync(
      join(getSongsDir(), `${song.id}.json`),
      JSON.stringify(song, null, 2),
      'utf-8'
    )
    return song
  })

  ipcMain.handle('songs:delete', (_, id: string): string => {
    const path = join(getSongsDir(), `${id}.json`)
    if (existsSync(path)) unlinkSync(path)
    return id
  })
}