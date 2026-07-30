import { useMemo, useState } from 'react'
import {
  ArrowDown,
  BriefcaseBusiness,
  ExternalLink,
  FileQuestion,
  GraduationCap,
  Mic2,
  Pickaxe,
  Radio,
  ReceiptText,
  Rocket,
  Send,
  Sparkles,
} from 'lucide-react'
import type { DashboardData } from '../lib/schemas'
import { fredCommitmentScenario } from '../lib/battle'
import { LabelBadge } from './LabelBadge'
import { Card } from './ui/card'

interface HighValueRecruitProps {
  recruit: DashboardData['highValueRecruit']
  boss: DashboardData['bossBattle']
  clock: DashboardData['battleClock']
  bitcoinUsd: number | null
  psuAnnualUsd: number
}

function usd(value: number | null) {
  return value === null
    ? 'Unavailable'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)
}

function btc(value: number | null) {
  return value === null ? 'Unavailable' : `≈ ${value.toLocaleString('en-US', { maximumFractionDigits: 5 })} BTC`
}

function metric(value: number | null, unit: string, digits = 2) {
  return value === null ? 'Unavailable' : `≈ ${value.toLocaleString('en-US', { maximumFractionDigits: digits })} ${unit}`
}

function SourceGroup({
  title,
  sources,
  missingCopy,
}: {
  title: string
  sources: DashboardData['highValueRecruit']['resumeScale']['sources']
  missingCopy?: string
}) {
  return (
    <div className="recruit-source-group">
      <strong>{title}</strong>
      {sources.length ? sources.map((source) => (
        <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
          <span>{source.title}</span>
          <small>{source.kind} · {source.confidence}</small>
          <ExternalLink size={13} />
        </a>
      )) : <p>{missingCopy ?? 'No source link recorded.'}</p>}
    </div>
  )
}

function FredPortrait() {
  const [failed, setFailed] = useState(false)
  return (
    <div className="fred-portrait-wrap">
      {failed ? (
        <div className="fred-art-fallback" role="img" aria-label="Fred caricature pending">
          <FileQuestion size={48} />
          <strong>Fred caricature pending</strong>
          <span>Speech Corps dossier remains operational.</span>
        </div>
      ) : (
        <img
          className="fred-portrait"
          src={`${import.meta.env.BASE_URL}assets/caricatures/fred-krueger-recruit-v3.webp`}
          alt="Editorial caricature of Fred Krueger holding a microphone and a blank hash-rate requisition form."
          onError={() => setFailed(true)}
        />
      )}
      <div className="speech-corps-stamp">SPEECH CORPS → HASH CAVALRY</div>
    </div>
  )
}

