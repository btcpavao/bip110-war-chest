import * as Collapsible from '@radix-ui/react-collapsible'
import * as Tabs from '@radix-ui/react-tabs'
import {
  AlertTriangle,
  ArrowDown,
  BarChart3,
  Blocks,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileQuestion,
  Gauge,
  Landmark,
  Pickaxe,
  Receipt,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'
import { CurrencyToggle } from './components/CurrencyToggle'
import { BattleCountdown } from './components/BattleCountdown'
import { F2PoolBossBattle } from './components/F2PoolBossBattle'
import { HashVaporizer } from './components/HashVaporizer'
import { HighValueRecruit } from './components/HighValueRecruit'
import { LabelBadge, type DataLabel } from './components/LabelBadge'
import { PSUFieldManual } from './components/PSUFieldManual'
import { SignalLedger } from './components/SignalLedger'
import { Card, CardContent, CardHeader } from './components/ui/card'
import {
  formatInteger,
  formatMoney,
  formatPercent,
  formatSatsAsBtc,
  type Currency,
} from './lib/format'
import { loadAppData, type AppData } from './lib/loadData'
import { formatBattleDuration, heroEstimateMode } from './lib/battle'

const slogans = [
  'RUG THE SPAMMERS',
  'FIGHT BIG BITCOIN',
  'DEFEND THE NETWORK',
  'BIP-110 IS GOING TO WIN',
  'FIRE THE BITCOIN CORE CABAL',
  'DON’T TRUST TREASURY COMPANY CLOWNS',
  'DON’T BE A DUMB HASHER',
  'FIGHT THE FABIANS',
]

const methodologyDisclaimers = [
  'Signaling does not prove filtering.',
  'Signaling does not prove rented hash rate.',
  'Block outcomes are affected by mining luck.',
  'Pool identity may not identify the actual hash owner.',
  'NiceHash spot replacement cost is not a historical rental invoice.',
  'Market snapshot history starts with this pipeline and is not backfilled.',
  'A public mempool observer does not possess the miner’s exact private block template.',
  'The Kratter 8% scenario is illustrative.',
  'PSU is a satirical comparison unit.',
  'Exact historical miner P&L is not directly observable.',
  'Missing evidence must not be treated as zero.',
  'The Fred Krueger recruit simulator is not a claim about personal wealth, liquidity or actual spending.',
  'No public hash-rate receipt recorded is not proof of zero commitment.',
]

function LoadingState() {
  return (
    <main className="loading-state">
      <div className="loading-seal"><Pickaxe size={34} /></div>
      <p className="eyebrow">Opening the field ledger</p>
      <h1>BIP-110 WAR CHEST</h1>
      <p>Loading the last successfully generated public dataset…</p>
    </main>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="loading-state">
      <AlertTriangle size={44} />
      <p className="eyebrow">Ledger unavailable</p>
      <h1>THE RECEIPTS COULD NOT BE OPENED</h1>
      <p>{message}</p>
      <p>Run the data pipeline or restore the last generated files in public/data.</p>
    </main>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  satire,
}: {
  icon: typeof Blocks
  label: string
  value: string
  satire: string
}) {
  return (
    <Card className="stat-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{satire}</small>
    </Card>
  )
}

function DataValue({
  label,
  value,
  badge,
  note,
}: {
  label: string
  value: string
  badge: DataLabel
  note?: string
}) {
  return (
    <div className="data-value">
      <div className="data-value-top">
        <span>{label}</span>
        <LabelBadge label={badge} />
      </div>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <strong>Period {label}</strong>
      {payload.map((item) => (
        <span key={item.name} style={{ color: item.color }}>
          {item.name}: {typeof item.value === 'number' ? item.value.toFixed(2) : '—'}
        </span>
      ))}
    </div>
  )
}

function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>('BTC')
  const [scenarioMode, setScenarioMode] = useState<'revenue' | 'market'>('revenue')
  const [calculatorView, setCalculatorView] = useState<'market' | 'scenario' | 'verified'>('scenario')
  const [includeFees, setIncludeFees] = useState(true)
  const [includeSpamTax, setIncludeSpamTax] = useState(false)

  useEffect(() => {
    loadAppData().then(setData).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Unknown data error')
    })
  }, [])

  const display = useMemo(() => {
    if (!data) return null
    const { dashboard } = data
    const price = dashboard.currentPrice
    const psu = dashboard.satire.annualPriceUsd
    const scenario = dashboard.kratterScenario.observedRevenueModel
    const adjustedRevenue = includeFees
      ? scenario.observedRevenueSats
      : scenario.observedRevenueSats - dashboard.summary.observedTransactionFeesSats
    const adjustedGross = Math.round(adjustedRevenue / 0.92)
    const adjustedLoss = adjustedGross - adjustedRevenue
    const spamAddition =
      includeSpamTax && data.spamTax.estimatedNetFilterCostSats !== null
        ? data.spamTax.estimatedNetFilterCostSats
        : 0
    return {
      price,
      psu,
      scenarioLoss: formatMoney(adjustedLoss + spamAddition, currency, price, psu),
      scenarioGross: formatMoney(adjustedGross, currency, price, psu),
      observedRevenue: formatMoney(adjustedRevenue, currency, price, psu),
      marketBase: formatMoney(dashboard.marketEstimate.baseSats, currency, price, psu),
      marketLow: formatMoney(dashboard.marketEstimate.lowSats, currency, price, psu),
      marketHigh: formatMoney(dashboard.marketEstimate.highSats, currency, price, psu),
      marketRate: formatMoney(
        dashboard.marketEstimate.baseSatsPerEhDay,
        currency,
        price,
        psu,
      ),
      marketScenarioLoss: formatMoney(
        dashboard.kratterScenario.marketRentalModel.modeledLossSats,
        currency,
        price,
        psu,
      ),
      marketPostValue: formatMoney(
        dashboard.kratterScenario.marketRentalModel.modeledPostMiningValueSats,
        currency,
        price,
        psu,
      ),
      miningRevenue: formatMoney(
        dashboard.summary.observedMiningRevenueSats,
        currency,
        price,
        psu,
      ),
    }
  }, [currency, data, includeFees, includeSpamTax])

  if (error) return <ErrorState message={error} />
  if (!data || !display) return <LoadingState />

  const { dashboard, blocks, receipts, spamTax } = data
  const kratter = receipts.entries.find((entry) => entry.name === 'Matthew Kratter')
  const generatedDate = new Date(dashboard.generatedAt)
  const currentPriceNote =
    currency === 'BTC'
      ? 'Native BTC amount'
      : dashboard.currentPrice.label
  const heroMode = heroEstimateMode(dashboard.marketEstimate.available)
  const heroAmount = heroMode === 'market' ? display.marketBase : display.scenarioLoss

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top">
          <span className="wordmark-mark">₿</span>
          <span>WAR CHEST // FIELD LEDGER</span>
        </a>
        <nav aria-label="Primary">
          <a href="#score">Score</a>
          <a href="#boss">Boss</a>
          <a href="#budget">Budget</a>
          <a href="#receipts">Receipts</a>
          <a href="#ledger">Blocks</a>
        </nav>
        <div className="topbar-clock">
          <span className="status-dot" />
          <div>
            <strong>{formatInteger(dashboard.battleClock.blocksRemaining)} blocks</strong>
            <small>{formatBattleDuration(dashboard.battleClock.estimatedSecondsRemaining)} to mandatory</small>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="slogan-cloud" aria-hidden="true">
            {slogans.map((slogan, index) => (
              <span key={slogan} style={{ '--i': index } as React.CSSProperties}>{slogan}</span>
            ))}
          </div>
          <img
            className="hero-art"
            src={`${import.meta.env.BASE_URL}assets/caricatures/general-kratter-hero.webp`}
            alt="Editorial caricature of General Kratter pointing toward a Bitcoin mining battlefield while hiding a tiny coin pouch behind his back."
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="kicker">THE CHAIN RECORDS BLOCKS. WE RECORD RECEIPTS.</p>
            <h1>BIP-110<br /><em>WAR CHEST</em></h1>
            <p className="hero-subtitle">How much capital actually followed the call to arms?</p>
            <div className="hero-stamps">
              <span>BLOCKS, NOT SLOGANS</span>
              <span>RECEIPTS, NOT RHETORIC</span>
            </div>
          </div>
          <Card className="hero-budget">
            <CardHeader>
              <div>
                <p className="eyebrow">Quartermaster’s estimate</p>
                <h2>Estimated BIP-110 War Budget</h2>
              </div>
              <LabelBadge label={heroMode === 'market' ? 'MARKET ESTIMATE' : 'GENERAL KRATTER SCENARIO'} />
            </CardHeader>
            <CardContent>
              <CurrencyToggle value={currency} onChange={setCurrency} />
              <strong className="hero-amount">{heroAmount}</strong>
              <p className="range-line">
                {heroMode === 'market'
                  ? `Low ${display.marketLow} · High ${display.marketHigh}`
                  : 'Market unavailable · showing the explicit 8% revenue scenario'}
              </p>
              <div className="availability-note">
                {dashboard.marketEstimate.available ? <Gauge size={18} /> : <FileQuestion size={18} />}
                <div>
                  <strong>
                    {dashboard.marketEstimate.available
                      ? `${display.marketRate} per EH/day`
                      : 'Estimate unavailable'}
                  </strong>
                  <span>{dashboard.marketEstimate.reason}</span>
                </div>
              </div>
              <div className="scenario-mini">
                <div>
                  <span>General Kratter Scenario Loss</span>
                  <strong>{display.scenarioLoss}</strong>
                </div>
                <LabelBadge label="GENERAL KRATTER SCENARIO" />
              </div>
              <p className="current-value-label">{currentPriceNote}</p>
            </CardContent>
          </Card>
          <a className="scroll-cue" href="#receipt">
            Inspect the ledger <ArrowDown size={16} />
          </a>
        </section>

        <section className="evidence-ribbon">
          <span><CheckCircle2 size={16} /> Independent BIP9 classifier</span>
          <span><CheckCircle2 size={16} /> Inclusive from block 927,360</span>
          <span>
            {dashboard.monitor.agrees ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            Monitor cross-check {dashboard.monitor.agrees ? 'agrees' : 'requires attention'}
          </span>
          <span><ShieldAlert size={16} /> Missing markets stay missing</span>
        </section>

        <section className="section receipt-section" id="receipt">
          <div className="section-heading">
            <p className="eyebrow">Exhibit A · Public commitment</p>
            <h2>General Kratter’s War Chest</h2>
            <p>The balance sheet behind the battle cry—separated from the illustrative scenario.</p>
          </div>
          <div className="receipt-layout">
            <Card className="receipt-file">
              <span className="paperclip" aria-hidden="true" />
              <CardHeader>
                <div>
                  <p className="eyebrow">Evidence file // Matthew Kratter</p>
                  <h3>Publicly reconstructed receipt</h3>
                </div>
                <LabelBadge label={kratter?.status === 'VERIFIED_OR_PUBLICLY_RECONSTRUCTED' ? 'VERIFIED' : 'UNKNOWN'} />
              </CardHeader>
              <CardContent className="receipt-metrics">
                <DataValue
                  label="Reconstructed spend"
                  value={kratter?.verifiedSpendBtc == null ? 'Unavailable' : `${kratter.verifiedSpendBtc} BTC`}
                  badge="UNKNOWN"
                  note="Retained from the requested curator record; matching primary receipt still needs pinning."
                />
                <DataValue
                  label="Maximum reported interim loss"
                  value={kratter?.maximumReportedInterimLossBtc == null ? 'Unavailable' : `${kratter.maximumReportedInterimLossBtc} BTC`}
                  badge="UNKNOWN"
                />
                <DataValue
                  label="Historical USD loss"
                  value={kratter?.historicalUsdLoss == null ? 'Unavailable' : `$${formatInteger(kratter.historicalUsdLoss)}`}
                  badge="UNKNOWN"
                  note="Not converted without a verified experiment date."
                />
                <div className="evidence-links">
                  {kratter?.evidence.map((evidence) => (
                    <a href={evidence.sourceUrl} target="_blank" rel="noreferrer" key={evidence.sourceUrl}>
                      {evidence.title} <ExternalLink size={13} />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="scale-card">
              <div className="scale-illustration" aria-hidden="true">
                <div className="scale-beam" />
                <div className="scale-center"><Scale size={34} /></div>
                <div className="scale-pan scale-pan-left"><span>?</span></div>
                <div className="scale-pan scale-pan-right"><BookOpen size={28} /></div>
              </div>
              <div className="scale-labels">
                <div><span>Maximum demonstrated battlefield loss</span><strong>Evidence pending</strong></div>
                <div><span>1 annual Plebslop University subscription</span><strong>$790 · 1 PSU</strong></div>
              </div>
              <blockquote>“The call to arms cost the general less than one year of tuition.”</blockquote>
              <p className="method-note">
                That comparison remains withheld until the exact historical receipt date and BTC price are pinned.
              </p>
            </Card>
          </div>
        </section>

        <PSUFieldManual
          annualPriceUsd={dashboard.satire.annualPriceUsd}
          sourceUrl={dashboard.satire.sourceUrl}
          sourceCheckedAt={dashboard.satire.sourceCheckedAt}
          historicalPsuLoss={kratter?.historicalPsuLoss ?? null}
          currency={currency}
        />

        <section className="section battlefield-section" id="score">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Verified on-chain tally</p>
              <h2>Battlefield Score</h2>
              <p>Every bar begins with the block version—not a hashtag, bio or Spaces attendance list.</p>
            </div>
            <LabelBadge label="VERIFIED" />
          </div>
          <div className="stats-grid">
            <StatCard icon={Blocks} label="Blocks since signaling began" value={formatInteger(dashboard.summary.blocksSinceStarted)} satire="The battlefield" />
            <StatCard icon={Target} label="BIP-110 signaling blocks" value={formatInteger(dashboard.summary.signalingBlocks)} satire="Battlefield score" />
            <StatCard icon={BarChart3} label="Lifetime signaling rate" value={formatPercent(dashboard.summary.lifetimeSignalingPct)} satire="Share of the battlefield" />
            <StatCard icon={Gauge} label="One signal per" value={`${dashboard.summary.oneSignalPerNBlocks?.toFixed(1) ?? '—'} blocks`} satire="Dispatch frequency" />
            <StatCard icon={Pickaxe} label="Current-period signaling" value={formatPercent(dashboard.summary.currentPeriodSignalingPct)} satire="Victory parade forecast" />
            <StatCard icon={Target} label="Distance from 55% threshold" value={`${formatInteger(dashboard.summary.distanceFromThresholdBlocks)} blocks`} satire="Still needed this period" />
            <StatCard icon={Sparkles} label="Implied signaling hash rate" value={`${dashboard.summary.impliedSignalingEhS.toFixed(1)} EH/s`} satire="Hash-rate artillery" />
            <StatCard icon={Landmark} label="Cumulative signal footprint" value={`${dashboard.summary.signalEhDays.toFixed(1)} EH-days`} satire="Campaign footprint" />
          </div>
          <Card className="chart-card">
            <CardHeader>
              <div>
                <p className="eyebrow">Difficulty-period record</p>
                <h3>Blocks, Not Slogans</h3>
              </div>
              <span className="chart-note">55% = 1,109 of 2,016 blocks</span>
            </CardHeader>
            <CardContent className="chart-body">
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={dashboard.periods} margin={{ top: 10, right: 12, left: -12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="rgba(55,45,31,.18)" />
                  <XAxis dataKey="periodNum" tick={{ fill: '#6b5a40', fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#6b5a40', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 60]} tick={{ fill: '#6b5a40', fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="signalingCount" name="Signal blocks" fill="#c96a24" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="signalingPct" name="Signaling %" stroke="#6c6d45" strokeWidth={2.5} dot={{ r: 3 }} />
                  <ReferenceLine yAxisId="right" y={55} stroke="#9f332a" strokeDasharray="7 5" label={{ value: '55% threshold', fill: '#9f332a', fontSize: 11 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="chart-caption">
                Zero-signal periods are intentionally retained. The final period is partial: {formatInteger(dashboard.summary.currentPeriodBlockCount)} observed blocks.
              </p>
            </CardContent>
          </Card>
        </section>

        <BattleCountdown clock={dashboard.battleClock} />
        <F2PoolBossBattle
          battle={dashboard.bossBattle}
          clock={dashboard.battleClock}
          bitcoinUsd={dashboard.currentPrice.usd}
          psuAnnualUsd={dashboard.satire.annualPriceUsd}
          currency={currency}
        />
        <HighValueRecruit
          recruit={dashboard.highValueRecruit}
          boss={dashboard.bossBattle}
          clock={dashboard.battleClock}
          bitcoinUsd={dashboard.currentPrice.usd}
          psuAnnualUsd={dashboard.satire.annualPriceUsd}
        />
        <HashVaporizer />

        <section className="section calculator-section" id="budget">
          <div className="section-heading">
            <p className="eyebrow">Treasury room · Three books, never one</p>
            <h2>War Budget Calculator</h2>
            <p>Switch models without blending evidence, markets and satire into a single headline.</p>
          </div>
          <Tabs.Root value={calculatorView} onValueChange={(value) => setCalculatorView(value as typeof calculatorView)} className="calculator-tabs">
            <Tabs.List className="tabs-list" aria-label="Calculation system">
              <Tabs.Trigger value="market">Market estimate</Tabs.Trigger>
              <Tabs.Trigger value="scenario">Kratter 8% scenario</Tabs.Trigger>
              <Tabs.Trigger value="verified">Verified receipts</Tabs.Trigger>
            </Tabs.List>
            <div className="calculator-grid">
              <Card className="calculator-controls">
                <CardHeader><h3>Quartermaster controls</h3></CardHeader>
                <CardContent>
                  <label>Display currency</label>
                  <CurrencyToggle value={currency} onChange={setCurrency} />
                  <label>Scenario foundation</label>
                  <div className="stacked-toggle">
                    <button type="button" className={scenarioMode === 'revenue' ? 'is-active' : ''} onClick={() => setScenarioMode('revenue')}>Observed block revenue model</button>
                    <button type="button" className={scenarioMode === 'market' ? 'is-active' : ''} onClick={() => setScenarioMode('market')}>Current spot replacement model</button>
                  </div>
                  <label className="check-row">
                    <input type="checkbox" checked={includeFees} onChange={(event) => setIncludeFees(event.target.checked)} />
                    Include transaction fees
                  </label>
                  <label className="check-row">
                    <input type="checkbox" checked={includeSpamTax} onChange={(event) => setIncludeSpamTax(event.target.checked)} />
                    Include Spam-Rug Tax
                  </label>
                  <small>
                    Spam-Rug Tax cannot change the result until transaction-level classification coverage exceeds zero.
                  </small>
                </CardContent>
              </Card>
              <Card className="calculator-output">
                <div className="accountant-mark" aria-hidden="true"><Calculator size={44} /></div>
                <Tabs.Content value="scenario">
                  <LabelBadge label="GENERAL KRATTER SCENARIO" />
                  <p className="eyebrow">Maximum benefit of the doubt</p>
                  <h3>{scenarioMode === 'revenue' ? 'Observed block revenue model' : 'Current spot replacement model'}</h3>
                  {scenarioMode === 'revenue' ? (
                    <>
                      <DataValue label="Observed mining revenue" value={display.observedRevenue} badge="VERIFIED" />
                      <span className="formula-line">gross modeled spending = observed revenue ÷ 0.92</span>
                      <DataValue label="Gross modeled spending" value={display.scenarioGross} badge="GENERAL KRATTER SCENARIO" />
                      <DataValue label="Modeled loss" value={display.scenarioLoss} badge="GENERAL KRATTER SCENARIO" note="8% illustrative assumption" />
                    </>
                  ) : (
                    <>
                      <DataValue label="Spot replacement budget" value={display.marketBase} badge="MARKET ESTIMATE" />
                      <span className="formula-line">modeled loss = current replacement budget × 0.08</span>
                      <DataValue label="Modeled loss" value={display.marketScenarioLoss} badge="GENERAL KRATTER SCENARIO" />
                      <DataValue label="Modeled post-mining value" value={display.marketPostValue} badge="GENERAL KRATTER SCENARIO" />
                    </>
                  )}
                </Tabs.Content>
                <Tabs.Content value="market">
                  <LabelBadge label="MARKET ESTIMATE" />
                  <p className="eyebrow">Current replacement cost of the signaling hash-rate equivalent</p>
                  <h3>{display.marketBase}</h3>
                  <div className="availability-note">
                    <Gauge size={28} />
                    <div>
                      <strong>NiceHash spot coverage: {formatPercent(dashboard.marketEstimate.coveragePct, 0)}</strong>
                    <p>{dashboard.marketEstimate.reason}</p>
                    </div>
                  </div>
                </Tabs.Content>
                <Tabs.Content value="verified">
                  <LabelBadge label="VERIFIED" />
                  <p className="eyebrow">Direct blockchain record</p>
                  <h3>{display.miningRevenue}</h3>
                  <p>Observed subsidy plus transaction fees across independently classified signal blocks.</p>
                  <p className="current-value-label">{currentPriceNote}</p>
                </Tabs.Content>
              </Card>
            </div>
          </Tabs.Root>
          <aside className="scenario-disclaimer">
            This is not a claim that all signaling hash rate was rented or that every participant experienced an 8% loss. It is a deliberately generous illustrative scenario based on the supplied interim-result assumption.
          </aside>
        </section>

        <section className="section generals-section" id="receipts">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Public evidence register</p>
              <h2>The Generals’ Ledger</h2>
              <p>Calling others to battle is easy. Publishing the budget is harder.</p>
            </div>
            <Receipt size={44} />
          </div>
          <Card className="generals-table">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Promoter</th><th>Public support</th><th>Public receipt</th><th>Recruitment</th><th>Verified spend</th><th>Demonstrated loss</th><th>PSU</th><th>Evidence</th></tr>
                </thead>
                <tbody>
                  {receipts.entries.map((entry) => {
                    const noReceipt = entry.status === 'NO_PUBLIC_RECEIPT'
                    const isFred = entry.name === dashboard.highValueRecruit.name
                    return (
                      <tr key={entry.name}>
                        <td><strong>{entry.name}</strong><span>{entry.title}</span></td>
                        <td>{isFred ? <><strong className="ledger-active">ACTIVE</strong><span>#BIP-110</span></> : <span>Not tracked</span>}</td>
                        <td><LabelBadge label={noReceipt ? 'NO PUBLIC RECEIPT' : entry.status === 'VERIFIED_OR_PUBLICLY_RECONSTRUCTED' ? 'VERIFIED' : 'UNKNOWN'} /></td>
                        <td>{isFred ? <><strong>HIGH-VALUE PROSPECT</strong><a href="#high-value-recruit">Open dossier ↓</a></> : <span>—</span>}</td>
                        <td>{noReceipt ? 'Not recorded' : entry.verifiedSpendBtc == null ? 'Unavailable' : `${entry.verifiedSpendBtc} BTC`}</td>
                        <td>{noReceipt ? 'Not recorded' : entry.maximumReportedInterimLossBtc == null ? 'Unavailable' : `${entry.maximumReportedInterimLossBtc} BTC`}</td>
                        <td>{entry.historicalPsuLoss == null ? 'Unavailable' : entry.historicalPsuLoss.toFixed(2)}</td>
                        <td>
                          {entry.evidence.length ? entry.evidence.map((evidence) => (
                            <a key={evidence.sourceUrl} href={evidence.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={12} /></a>
                          )) : <span className="empty-ledger">— blank page —</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="important-note"><AlertTriangle size={17} /> No publicly verifiable receipt is not the same as zero financial commitment.</p>
        </section>

        <section className="section market-section">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Observed footprint vs. unobserved invoice</p>
              <h2>Market Cost &amp; P&amp;L</h2>
              <p>Hash-rate equivalent is estimable. The private rental invoice is not.</p>
            </div>
            <LabelBadge label="MARKET ESTIMATE" />
          </div>
          <div className="market-grid">
            <Card className="chart-card">
              <CardHeader><h3>Cumulative signal EH-days</h3><LabelBadge label="VERIFIED" /></CardHeader>
              <CardContent className="chart-body">
                <ResponsiveContainer width="100%" height={290}>
                  <LineChart data={dashboard.periods} margin={{ top: 8, right: 12, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="rgba(55,45,31,.18)" />
                    <XAxis dataKey="periodNum" tick={{ fill: '#6b5a40', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b5a40', fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="cumulativeSignalEhDays" name="Signal EH-days" stroke="#c96a24" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="benefit-machine">
              <div className="lever" aria-hidden="true"><span /><strong>8%</strong></div>
              <p className="eyebrow">Lever position</p>
              <h3>MAXIMUM BENEFIT<br />OF THE DOUBT</h3>
              <p>Observed revenue ÷ 0.92</p>
              <strong>{formatSatsAsBtc(dashboard.kratterScenario.observedRevenueModel.grossModeledSpendingSats)}</strong>
              <LabelBadge label="GENERAL KRATTER SCENARIO" />
            </Card>
          </div>
          <Card className="market-missing">
            <Gauge size={42} />
            <div>
              <h3>NiceHash SHA256AsicBoost spot market</h3>
              <p>
                Weighted median: <strong>{display.marketRate} per EH/day</strong>. The low/base/high
                range uses paying-speed-weighted P25/P50/P75 across active orders. Scheduled runs
                preserve snapshots from now onward; earlier dates are not backfilled.
              </p>
              <p className="method-note">
                As of {dashboard.marketEstimate.asOf ? new Date(dashboard.marketEstimate.asOf).toLocaleString('en-GB') : 'unavailable'}
                {' · '}{dashboard.marketEstimate.totalSpeedEhS?.toFixed(2) ?? '—'} EH/s
                {' · '}{formatInteger(dashboard.marketEstimate.activePaidOrderCount)} active paid orders
                {' · '}{formatInteger(dashboard.marketEstimate.snapshotCount)} stored snapshots
              </p>
            </div>
            <div className="coverage-dial">
              <strong>{formatPercent(dashboard.marketEstimate.coveragePct, 0)}</strong>
              <span>spot coverage</span>
            </div>
          </Card>
        </section>

        <section className="section spam-section">
          <div className="section-heading">
            <p className="eyebrow">Separate analysis · Never added to rental P&amp;L by default</p>
            <h2>Spam-Rug Tax</h2>
            <p>What did “Rug the spammers” potentially cost?</p>
          </div>
          <div className="spam-layout">
            <Card className="spam-visual">
              <div className="block-bin" aria-hidden="true"><Blocks size={68} /><span>?</span></div>
              <h3>Estimated fees foregone under a strict BIP-110 filter</h3>
              <LabelBadge label="PUBLIC MEMPOOL ESTIMATE" />
              <p>Template gaps are observable. The reason a transaction was missing is not automatically observable.</p>
            </Card>
            <div className="spam-stats">
              <DataValue label="Gross rejected fees" value="Unclassified" badge="UNKNOWN" />
              <DataValue label="Observable template fee gap" value={`${formatInteger(spamTax.templateFeeGapSats)} sats`} badge="PUBLIC MEMPOOL ESTIMATE" />
              <DataValue label="Estimated net filter cost" value="Unavailable" badge="UNKNOWN" />
              <DataValue label="Unknown fee mass" value={`${formatInteger(spamTax.unknownFeeMassSats)} sats`} badge="UNKNOWN" />
              <DataValue label="Audited block coverage" value={formatPercent(dashboard.coverage.spamAuditBlockPct ?? 0)} badge="PUBLIC MEMPOOL ESTIMATE" />
              <DataValue label="Classification coverage" value={formatPercent(spamTax.classificationCoveragePct)} badge="UNKNOWN" />
            </div>
          </div>
          <p className="method-note">{spamTax.note}</p>
        </section>

        <section className="section ledger-section" id="ledger">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Public chain receipts</p>
              <h2>Signaling Block Ledger</h2>
              <p>Every row has a block version, explorer link and explicit missing-data state.</p>
            </div>
            <span className="record-count">{formatInteger(blocks.length)} records</span>
          </div>
          <SignalLedger blocks={blocks} />
        </section>

        <section className="section methodology-section">
          <Collapsible.Root>
            <Collapsible.Trigger className="methodology-trigger">
              <span><BookOpen size={20} /> Methodology, formulas &amp; caveats</span>
              <ChevronDown size={20} />
            </Collapsible.Trigger>
            <Collapsible.Content className="methodology-content">
              <div className="formula-grid">
                <div><span>Signal detection</span><code>(version &amp; 0xe0000000) === 0x20000000 &amp;&amp; bit 4</code></div>
                <div><span>Hash-rate footprint</span><code>signal share × network EH/s × elapsed days</code></div>
                <div><span>Revenue scenario</span><code>gross = observed revenue ÷ 0.92</code></div>
                <div><span>Spot replacement cost</span><code>signal EH-days × NiceHash BTC/EH/day</code></div>
                <div><span>Market scenario</span><code>loss = spot replacement cost × 0.08</code></div>
                <div><span>PSU</span><code>historical USD amount ÷ ${dashboard.satire.annualPriceUsd}</code></div>
                <div><span>Filter tax</span><code>min(invalid missing fees, positive template fee gap)</code></div>
                <div><span>Battle ETA</span><code>blocks remaining × rolling 144-block interval</code></div>
                <div><span>Boss hash rate</span><code>7d signal share × 7d average network EH/s</code></div>
                <div><span>Reinforcements</span><code>max(F2Pool 7d EH/s − BIP-110 7d EH/s, 0)</code></div>
              </div>
              <ol className="disclaimers-list">
                {methodologyDisclaimers.map((item) => <li key={item}>{item}</li>)}
              </ol>
              <div className="source-pins">
                <a href={`https://github.com/bitcoin/bips/blob/${dashboard.constants.publishedBipCommit}/bip-0110.mediawiki`} target="_blank" rel="noreferrer">Pinned BIP-110 spec <ExternalLink size={13} /></a>
                <a href="https://mempool.space/docs/api/rest" target="_blank" rel="noreferrer">mempool.space API <ExternalLink size={13} /></a>
                <a href="https://bip110monitor.com/api" target="_blank" rel="noreferrer">BIP-110 monitor API <ExternalLink size={13} /></a>
                <a href="https://www.nicehash.com/docs/rest/get-main-api-v2-hashpower-orderBook" target="_blank" rel="noreferrer">NiceHash order-book API <ExternalLink size={13} /></a>
                <a href={dashboard.bossBattle.sources.f2pool} target="_blank" rel="noreferrer">F2Pool seven-day estimate <ExternalLink size={13} /></a>
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        </section>

        <section className="closing-panel">
          <div className="closing-art" aria-hidden="true">
            <span className="empty-sack">SATS</span>
            <span className="empty-sack">TIME</span>
            <span className="empty-sack">HEALTH</span>
            <span className="empty-sack">REPUTATION</span>
          </div>
          <p className="eyebrow">After-action report</p>
          <h2>BLOCKS DON’T LIE</h2>
          <strong>THE CHAIN KEEPS THE RECEIPTS</strong>
          <blockquote>Leaders go first. Loudmouths outsource risk to plebs.</blockquote>
          <div className="closing-signs">
            <span><s>CALL TO ARMS</s></span>
            <span>WE WERE JUST ASKING QUESTIONS</span>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <strong>BIP-110 WAR CHEST</strong>
          <p>The dashboard deliberately distinguishes public evidence, market estimates and the satirical General Kratter Scenario. A block signal does not prove that hash rate was rented.</p>
        </div>
        <div>
          <span>Generated {generatedDate.toLocaleString('en-GB', { timeZone: 'UTC' })} UTC</span>
          <span>Classifier {dashboard.rulesetVersion}</span>
          <span>Schema {dashboard.schemaVersion}</span>
        </div>
      </footer>
    </div>
  )
}

export default App
