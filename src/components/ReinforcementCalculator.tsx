import { useMemo, useState } from 'react'
import { Calculator, Gauge } from 'lucide-react'
import type { DashboardData } from '../lib/schemas'
import { durationDays, reinforcementCosts, type DurationPreset } from '../lib/battle'
import { formatMoney, type Currency } from '../lib/format'
import { LabelBadge } from './LabelBadge'
import { Card } from './ui/card'

interface ReinforcementCalculatorProps {
  battle: DashboardData['bossBattle']
  clock: DashboardData['battleClock']
  bitcoinUsd: number | null
  psuAnnualUsd: number
  currency: Currency
}

const presets: Array<[DurationPreset, string]> = [
  ['1h', '1 hour'],
  ['24h', '24 hours'],
  ['7d', '7 days'],
  ['untilMandatory', 'Until mandatory'],
  ['mandatoryPeriod', 'Mandatory window'],
  ['custom', 'Custom'],
]

export function ReinforcementCalculator({
  battle,
  clock,
  bitcoinUsd,
  psuAnnualUsd,
  currency,
}: ReinforcementCalculatorProps) {
  const [preset, setPreset] = useState<DurationPreset>('24h')
  const [customHours, setCustomHours] = useState(48)
  const gap = battle.reinforcementsRequiredEhS
  const days = durationDays(
    preset,
    clock.estimatedSecondsRemaining,
    clock.mandatoryEndHeight - clock.mandatoryStartHeight + 1,
    clock.rollingBlockIntervalSeconds,
    customHours,
  )
  const costs = useMemo(
    () => gap === null
      ? { floorBtc: null, kratterBtc: null, marketBtc: null }
      : reinforcementCosts(
          gap,
          days,
          battle.costScenarios.hashpriceFloorBtcPerPhDay,
          battle.costScenarios.marketBaseBtcPerEhDay,
          battle.costScenarios.kratterLossRate,
        ),
    [battle, days, gap],
  )
  const money = (btc: number | null) => formatMoney(
    btc === null ? null : btc * 100_000_000,
    currency,
    { usd: bitcoinUsd },
    psuAnnualUsd,
  )

  return (
    <Card className="reinforcement-calculator">
      <div className="reinforcement-title">
        <Calculator size={30} />
        <div>
          <p className="eyebrow">Reinforcement Cost Calculator</p>
          <h3>Close the seven-day hash-rate gap</h3>
        </div>
      </div>
      <div className="reinforcement-form">
        <div>
          <label>Campaign duration</label>
          <div className="duration-buttons">
            {presets.map(([value, label]) => (
              <button type="button" key={value} className={preset === value ? 'is-active' : ''} onClick={() => setPreset(value)}>
                {label}
              </button>
            ))}
          </div>
          {preset === 'custom' ? (
            <label className="custom-hours">
              Hours
              <input type="number" min="0" value={customHours} onChange={(event) => setCustomHours(Number(event.target.value))} />
            </label>
          ) : null}
        </div>
        <div className="requisition-summary">
          <span>Required reinforcement</span>
          <strong>{gap === null ? 'Unavailable' : `${gap.toFixed(2)} EH/s`}</strong>
          <small>{days.toFixed(2)} days of continuous hash rate</small>
        </div>
      </div>
      <div className="requisition-output">
        <div>
          <LabelBadge label="THEORETICAL SCENARIO" />
          <span>Hashprice revenue floor</span>
          <strong>{money(costs.floorBtc)}</strong>
          <small>Opportunity-cost reference, not a rental quote.</small>
        </div>
        <div>
          <LabelBadge label="GENERAL KRATTER SCENARIO" />
          <span>Gross cost at 8% modeled loss</span>
          <strong>{money(costs.kratterBtc)}</strong>
          <small>Revenue floor ÷ 0.92.</small>
        </div>
        <div>
          <LabelBadge label="MARKET ESTIMATE" />
          <span>Current NiceHash spot extrapolation</span>
          <strong>{money(costs.marketBtc)}</strong>
          <small><Gauge size={12} /> Current quote only; not a fillable invoice.</small>
        </div>
      </div>
      <div className="depth-warning">
        <LabelBadge label="MARKET DEPTH NOT VERIFIED" />
        <p>
          Visible NiceHash speed: {battle.costScenarios.nicehashVisibleSpeedEhS?.toFixed(2) ?? '—'} EH/s.
          The displayed order book does not establish that {gap?.toFixed(2) ?? 'the required'} EH/s can be acquired without moving the price.
        </p>
      </div>
    </Card>
  )
}