export function HighValueRecruit({
  recruit,
  boss,
  clock,
  bitcoinUsd,
  psuAnnualUsd,
}: HighValueRecruitProps) {
  const [selectedUsd, setSelectedUsd] = useState(recruit.recruitmentScenarios.usdPresets[1] ?? 50_000)
  const [customUsd, setCustomUsd] = useState(100_000)
  const [customActive, setCustomActive] = useState(false)
  const commitmentUsd = customActive ? customUsd : selectedUsd
  const untilMandatoryDays = clock.estimatedSecondsRemaining / 86_400
  const scenario = useMemo(() => fredCommitmentScenario({
    commitmentUsd,
    bitcoinUsd,
    psuAnnualUsd,
    hashpriceBtcPerPhDay: boss.costScenarios.hashpriceFloorBtcPerPhDay,
    marketBtcPerEhDay: boss.costScenarios.marketBaseBtcPerEhDay,
    reinforcementGapEhS: boss.reinforcementsRequiredEhS,
    untilMandatoryDays,
    lossRate: boss.costScenarios.kratterLossRate,
  }), [
    bitcoinUsd,
    boss,
    commitmentUsd,
    psuAnnualUsd,
    untilMandatoryDays,
  ])

  const timelines = [
    ['Ordinals era', 'Historical Ordinals/BRC-20 enthusiasm', 'ARCHIVAL / SECONDARY EVIDENCE'],
    ['StupidCoin era', 'StupidCoin launched on Solana', 'PUBLICLY DOCUMENTED'],
    ['BIP-110 era', 'Active public BIP-110 support', 'CURRENT'],
    ['Next milestone', 'Rent hash rate', 'ACHIEVEMENT NOT YET RECORDED'],
  ]

  return (
    <section className="section recruit-section" id="high-value-recruit">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">Satirical recruitment dossier</p>
          <h2>The High-Value Recruit</h2>
          <h3>Can Fred turn Spaces into hashes?</h3>
          <p>Fred already has the microphone. Here is the promotion path from audible support to measurable chainwork.</p>
        </div>
        <span className="recruitment-badge"><Sparkles size={14} /> RECRUITMENT PROPOSAL</span>
      </div>

      <div className="recruit-dossier-grid">
        <Card className="fred-dossier">
          <FredPortrait />
          <div className="fred-identity">
            <span className="high-value-tag">HIGH-VALUE RECRUIT</span>
            <h3>{recruit.name}</h3>
            <p>Publicly visible supporter. Potential reinforcement. Receipt drawer currently empty.</p>
          </div>
          <div className="support-status">
            <h4>Public support status</h4>
            <div><span>BIP-110 public support</span><strong>{recruit.publicSupport.bip110SupportActive ? 'ACTIVE' : 'UNVERIFIED'}</strong></div>
            <div><span>Profile branding</span><strong>{recruit.publicSupport.profileLabel}</strong></div>
            <div><span>Spaces participation</span><strong>{recruit.publicSupport.spacesParticipation}</strong></div>
            <div><span>Chainwork attribution</span><strong>UNVERIFIED</strong></div>
            <small>Public rhetorical support is visible. Publicly verifiable hash-rate receipts are not yet recorded.</small>
          </div>
          <div className="resume-scale-card">
            <BriefcaseBusiness size={27} />
            <p className="eyebrow">Résumé scale</p>
            <strong>{recruit.resumeScale.tenExitsListed ? '10 exits listed on official site' : 'Exit count unavailable'}</strong>
            <span>&gt;{usd(recruit.resumeScale.aggregateExitValueUsd)} {recruit.resumeScale.aggregateExitValueLabel.toLowerCase()}</span>
            <small>{recruit.resumeScale.liquidityDisclaimer}</small>
          </div>
          <div className="episode-grid">
            <div>
              <Rocket size={22} />
              <strong>{recruit.stupidCoin.label}</strong>
              <span>{recruit.stupidCoin.description}</span>
              <blockquote>He launched a Solana meme coin in seconds. Surely he can launch a hashpower order before block {clock.mandatoryStartHeight.toLocaleString('en-US')}.</blockquote>
            </div>
            <div>
              <Radio size={22} />
              <strong>Historical Ordinals/BRC-20 association</strong>
              <span>{recruit.historicalOrdinals.description}</span>
              <small>ARCHIVAL / SECONDARY EVIDENCE</small>
            </div>
          </div>
          <div className="public-receipt-status">
            <ReceiptText size={31} />
            <LabelBadge label="NO PUBLIC RECEIPT" />
            <h4>Public Receipt Status</h4>
            <strong>{recruit.receiptStatus.label}</strong>
            <p>{recruit.receiptStatus.disclaimer}.</p>
            <p>{recruit.receiptStatus.explanation}</p>
          </div>
        </Card>

        <Card className="fred-simulator">
          <div className="simulator-heading">
            <Pickaxe size={32} />
            <div>
              <p className="eyebrow">Résumé-scale thought experiments</p>
              <h3>Convert Rhetoric to Hash Rate</h3>
              <p>What would different levels of Fred-style commitment theoretically buy?</p>
            </div>
          </div>
          <div className="recruit-label-row">
            <LabelBadge label="THEORETICAL SCENARIO" />
            <LabelBadge label="MARKET DEPTH NOT VERIFIED" />
            <span>NOT A CLAIM ABOUT PERSONAL WEALTH</span>
          </div>
          <div className="commitment-presets">
            {recruit.recruitmentScenarios.usdPresets.map((amount) => (
              <button
                type="button"
                key={amount}
                className={!customActive && selectedUsd === amount ? 'is-active' : ''}
                onClick={() => { setSelectedUsd(amount); setCustomActive(false) }}
              >
                {usd(amount)}
              </button>
            ))}
            <button type="button" className={customActive ? 'is-active' : ''} onClick={() => setCustomActive(true)}>Custom</button>
          </div>
          {customActive ? (
            <label className="fred-custom-input">
              Custom USD commitment
              <input
                aria-label="Custom USD commitment"
                type="number"
                min="0"
                step="1000"
                value={customUsd}
                onChange={(event) => setCustomUsd(Math.max(Number(event.target.value), 0))}
              />
            </label>
          ) : null}

          <div className="commitment-ticket">
            <span>Commitment</span>
            <strong>{usd(scenario.commitmentUsd)}</strong>
            <div><b>{btc(scenario.btc)}</b><b>{metric(scenario.psu, 'PSU', 1)}</b></div>
            <small>Current BTC/USD conversion · configured PSU unit</small>
          </div>

          <div className="fred-output-grid">
            <div>
              <span>Hashprice opportunity-cost equivalent</span>
              <strong>{metric(scenario.floorEhDays, 'EH-days')}</strong>
              <small>Theoretical floor, not a rental quote.</small>
            </div>
            <div>
              <span>Current spot rental equivalent</span>
              <strong>{metric(scenario.marketEhDays, 'EH-days')}</strong>
              <small>NiceHash quote extrapolation; depth not verified.</small>
            </div>
            <div>
              <span>Expected mining revenue floor</span>
              <strong>{btc(scenario.expectedMiningRevenueFloorBtc)}</strong>
              <small>Market EH-days × theoretical hashprice floor.</small>
            </div>
            <div>
              <span>General Kratter Scenario loss</span>
              <strong>{usd(scenario.kratterLossUsd)}</strong>
              <small>8% illustrative loss assumption.</small>
            </div>
          </div>

          <div className="fred-duration-table">
            <div><span>Duration</span><span>Theoretical hash rate</span><span>F2Pool gap closed</span></div>
            <div><strong>1 day</strong><b>{metric(scenario.oneDayEhS, 'EH/s')}</b><b>{metric(scenario.oneDayGapClosurePct, '%')}</b></div>
            <div><strong>7 days</strong><b>{metric(scenario.sevenDayEhS, 'EH/s')}</b><b>{metric(scenario.sevenDayGapClosurePct, '%')}</b></div>
            <div><strong>Until mandatory</strong><b>{metric(scenario.untilMandatoryEhS, 'EH/s')}</b><b>{metric(scenario.untilMandatoryGapClosurePct, '%')}</b></div>
          </div>
          <p className="campaign-endurance">
            Full-gap campaign endurance: <strong>{metric(scenario.campaignEnduranceDays, 'days')}</strong>
          </p>

          <div className={`spaces-machine ${commitmentUsd > 0 ? 'is-converted' : ''}`}>
            <div><Mic2 size={28} /><span>Posts · Spaces · Articles · Slogans</span></div>
            <ArrowDown size={23} />
            <div><Pickaxe size={28} /><span>Chainwork</span></div>
            <strong>
              {commitmentUsd > 0
                ? 'Success: support upgraded from audible to measurable.'
                : 'Conversion failed: rhetoric is not SHA-256 compatible.'}
            </strong>
          </div>
        </Card>
      </div>

      <div className="fred-timeline" aria-label="Fred recruitment journey">
        {timelines.map(([era, label, status], index) => (
          <Card key={era}>
            <span>{index + 1}</span>
            <small>{era}</small>
            <strong>{label}</strong>
            <em>{status}</em>
          </Card>
        ))}
      </div>

      <div className="recruit-bottom-grid">
        <Card className="claim-receipt-cta">
          <Send size={36} />
          <div>
            <p className="eyebrow">Speech Corps → Hash Cavalry</p>
            <h3>Fred, Claim Your Receipt</h3>
            <p>If you have rented hash rate for BIP-110 and wish to be counted, submit a public receipt.</p>
            <small>Open to Fred Krueger, Matthew Kratter, other public promoters, and any miner or renter willing to provide public proof.</small>
            <strong>Public evidence will be added whether it helps or hurts the satire.</strong>
          </div>
          <a href={recruit.claimReceiptUrl} target="_blank" rel="noreferrer">
            Submit public receipt <ExternalLink size={15} />
          </a>
        </Card>
        <Card className="recruit-sources">
          <h3>Sources in dossier</h3>
          <SourceGroup title="BIP-110 public support" sources={recruit.publicSupport.supportEvidence} />
          <SourceGroup title="Official site / reported aggregate exits" sources={recruit.resumeScale.sources} />
          <SourceGroup title="StupidCoin" sources={recruit.stupidCoin.sources} />
          <SourceGroup
            title="Historical Ordinals / BRC-20"
            sources={recruit.historicalOrdinals.sources}
            missingCopy="Primary-source links still being pinned."
          />
        </Card>
      </div>
      <div className="recruit-closing-line">
        <GraduationCap size={19} />
        The dashboard counts receipts, not résumé mythology.
      </div>
    </section>
  )
}
