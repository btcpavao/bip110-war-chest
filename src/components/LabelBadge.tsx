import * as Tooltip from '@radix-ui/react-tooltip'
import { ShieldCheck, TriangleAlert, ReceiptText, Gauge, HelpCircle } from 'lucide-react'
import type { ComponentType } from 'react'

export type DataLabel =
  | 'VERIFIED'
  | 'MARKET ESTIMATE'
  | 'GENERAL KRATTER SCENARIO'
  | 'PUBLIC MEMPOOL ESTIMATE'
  | 'NO PUBLIC RECEIPT'
  | 'UNKNOWN'

const explanations: Record<DataLabel, string> = {
  VERIFIED: 'Derived directly from public blockchain data or a pinned public receipt.',
  'MARKET ESTIMATE': 'Estimated from observed block share, network hash rate and public rental-market prices.',
  'GENERAL KRATTER SCENARIO': 'Illustrative model applying an 8% loss assumption to the selected economic footprint.',
  'PUBLIC MEMPOOL ESTIMATE': 'Estimated from the public mempool.space block observer; not a miner’s private template.',
  'NO PUBLIC RECEIPT': 'No publicly verifiable financial commitment has been recorded. This does not mean zero.',
  UNKNOWN: 'The required public evidence or market coverage is not available.',
}

const icons: Record<DataLabel, ComponentType<{ size?: number }>> = {
  VERIFIED: ShieldCheck,
  'MARKET ESTIMATE': Gauge,
  'GENERAL KRATTER SCENARIO': TriangleAlert,
  'PUBLIC MEMPOOL ESTIMATE': ReceiptText,
  'NO PUBLIC RECEIPT': ReceiptText,
  UNKNOWN: HelpCircle,
}

export function LabelBadge({ label }: { label: DataLabel }) {
  const Icon = icons[label]
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className={`data-badge badge-${label.toLowerCase().replaceAll(' ', '-')}`}>
            <Icon size={12} />
            {label}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip" sideOffset={8}>
            {explanations[label]}
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
