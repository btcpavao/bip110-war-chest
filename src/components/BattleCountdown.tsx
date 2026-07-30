import { Bomb, Clock3, Flag, ShieldCheck } from 'lucide-react'
import type { DashboardData } from '../lib/schemas'
import { formatBattleDuration } from '../lib/battle'
import { formatInteger } from '../lib/format'
import { LabelBadge } from './LabelBadge'
import { Card } from './ui/card'

export function BattleCountdown({ clock }: { clock: DashboardData['battleClock'] }) {
  const milestones = [
    ['Mandatory signaling starts', clock.mandatoryStartHeight],
    ['Mandatory signaling ends', clock.mandatoryEndHeight],
    ['Maximum lock-in', clock.maximumLockInHeight],
    ['Maximum activation', clock.maximumActivationHeight],
  ] as const
  return (
    <section className="section battle-clock-section" id="countdown">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">Consensus campaign clock</p>
          <h2>Battle Countdown</h2>
          <p>The estimate moves with the measured rolling block interval; the activation heights do not.</p>
        </div>
        <LabelBadge label="VERIFIED" />
      </div>
      <Card className="battle-countdown-card">
        <div className="fuse-visual" aria-hidden="true"><Bomb size={74} /><span /></div>
        <div className="countdown-primary">
          <span>Blocks until mandatory signaling</span>
          <strong>{formatInteger(clock.blocksRemaining)}</strong>
          <em>{formatBattleDuration(clock.estimatedSecondsRemaining)}</em>
          <small>{clock.rollingWindowBlocks}-block interval: {Math.round(clock.rollingBlockIntervalSeconds)} seconds · ETA confidence {clock.etaConfidence}</small>
        </div>
        <div className="battle-timeline">
          {milestones.map(([label, height], index) => (
            <div key={label}>
              <span>{index === 0 ? <Flag size={17} /> : index === 3 ? <ShieldCheck size={17} /> : <Clock3 size={17} />}</span>
              <small>{label}</small>
              <strong>#{formatInteger(height)}</strong>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
