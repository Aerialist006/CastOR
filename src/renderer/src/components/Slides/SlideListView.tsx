import { useMemo, useState } from 'react'
import type { Presentation } from '@/types/presentation'
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
import { ArrowUpDown, Plus, Trash2, MonitorPlay } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SlideListViewProps {
  presentations: Presentation[]
  search: string
  onAddToSchedule: (presentation: Presentation) => void
  onOpen: (presentation: Presentation) => void
  onDelete: (presentation: Presentation) => void
}

export function SlideListView({
  presentations,
  search,
  onAddToSchedule,
  onOpen,
  onDelete
}: SlideListViewProps) {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])

  const filtered = useMemo(
    () =>
      presentations.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.fileName.toLowerCase().includes(search.toLowerCase())
      ),
    [presentations, search]
  )

  const columns = useMemo<ColumnDef<Presentation>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 text-xs" onClick={() => column.toggleSorting()}>
            {t('slide.title', 'Title')} <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium truncate max-w-40 block">{row.original.title}</span>
        )
      },
      {
        accessorKey: 'fileType',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 text-xs" onClick={() => column.toggleSorting()}>
            {t('slide.type', 'Type')} <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.original.fileType.toUpperCase()}</span>
      },
      {
        accessorKey: 'slideCount',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 text-xs" onClick={() => column.toggleSorting()}>
            {t('slide.count', 'Slides')} <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.original.slideCount}</span>
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
                onAddToSchedule(row.original)
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(row.original)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      }
    ],
    [t, onAddToSchedule, onDelete]
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
        <MonitorPlay className="h-8 w-8 opacity-30" />
        <p className="text-xs">{search ? t('slide.noResults', 'No results') : t('slide.empty', 'No presentations yet')}</p>
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
                onDoubleClick={() => onOpen(row.original)}
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