import { ExternalLink, Pickaxe, Swords } from 'lucide-react'
import type { DashboardData } from '../lib/schemas'
import type { Currency } from '../lib/format'
import { LabelBadge } from './LabelBadge'
import { ReinforcementCalculator } from './ReinforcementCalculator'
import { Card } from './ui/card'

interface F2PoolBossBattleProps {
  battle: DashboardData['bossBattle']
  clock: DashboardData['battleClock']
  bitcoinUsd: number | null
  psuAnnualUsd: number
  currency: Currency
}

export function F2PoolBossBattle(props: F2PoolBossBattleProps) {
  const { battle } = props
  return (
    <section className="section boss-section" id="boss">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">Seven-day hash-rate comparison</p>
          <h2>F2Pool Boss Battle</h2>
          <p>Wang Chun is the astronaut. F2Pool is the boss bar. The numbers remain sourced and literal.</p>
        </div>
        <LabelBadge label="SATIRICAL BOSS BATTLE" />
      </div>
      <div className="versus-grid">
        <Card className="army-card">
          <Pickaxe size={38} />
          <p className="eyebrow">BIP-110 signaling army</p>
          <h3>{battle.bip110WindowEhS.toFixed(2)} EH/s</h3>
          <p>{battle.bip110SignalBlocks} signal blocks across {battle.bip110ObservedBlocks} observed blocks.</p>
          <div className="boss-meter"><span style={{ width: `${battle.progressPct ?? 0}%` }} /></div>
          <small>{battle.progressPct?.toFixed(1) ?? '—'}% of the F2Pool comparison bar</small>
          <a href={battle.sources.bip110} target="_blank" rel="noreferrer">BIP-110 block source <ExternalLink size={13} /></a>
        </Card>
        <div className="versus-mark" aria-hidden="true"><Swords size={42} /><strong>VS</strong></div>
        <Card className="boss-card">
          <img
            className="boss-portrait"
            src={`${import.meta.env.BASE_URL}assets/caricatures/wang-chun-boss.webp`}
            alt="Editorial caricature of Wang Chun in an astronaut suit representing the F2Pool boss comparison."
          />
          <div className="boss-card-copy">
            <p className="eyebrow">Wang Chun // F2Pool</p>
            <h3>{battle.f2poolWindowEhS === null ? 'Unavailable' : `${battle.f2poolWindowEhS.toFixed(2)} EH/s`}</h3>
            <p>{battle.f2poolSharePct === null ? 'Public pool share unavailable.' : `${battle.f2poolSharePct.toFixed(2)}% of the public seven-day pool estimate.`}</p>
            <div className="boss-health"><span /></div>
            <a href={battle.sources.f2pool} target="_blank" rel="noreferrer">F2Pool seven-day source <ExternalLink size={13} /></a>
          </div>
        </Card>
      </div>
      <Card className="boss-quote">
        <blockquote>“{battle.quote.text}”</blockquote>
        <a href={battle.quote.sourceUrl} target="_blank" rel="noreferrer">
          Wang Chun · {battle.quote.date} <ExternalLink size={13} />
        </a>
      </Card>
      <ReinforcementCalculator {...props} />
    </section>
  )
}
