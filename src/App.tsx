import { ChevronDown, ExternalLink, Receipt, Scale } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { SignalLedger } from './components/SignalLedger'
import type { AppData } from './lib/loadData'
import { loadAppData } from './lib/loadData'
import {
  formatHumanDuration,
  formatCommitmentUsd,
  formatSimpleEh,
  formatSimpleUsd,
  fredMatchDurationSeconds,
} from './lib/simple'

const REPOSITORY_URL = 'https://github.com/btcpavao/bip110-war-chest'

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`
}

function LoadingState() {
  return (
    <main className="state-page">
      <span className="state-seal">₿</span>
      <p className="eyebrow">Opening the field ledger</p>
      <h1>BIP-110 WAR CHEST</h1>
      <p>Loading the latest public dataset…</p>
    </main>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="state-page">
      <p className="eyebrow">Ledger unavailable</p>
      <h1>THE RECEIPTS COULD NOT BE OPENED</h1>
      <p>{message}</p>
    </main>
  )
}

function Metric({
  label,
  value,
  badge,
  note,
}: {
  label: string
  value: string
  badge: string
  note?: string
}) {
  return (
    <article className="landing-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small className="model-badge">{badge}</small>
      {note ? <p>{note}</p> : null}
    </article>
  )
}

function SecondaryHeader({ title }: { title: string }) {
  return (
    <header className="secondary-header">
      <a className="wordmark" href={import.meta.env.BASE_URL}>
        <span>₿</span> WAR CHEST
      </a>
      <strong>{title}</strong>
      <a href={import.meta.env.BASE_URL}>BACK TO LANDING PAGE</a>
    </header>
  )
}

function MethodologyPage({ data }: { data: AppData }) {
  const { dashboard } = data
  return (
    <div className="secondary-shell">
      <SecondaryHeader title="FULL METHODOLOGY" />
      <main className="secondary-main">
        <p className="eyebrow">Model separation matters</p>
        <h1>HOW THE WAR CHEST COUNTS</h1>
        <p className="secondary-lede">
          Public chain evidence, current market estimates and satire remain separate.
          The simplified landing page is only a view over this full dataset.
        </p>
        <div className="method-grid">
          <article>
            <h2>Signaling footprint</h2>
            <code>(signal blocks ÷ observed blocks) × network EH/s</code>
            <p>A version-bit signal does not prove who owned or rented the hash rate.</p>
          </article>
          <article>
            <h2>Fight-cost model</h2>
            <code>observed revenue ÷ 0.92</code>
            <p>The 8% result is an illustrative General Kratter scenario, not a private invoice.</p>
          </article>
          <article>
            <h2>Current daily cost</h2>
            <code>7d signaling EH/s × current hashpower price</code>
            <p>The spot benchmark is current. It is not backfilled into the past.</p>
          </article>
          <article>
            <h2>F2Pool gap</h2>
            <code>max(F2Pool 7d EH/s − BIP-110 7d EH/s, 0)</code>
            <p>Both sides use the same trailing seven-day comparison window.</p>
          </article>
          <article>
            <h2>Historical Kratter conversion</h2>
            <code>historical amount × pinned daily BTC/USD price</code>
            <p>{dashboard.simpleView.historicalKratter.note}</p>
          </article>
          <article>
            <h2>Market-depth caveat</h2>
            <code>price extrapolation ≠ executable order</code>
            <p>Visible price and speed do not prove the reinforcement gap can be filled.</p>
          </article>
        </div>
        <div className="secondary-links">
          <a href={assetUrl('data/methodology.json')}>METHODOLOGY JSON</a>
          <a href={assetUrl('data/dashboard.json')}>DASHBOARD JSON</a>
          <a href={assetUrl('data/rental-market.json')}>MARKET DATA</a>
          <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">GITHUB <ExternalLink size={14} /></a>
        </div>
      </main>
    </div>
  )
}

function LedgerPage({ data }: { data: AppData }) {
  return (
    <div className="secondary-shell">
      <SecondaryHeader title="SIGNALING BLOCK LEDGER" />
      <main className="secondary-main ledger-page">
        <p className="eyebrow">Full public record</p>
        <h1>THE BLOCKS BEHIND THE HEADLINES</h1>
        <p className="secondary-lede">
          Search, sort and inspect every independently classified signaling block.
        </p>
        <SignalLedger blocks={data.blocks} />
      </main>
    </div>
  )
}

export function SimpleLanding({ data }: { data: AppData }) {
  const { dashboard } = data
  const simple = dashboard.simpleView
  const recruit = dashboard.highValueRecruit
  const [fredCommitment, setFredCommitment] = useState(simple.fredCommitmentOptionsUsd[0])
  const fredDuration = useMemo(
    () => formatHumanDuration(
      fredMatchDurationSeconds(fredCommitment, simple.matchF2PoolCostPerDayUsd),
    ),
    [fredCommitment, simple.matchF2PoolCostPerDayUsd],
  )
  const countdown = formatHumanDuration(simple.secondsUntilMandatory)
  const bipWidth = simple.f2poolMatchedPct === null
    ? 0
    : Math.max(2, Math.min(simple.f2poolMatchedPct, 100))

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top"><span>₿</span> WAR CHEST</a>
        <nav aria-label="Primary">
          <a href="#kratter">KRATTER</a>
          <a href="#f2pool">F2POOL</a>
          <a href="#fred">FRED</a>
          <a href="#methodology">METHODOLOGY</a>
        </nav>
        <a className="sticky-countdown" href="#f2pool">
          <i />
          <strong>{countdown}</strong>
          <span>until mandatory signaling</span>
        </a>
      </header>

      <main id="top">
        <section className="landing-section hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Public hashpower field report</p>
            <h1>BIP-110<br />WAR CHEST</h1>
            <h2>How much has the fight cost — and what would it take to match F2Pool?</h2>
          </div>
          <img
            className="hero-general"
            src={assetUrl('assets/caricatures/general-kratter-hero-v2.webp')}
            alt="Satirical caricature of General Kratter"
          />
          <div className="hero-metrics">
            <Metric
              label="Estimated fight cost so far"
              value={formatSimpleUsd(simple.fightCostSoFarUsd)}
              badge="ILLUSTRATIVE 8% MODEL"
              note="Assumes the signaling footprint performed like General Kratter’s reported −8% interim result."
            />
            <Metric
              label="Current signaling army cost"
              value={`${formatSimpleUsd(simple.currentArmyCostPerDayUsd)} / day`}
              badge="CURRENT-PRICE ESTIMATE"
            />
            <Metric
              label="Additional cost to match F2Pool"
              value={`${formatSimpleUsd(simple.matchF2PoolCostPerDayUsd)} / day`}
              badge="THEORETICAL SCENARIO"
              note="Market depth and fillability are not proven."
            />
          </div>
          <p className="hero-footnote">
            Estimated from the public signaling footprint and current hashpower pricing. These are not private rental invoices.
          </p>
        </section>

        <section className="landing-section kratter-section" id="kratter">
          <div className="section-kicker">
            <p className="eyebrow">Receipt file 001</p>
            <h2>THE GENERAL WENT FIRST</h2>
          </div>
          <div className="kratter-layout">
            <div className="kratter-portrait">
              <img
                src={assetUrl('assets/caricatures/kratter-scale.webp')}
                alt="General Kratter and a satirical balance scale"
              />
              <p>
                Approximate daily-price conversion pinned to {simple.historicalKratter.priceDate ?? 'an unavailable date'}.
                Exact execution time remains unverified.
              </p>
            </div>
            <div className="kratter-story">
              <div className="kratter-values">
                <article>
                  <span>Committed</span>
                  <strong>≈ {formatSimpleUsd(simple.kratterCommittedUsd)}</strong>
                </article>
                <article>
                  <span>Maximum reported interim loss</span>
                  <strong>≈ {formatSimpleUsd(simple.kratterMaximumLossUsd)}</strong>
                </article>
              </div>
              <div className="psu-scale">
                <em>
                  1 PSU = one ${simple.psuAnnualPriceUsd.toLocaleString('en-US')} annual Plebslop University subscription
                </em>
                <Scale aria-hidden="true" size={48} />
                <div>
                  <span>General’s maximum reported interim loss</span>
                  <strong>≈ {formatSimpleUsd(simple.kratterMaximumLossUsd)}</strong>
                </div>
                <b>VS.</b>
                <div>
                  <span>One annual Plebslop University subscription</span>
                  <strong>${simple.psuAnnualPriceUsd.toLocaleString('en-US')}</strong>
                </div>
              </div>
              <blockquote>The general did not complete one full academic year of financial sacrifice.</blockquote>
              <div className="section-cta">
                <div>
                  <h3>FOLLOW THE GENERAL’S EXAMPLE</h3>
                  <p>General Kratter committed real sats. The next step is to add measurable hash rate.</p>
                </div>
                <a href={simple.rentHashRateUrl} target="_blank" rel="noreferrer">
                  RENT HASH RATE <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section battle-section" id="f2pool">
          <div className="section-kicker">
            <p className="eyebrow">Matched seven-day window</p>
            <h2>THE REAL BATTLE</h2>
            <h3>Voluntary signaling is the parade. Mandatory signaling is where the real risk begins.</h3>
          </div>
          <div className="battle-countdown">
            <span>{countdown.toUpperCase()}</span>
            <strong>until mandatory signaling</strong>
            <p>After that point, rented hash may face real minority-chain and orphan-risk exposure.</p>
            <blockquote>Slogans are cheap. Minority-chain risk is not.</blockquote>
          </div>
          <div className="boss-stage">
            <div className="fighter general-fighter">
              <img src={assetUrl('assets/caricatures/general-kratter-hero-v2.webp')} alt="" />
              <span>GENERAL’S ARMY</span>
            </div>
            <div className="boss-bars">
              <div className="army-row">
                <div><span>BIP-110 army</span><strong>{formatSimpleEh(simple.bip110SevenDayEhS)}</strong></div>
                <div className="army-track"><i style={{ width: `${bipWidth}%` }} /></div>
              </div>
              <div className="army-row boss-row">
                <div><span>F2Pool</span><strong>{formatSimpleEh(simple.f2poolSevenDayEhS)}</strong></div>
                <div className="army-track"><i style={{ width: '100%' }} /></div>
              </div>
              <div className="battle-support">
                <article>
                  <span>Reinforcements needed</span>
                  <strong>{formatSimpleEh(simple.reinforcementsNeededEhS, ' needed')}</strong>
                </article>
                <article>
                  <span>F2Pool matched</span>
                  <strong>{simple.f2poolMatchedPct === null ? 'Unavailable' : `${Math.round(simple.f2poolMatchedPct)}%`}</strong>
                </article>
                <article>
                  <span>Reinforcement bill</span>
                  <strong>{formatSimpleUsd(simple.matchF2PoolCostPerDayUsd)} / day</strong>
                </article>
              </div>
              <small className="model-badge">THEORETICAL CURRENT-PRICE ESTIMATE</small>
              <p className="battle-caveat">The required rentable supply may not exist at this price. Market depth is not proven.</p>
            </div>
            <div className="fighter boss-fighter">
              <img src={assetUrl('assets/caricatures/wang-chun-boss-v2.webp')} alt="Satirical caricature of Wang Chun, F2Pool boss" />
              <span>WANG CHUN // F2POOL</span>
              <blockquote>“{dashboard.bossBattle.quote.text}”</blockquote>
              <a href={dashboard.bossBattle.quote.sourceUrl} target="_blank" rel="noreferrer">SOURCE</a>
            </div>
          </div>
        </section>

        <section className="landing-section fred-section" id="fred">
          <div className="fred-layout">
            <div className="fred-portrait">
              <img
                src={assetUrl('assets/caricatures/fred-krueger-recruit-v3.webp')}
                alt="Satirical recruitment portrait of Fred Krueger"
              />
              <p>He launched a Solana meme coin in seconds. Surely he can launch one hashpower order.</p>
            </div>
            <div className="fred-story">
              <p className="eyebrow">High-value recruit</p>
              <h2>FRED, WE NEED REINFORCEMENTS</h2>
              <div className="fred-facts">
                <article>
                  <strong>$500M+</strong>
                  <span>Publicly reported aggregate startup exit value</span>
                  <small>Not a measure of personal liquid wealth.</small>
                </article>
                <article>
                  <span>Public hash-rate receipt</span>
                  <strong>NOT RECORDED</strong>
                  <small>This is not proof of zero commitment. It means the public dashboard currently has nothing to count.</small>
                </article>
              </div>
              <div className="fred-picker">
                <span>Choose a theoretical commitment</span>
                <div role="group" aria-label="Fred commitment">
                  {simple.fredCommitmentOptionsUsd.map((amount) => (
                    <button
                      className={amount === fredCommitment ? 'is-active' : ''}
                      key={amount}
                      type="button"
                      aria-pressed={amount === fredCommitment}
                      onClick={() => setFredCommitment(amount)}
                    >
                      {formatCommitmentUsd(amount)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="fred-result" aria-live="polite">
                <span>HOW LONG COULD THIS MATCH F2POOL?</span>
                <strong>{fredDuration.toUpperCase()}</strong>
                <small>THEORETICAL CURRENT-PRICE ESTIMATE</small>
              </div>
              <a className="fred-cta" href={recruit.claimReceiptUrl} target="_blank" rel="noreferrer">
                <Receipt size={18} /> FRED, CLAIM YOUR RECEIPT
              </a>
              <p className="fred-cta-note">Public evidence will be added whether it helps or hurts the satire.</p>
              <details className="why-fred">
                <summary>WHY FRED? <ChevronDown size={17} /></summary>
                <div>
                  <p><strong>Public support:</strong> {recruit.publicSupport.profileLabel}; publicly visible.</p>
                  <p><strong>Resume:</strong> Ten exits listed; aggregate figure reported publicly.</p>
                  <p><strong>StupidCoin:</strong> {recruit.stupidCoin.description}.</p>
                  <p><strong>Ordinals / BRC-20:</strong> Archival or secondary evidence only.</p>
                  {[...recruit.publicSupport.supportEvidence, ...recruit.resumeScale.sources, ...recruit.stupidCoin.sources].map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                      {source.title} · {source.kind} · {source.confidence}
                    </a>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </section>

        <section className="landing-section methodology-section" id="methodology">
          <div className="section-kicker">
            <p className="eyebrow">Four rules, no terminal</p>
            <h2>HOW THESE NUMBERS WORK</h2>
          </div>
          <ol>
            <li>Signaling does not prove rented hash rate.</li>
            <li>The fight-cost number applies General Kratter’s illustrative −8% result to the public signaling footprint.</li>
            <li>F2Pool comparisons use matched trailing windows.</li>
            <li>Current-price rental estimates do not prove sufficient market depth.</li>
          </ol>
          <div className="method-links">
            <a href="?view=methodology">FULL METHODOLOGY</a>
            <a href={assetUrl('data/dashboard.json')}>RAW DATA</a>
            <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">GITHUB</a>
            <a href="?view=ledger">SIGNALING BLOCK LEDGER</a>
          </div>
        </section>

        <section className="landing-section closing-panel">
          <img src={assetUrl('assets/caricatures/blocks-dont-lie.webp')} alt="" />
          <div>
            <p className="eyebrow">After-action report</p>
            <h2>BLOCKS DON’T LIE</h2>
            <h3>THE CHAIN KEEPS THE RECEIPTS</h3>
            <blockquote>Leaders go first. Loudmouths outsource risk to plebs.</blockquote>
          </div>
        </section>
      </main>

      <footer>
        <strong>BIP-110 WAR CHEST</strong>
        <span>Public evidence · current-price estimates · clearly labeled satire</span>
      </footer>
    </div>
  )
}

function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAppData().then(setData).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Unknown data error')
    })
  }, [])

  if (error) return <ErrorState message={error} />
  if (!data) return <LoadingState />

  const view = new URLSearchParams(window.location.search).get('view')
  if (view === 'methodology') return <MethodologyPage data={data} />
  if (view === 'ledger') return <LedgerPage data={data} />
  return <SimpleLanding data={data} />
}

export default App
