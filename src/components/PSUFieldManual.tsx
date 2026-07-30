import { BookOpen, ExternalLink, GraduationCap } from 'lucide-react'
import type { Currency } from '../lib/format'
import { LabelBadge } from './LabelBadge'
import { Card } from './ui/card'

interface PSUFieldManualProps {
  annualPriceUsd: number
  sourceUrl?: string
  sourceCheckedAt?: string
  historicalPsuLoss: number | null
  currency: Currency
}

export function PSUFieldManual({
  annualPriceUsd,
  sourceUrl,
  sourceCheckedAt,
  historicalPsuLoss,
  currency,
}: PSUFieldManualProps) {
  const examples = [0.76, 1, 10, 1_000]
  return (
    <section className="section psu-manual-section" id="psu">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">Quartermaster handbook · Satirical unit</p>
          <h2>PSU Field Manual</h2>
          <p>One Plebslop University Subscription is fixed at the configured annual tuition.</p>
        </div>
        <GraduationCap size={48} />
      </div>
      <div className="psu-manual-grid">
        <Card className="psu-definition">
          <BookOpen size={34} />
          <LabelBadge label="GENERAL KRATTER SCENARIO" />
          <strong>1 PSU = ${annualPriceUsd.toLocaleString('en-US')} / year</strong>
          <p>PSU is satire, not a currency, financial product or historical price index.</p>
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              Configured price source <ExternalLink size={13} />
            </a>
          ) : <small>Source not configured · price remains an explicit site setting.</small>}
          {sourceCheckedAt ? <small>Checked {new Date(sourceCheckedAt).toLocaleDateString('en-GB')}</small> : null}
        </Card>
        <div className="psu-examples">
          {examples.map((psu) => (
            <Card key={psu}>
              <span>{psu.toLocaleString('en-US')} PSU</span>
              <strong>${(psu * annualPriceUsd).toLocaleString('en-US')}</strong>
            </Card>
          ))}
          <Card className="psu-receipt">
            <span>Kratter historical-loss comparison</span>
            <strong>{historicalPsuLoss === null ? 'Evidence pending' : `${historicalPsuLoss.toFixed(2)} PSU`}</strong>
            <small>A receipt date must be pinned before this is presented as a historical comparison.</small>
          </Card>
        </div>
      </div>
      {currency === 'PSU' ? <p className="psu-active-note">Dashboard figures are currently being translated through today’s BTC/USD value into PSU.</p> : null}
    </section>
  )
}
