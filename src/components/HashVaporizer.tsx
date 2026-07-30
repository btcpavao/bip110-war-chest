import { Flame, Gauge, RadioTower, Skull, Split } from 'lucide-react'
import { useState } from 'react'
import { LabelBadge } from './LabelBadge'
import { Card } from './ui/card'

const scenarios = {
  unified: {
    label: 'Unified chain',
    risk: 'LOW',
    icon: RadioTower,
    summary: 'Hash rate remains productive on one accepted history; ordinary mining and propagation risks dominate.',
  },
  temporary: {
    label: 'Temporary split',
    risk: 'MEDIUM',
    icon: Split,
    summary: 'Competing tips can orphan otherwise valid work until one branch decisively accumulates more proof of work.',
  },
  minority: {
    label: 'Minority chain',
    risk: 'HIGH',
    icon: Skull,
    summary: 'A persistent minority branch faces thin security, poor liquidity, volatile block times and a high orphaning burden.',
  },
  majority: {
    label: 'Majority branch',
    risk: 'MEDIUM / LOW',
    icon: Gauge,
    summary: 'Hash rate on the dominant branch is more likely to remain economically recognized, but reorg and coordination risk do not vanish.',
  },
} as const

type ScenarioKey = keyof typeof scenarios

export function HashVaporizer() {
  const [active, setActive] = useState<ScenarioKey>('minority')
  const selected = scenarios[active]
  const Icon = selected.icon
  return (
    <section className="section risk-section">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">Minority-chain risk chamber</p>
          <h2>The Hash Vaporizer</h2>
          <p>A qualitative map of what can happen to mining work during a chain split. This is not a probability forecast.</p>
        </div>
        <LabelBadge label="THEORETICAL SCENARIO" />
      </div>
      <div className="vaporizer-grid">
        <Card className="vapor-machine">
          <Flame size={82} />
          <div className="vapor-coils"><span /><span /><span /></div>
          <strong>{selected.risk}</strong>
          <small>qualitative risk</small>
        </Card>
        <div>
          <div className="risk-scenario-buttons">
            {(Object.entries(scenarios) as Array<[ScenarioKey, typeof selected]>).map(([key, scenario]) => (
              <button type="button" key={key} className={active === key ? 'is-active' : ''} onClick={() => setActive(key)}>
                <scenario.icon size={17} />
                {scenario.label}
              </button>
            ))}
          </div>
          <Card className="risk-readout">
            <Icon size={34} />
            <p className="eyebrow">{selected.label}</p>
            <h3>{selected.risk} RISK</h3>
            <p>{selected.summary}</p>
            <ul>
              <li>Work can become stale or orphaned.</li>
              <li>Pool identity does not reveal the ultimate hash owner.</li>
              <li>Economic acceptance and market depth remain external variables.</li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  )
}
