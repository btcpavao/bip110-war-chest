import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Download, ExternalLink, Search } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import type { SignalingBlock } from '../lib/schemas'
import { formatInteger, formatSatsAsBtc } from '../lib/format'
import { LabelBadge } from './LabelBadge'

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ChevronUp size={14} />
  if (direction === 'desc') return <ChevronDown size={14} />
  return null
}

export function SignalLedger({ blocks }: { blocks: SignalingBlock[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'height', desc: true }])
  const [search, setSearch] = useState('')
  const [pool, setPool] = useState('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)
  const pools = useMemo(
    () => ['ALL', ...new Set(blocks.map((block) => block.pool.name))],
    [blocks],
  )
  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return blocks.filter((block) => {
      const matchesPool = pool === 'ALL' || block.pool.name === pool
      const matchesSearch =
        normalized.length === 0 ||
        String(block.height).includes(normalized) ||
        block.hash.toLowerCase().includes(normalized)
      return matchesPool && matchesSearch
    })
  }, [blocks, pool, search])

  const columns = useMemo<ColumnDef<SignalingBlock>[]>(
    () => [
      {
        accessorKey: 'height',
        header: 'Block',
        cell: ({ row }) => (
          <button
            className="block-link"
            type="button"
            onClick={() => setExpanded(expanded === row.original.hash ? null : row.original.hash)}
          >
            #{formatInteger(row.original.height)}
          </button>
        ),
      },
      { accessorKey: 'date', header: 'Date' },
      { accessorFn: (row) => row.pool.name, id: 'pool', header: 'Pool' },
      {
        accessorKey: 'versionHex',
        header: 'Version',
        cell: ({ getValue }) => <code>{String(getValue())}</code>,
      },
      {
        accessorKey: 'impliedEhDays',
        header: 'Implied EH-days',
        cell: ({ getValue }) => Number(getValue()).toFixed(3),
      },
      {
        accessorKey: 'marketCostSats',
        header: 'Market cost',
        cell: ({ getValue }) =>
          getValue() === null ? <span className="muted">Unavailable</span> : formatSatsAsBtc(Number(getValue())),
      },
      {
        accessorKey: 'totalMiningRevenueSats',
        header: 'Mining revenue',
        cell: ({ getValue }) => formatSatsAsBtc(Number(getValue())),
      },
      {
        accessorKey: 'filterTaxSats',
        header: 'Filter tax',
        cell: ({ getValue }) =>
          getValue() === null ? <span className="muted">Unclassified</span> : formatSatsAsBtc(Number(getValue())),
      },
      {
        accessorKey: 'confidence',
        header: 'Confidence',
        cell: ({ getValue }) => <span className="confidence">{String(getValue())}</span>,
      },
    ],
    [expanded],
  )
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="ledger-wrap">
      <div className="ledger-controls">
        <label className="search-control">
          <Search size={16} />
          <span className="sr-only">Search by block height or hash</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Block height or hash"
          />
        </label>
        <label>
          <span className="sr-only">Filter by pool</span>
          <select value={pool} onChange={(event) => setPool(event.target.value)}>
            {pools.map((name) => (
              <option key={name} value={name}>
                {name === 'ALL' ? 'All pools' : name}
              </option>
            ))}
          </select>
        </label>
        <a className="export-button" href={`${import.meta.env.BASE_URL}data/signaling-blocks.csv`} download>
          <Download size={15} /> CSV
        </a>
        <a className="export-button" href={`${import.meta.env.BASE_URL}data/signaling-blocks.json`} download>
          <Download size={15} /> JSON
        </a>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon direction={header.column.getIsSorted()} />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {expanded === row.original.hash ? (
                  <tr className="expanded-row">
                    <td colSpan={columns.length}>
                      <div className="expanded-grid">
                        <div>
                          <LabelBadge label="VERIFIED" />
                          <h4>Signal evidence</h4>
                          <code>{row.original.versionHex}</code>
                          <p>BIP9 top bits + bit 4 independently classified.</p>
                        </div>
                        <div>
                          <h4>Pool attribution</h4>
                          <strong>{row.original.pool.name}</strong>
                          <p>{row.original.pool.attributionCaveat}</p>
                        </div>
                        <div>
                          <h4>Reward</h4>
                          <p>Subsidy: {formatSatsAsBtc(row.original.blockSubsidySats)}</p>
                          <p>Fees: {formatInteger(row.original.transactionFeesSats)} sats</p>
                        </div>
                        <a
                          href={`https://mempool.space/block/${row.original.hash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open block explorer <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-caption">
        Showing {table.getRowModel().rows.length} of {blocks.length} independently classified signaling blocks.
      </p>
    </div>
  )
}
