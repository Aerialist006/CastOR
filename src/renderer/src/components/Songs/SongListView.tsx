import { useState, useMemo } from 'react'
import { Song } from '@/types/song'
import { useTranslation } from 'react-i18next'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Eye, Plus, Music } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SongListViewProps {
  songs: Song[]
  search: string
  onPreview: (song: Song) => void
  onAddToSchedule: (song: Song) => void
  onEdit: (song: Song) => void
}

export function SongListView({
  songs,
  search,
  onPreview,
  onAddToSchedule,
  onEdit
}: SongListViewProps) {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])

  const filtered = useMemo(
    () =>
      songs.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.author?.toLowerCase().includes(search.toLowerCase())
      ),
    [songs, search]
  )

  const columns = useMemo<ColumnDef<Song>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 -ml-2 text-xs"
            onClick={() => column.toggleSorting()}
          >
            {t('song.title')} <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium truncate max-w-40 block">{row.original.title}</span>
        )
      },
      {
        accessorKey: 'author',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 -ml-2 text-xs"
            onClick={() => column.toggleSorting()}
          >
            {t('song.author')} <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.author || '—'}</span>
        )
      },
      {
        accessorKey: 'tone',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 -ml-2 text-xs"
            onClick={() => column.toggleSorting()}
          >
            {t('song.tone')} <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.original.tone}</span>
      },
      {
        accessorKey: 'bpm',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 -ml-2 text-xs"
            onClick={() => column.toggleSorting()}
          >
            {t('song.bpm')} <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.original.bpm}</span>
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onPreview(row.original)
              }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onAddToSchedule(row.original)
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      }
    ],
    [t, onPreview, onAddToSchedule, onEdit]
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground gap-2 py-8">
        <Music className="h-8 w-8 opacity-30" />
        <p className="text-xs">{search ? t('song.noResults') : t('song.empty')}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0">
      <ScrollArea className="h-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="h-8 text-xs">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="group/row cursor-pointer h-9"
                onDoubleClick={() => onEdit(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-1 text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
