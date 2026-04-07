import { useState, useEffect } from 'react'
import type { Song } from '../types/song'

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.songs.getAll()
      .then(setSongs)
      .finally(() => setLoading(false))
  }, [])

  const addSong = async (song: Song) => {
    await window.api.songs.save(song)
    setSongs(prev => [...prev, song])
  }

  const updateSong = async (song: Song) => {
    await window.api.songs.save(song)
    setSongs(prev => prev.map(s => s.id === song.id ? song : s))
  }

  const deleteSong = async (id: string) => {
    await window.api.songs.delete(id)
    setSongs(prev => prev.filter(s => s.id !== id))
  }

  return { songs, loading, addSong, updateSong, deleteSong }
}