import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Song } from '../../types/song'
import { KEYS } from '@/utils/chordTransposer'

interface SongModalProps {
  open: boolean
  onClose: () => void
  onSave: (song: Song) => void
  initial?: Partial<Song>
}

type Confirm = 'save' | 'discard' | 'close' | null

const blank = (): Partial<Song> => ({ title: '', author: '', tone: 'C', bpm: 120, content: '' })

const PLACEHOLDER = `[Verse 1]
{&C}    {&Am}
Line 1
Line 2

[Chorus]
{&1}    {&4}    {&5}
Line 1
Line 2`

export function SongModal({ open, onClose, onSave, initial }: SongModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<Song>>(initial ?? blank())
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [dirty, setDirty] = useState(false)

  const set = (field: keyof Song, value: string | number) => {
    setForm(p => ({ ...p, [field]: value }))
    setDirty(true)
  }

  const attemptClose = () => (dirty ? setConfirm('close') : onClose())

  const handleConfirm = () => {
    if (confirm === 'save') {
      const song: Song = {
        id: initial?.id ?? crypto.randomUUID(),
        title: form.title ?? '',
        author: form.author ?? '',
        tone: form.tone ?? 'C',
        bpm: form.bpm ?? 120,
        content: form.content ?? '',
        createdAt: initial?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      onSave(song)
      setDirty(false)
      onClose()
    } else if (confirm === 'discard') {
      setForm(blank())
      setDirty(false)
      onClose()
    } else {
      // close without saving
      setDirty(false)
      onClose()
    }
    setConfirm(null)
  }

  const confirmMeta: Record<NonNullable<Confirm>, { title: string; desc: string; action: string }> = {
    save: {
      title: t('song.confirm.saveTitle'),
      desc: t('song.confirm.saveDesc'),
      action: t('song.save'),
    },
    discard: {
      title: t('song.confirm.discardTitle'),
      desc: t('song.confirm.discardDesc'),
      action: t('song.discard'),
    },
    close: {
      title: t('song.confirm.closeTitle'),
      desc: t('song.confirm.closeDesc'),
      action: t('common.close'),
    },
  }

  return (
    <>
      <Dialog open={open} onOpenChange={o => { if (!o) attemptClose() }} >
        <DialogContent className="  max-w-[20dvw] max-h-[90vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {initial?.id ? t('song.editTitle') : t('song.addTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar flex-1 pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>{t('song.title')} <span className="text-destructive">*</span></Label>
                <Input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder={t('song.titlePlaceholder')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('song.author')}</Label>
                <Input
                  value={form.author}
                  onChange={e => set('author', e.target.value)}
                  placeholder={t('song.authorPlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>{t('song.tone')}</Label>
                <Select value={form.tone} onValueChange={v => set('tone', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KEYS.map(k => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('song.bpm')}</Label>
                <Input
                  type="number"
                  min={40}
                  max={300}
                  value={form.bpm}
                  onChange={e => set('bpm', parseInt(e.target.value) || 120)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <Label>{t('song.content')}</Label>
              <p className="text-xs text-muted-foreground">{t('song.contentHint')}</p>
              <Textarea
                className="min-h-[300px] font-mono text-xs resize-none flex-1"
                value={form.content}
                onChange={e => set('content', e.target.value)}
                placeholder={PLACEHOLDER}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => dirty ? setConfirm('discard') : onClose()}>
              {t('song.discard')}
            </Button>
            <Button onClick={() => setConfirm('save')} disabled={!form.title?.trim()}>
              {t('song.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm !== null} onOpenChange={o => { if (!o) setConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm && confirmMeta[confirm].title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm && confirmMeta[confirm].desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirm && confirmMeta[confirm].action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function downloadSong(song: Song) {
  const blob = new Blob([JSON.stringify(song, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${song.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.song.json`
  a.click()
  URL.revokeObjectURL(a.href)
}