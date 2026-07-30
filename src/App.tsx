import {
  ArrowDown,
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Coins,
  Cpu,
  ExternalLink,
  Megaphone,
  Receipt,
  RotateCcw,
  Scale,
  Share2,
  ShieldAlert,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { SignalLedger } from './components/SignalLedger'
import type { AppData } from './lib/loadData'
import { loadAppData } from './lib/loadData'
import {
  buildPlebShareText,
  estimateLiveMandatorySeconds,
  formatCountdownLabel,
  formatHumanDuration,
  formatCommitmentUsd,
  formatSimpleEh,
  formatSimpleUsd,
  fredMatchDurationSeconds,
  mandatoryReadingWindowCopy,
  splitCountdown,
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
  const [recruitmentStatus, setRecruitmentStatus] = useState('')
  const [liveMandatorySeconds, setLiveMandatorySeconds] = useState(() => (
    estimateLiveMandatorySeconds(simple.secondsUntilMandatory, dashboard.generatedAt)
  ))
  useEffect(() => {
    const updateCountdown = () => {
      setLiveMandatorySeconds(
        estimateLiveMandatorySeconds(simple.secondsUntilMandatory, dashboard.generatedAt),
      )
    }
    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1_000)
    return () => window.clearInterval(intervalId)
  }, [dashboard.generatedAt, simple.secondsUntilMandatory])
  const fredDuration = useMemo(
    () => formatHumanDuration(
      fredMatchDurationSeconds(fredCommitment, simple.matchF2PoolCostPerDayUsd),
    ),
    [fredCommitment, simple.matchF2PoolCostPerDayUsd],
  )
  const countdown = formatHumanDuration(liveMandatorySeconds)
  const countdownParts = splitCountdown(liveMandatorySeconds)
  const countdownLabel = countdownParts === null ? 'Countdown unavailable' : formatCountdownLabel(countdownParts)
  const readingWindowCopy = mandatoryReadingWindowCopy(liveMandatorySeconds)
  const currentPageUrl = `${window.location.origin}${window.location.pathname}`
  const plebShareText = buildPlebShareText({
    reinforcementsNeededEhS: simple.reinforcementsNeededEhS,
    reinforcementBillPerDayUsd: simple.matchF2PoolCostPerDayUsd,
    currentPageUrl,
  })
  const bipWidth = simple.f2poolMatchedPct === null
    ? 0
    : Math.max(2, Math.min(simple.f2poolMatchedPct, 100))

  async function recruitAGeneral() {
    setRecruitmentStatus('')

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BIP-110 War Chest',
          text: plebShareText,
        })
        setRecruitmentStatus('Recruitment order shared')
        return
      } catch (reason) {
        if ((reason as { name?: string })?.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(plebShareText)
      setRecruitmentStatus('Recruitment order copied')
    } catch {
      setRecruitmentStatus('Copy failed. Share this page manually.')
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top"><span>₿</span> WAR CHEST</a>
        <nav aria-label="Primary">
          <a href="#kratter">KRATTER</a>
          <a href="#risk">THE RISK</a>
          <a href="#f2pool">F2POOL</a>
          <a href="#fred">FRED</a>
          <a href="#methodology">METHODOLOGY</a>
        </nav>
        <a className="sticky-countdown" href="#risk">
          <i />
          <strong>{countdown}</strong>
          <span>until mandatory signaling</span>
        </a>
      </header>

      <main id="top">
        <section className="story-panel hero-story" aria-labelledby="hero-title">
          <div className="hero-story-copy">
            <p className="eyebrow">Public hashpower field report</p>
            <h1 id="hero-title">GENERAL KRATTER CALLED THE PLEBS TO WAR</h1>
            <blockquote>
              Rent hash rate. Rug the spammers. Defend the network. Fight the Fabians.
            </blockquote>
          </div>
          <img
            className="hero-story-art"
            src={assetUrl('assets/caricatures/general-kratter-hero-v2.webp')}
            alt="General Kratter directing marching plebs and Bitcoin miners into battle"
          />
          <div className="hero-story-footer">
            <p>Naturally, we opened the ledger.</p>
            <a href="#kratter">
              Continue <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="story-panel commitment-panel" id="kratter" aria-labelledby="commitment-title">
          <div className="story-copy">
            <p className="eyebrow">Receipt file 001</p>
            <h2 id="commitment-title">THE GENERAL WENT FIRST</h2>
            <strong className="story-number">≈ {formatSimpleUsd(simple.kratterCommittedUsd)} COMMITTED</strong>
            <p className="story-support">About 0.1 BTC of rented hash rate.</p>
            <blockquote>The invasion had officially received its seed round.</blockquote>
            <small className="data-note">
              Historical daily-price conversion pinned to {simple.historicalKratter.priceDate ?? 'an unavailable date'}.
              Exact execution time remains unverified.
            </small>
          </div>
          <figure className="commitment-visual">
            <img
              src={assetUrl('assets/caricatures/general-kratter-hero-v2.webp')}
              alt="General Kratter presenting a comically small campaign war chest"
            />
            <div className="tiny-war-chest" aria-hidden="true">
              <Coins size={28} />
              <span>SEED ROUND</span>
            </div>
          </figure>
        </section>

        <section className="story-panel loss-panel" aria-labelledby="loss-title">
          <figure className="loss-art">
            <img
              src={assetUrl('assets/caricatures/kratter-scale.webp')}
              alt="General Kratter beside a satirical financial balance scale"
            />
          </figure>
          <div className="story-copy">
            <p className="eyebrow">After-action report</p>
            <h2 id="loss-title">THE GENERAL RETURNED FROM BATTLE</h2>
            <strong className="story-number">≈ {formatSimpleUsd(simple.kratterMaximumLossUsd)} LOST</strong>
            <div className="loss-scale" aria-label="Comparison of the general's reported loss and one Plebslop year">
              <div>
                <span>General’s battlefield loss</span>
                <strong>≈ {formatSimpleUsd(simple.kratterMaximumLossUsd)}</strong>
              </div>
              <Scale size={40} aria-hidden="true" />
              <div className="is-heavier">
                <span>1 year of Plebslop</span>
                <strong>${simple.psuAnnualPriceUsd.toLocaleString('en-US')}</strong>
              </div>
            </div>
            <p className="psu-joke">
              1 PSU = one ${simple.psuAnnualPriceUsd.toLocaleString('en-US')} annual Plebslop University subscription
            </p>
            <blockquote>The general did not complete one full academic year of financial sacrifice.</blockquote>
            <p className="sub-punchline">
              It costs more to hear the call to arms for one year than the general demonstrated losing in battle.
            </p>
            <div className="loss-cta">
              <div>
                <h3>FOLLOW THE GENERAL’S EXAMPLE</h3>
                <p>It takes less than five minutes.</p>
              </div>
              <a href={simple.rentHashRateUrl} target="_blank" rel="noreferrer">
                RENT HASH RATE <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </section>

        <section className="story-panel cheap-panel" aria-labelledby="cheap-title">
          <div className="story-copy">
            <p className="eyebrow">Voluntary signaling phase</p>
            <h2 id="cheap-title">FOR NOW, THIS IS STILL THE CHEAP PART</h2>
            <strong className="story-number">≈ {formatSimpleUsd(simple.currentArmyCostPerDayUsd)} / DAY</strong>
            <p className="number-label">Current signaling hashpower equivalent</p>
            <p className="story-support">
              Today, rented hash still mines ordinary Bitcoin blocks and still earns mining rewards.
              The current pain is mostly the rental premium, mining variance, platform costs and any fees deliberately excluded from blocks.
            </p>
            <blockquote>At this stage, even the cannonballs are mostly refundable.</blockquote>
          </div>
          <div className="cashback-machine" role="img" aria-label="A satirical machine returning most of a hash-rental payment as mining rewards">
            <div className="machine-title">WAR WITH PARTIAL CASHBACK</div>
            <div className="machine-input">
              <CircleDollarSign size={42} />
              <span>RENTAL COST</span>
            </div>
            <div className="machine-core">
              <span>HASH</span>
              <i />
              <span>BLOCKS</span>
            </div>
            <div className="machine-output">
              <div>
                <RotateCcw size={34} />
                <span>MINING REWARDS RETURN</span>
              </div>
              <div>
                <Receipt size={30} />
                <span>PREMIUM + VARIANCE</span>
              </div>
              <div>
                <Coins size={28} />
                <span>RUG THE SPAMMERS TAX</span>
              </div>
            </div>
          </div>
        </section>

        <section className="story-panel risk-panel" id="risk" aria-labelledby="risk-title">
          <div className="risk-clock" aria-hidden="true">
            <Clock3 size={72} />
            <ShieldAlert size={42} />
            <i />
          </div>
          <div className="story-copy">
            <p className="eyebrow">Mandatory signaling countdown</p>
            <h2 id="risk-title">THE COSPLAY ENDS IN</h2>
            {countdownParts === null ? (
              <strong className="story-number">COUNTDOWN UNAVAILABLE</strong>
            ) : liveMandatorySeconds === 0 ? (
              <strong className="story-number mandatory-started">MANDATORY SIGNALING HAS BEGUN</strong>
            ) : (
              <div
                className="mandatory-countdown"
                role="timer"
                aria-label={`${countdownLabel} until mandatory signaling`}
              >
                {([
                  ['DAYS', countdownParts.days],
                  ['HOURS', countdownParts.hours],
                  ['MINUTES', countdownParts.minutes],
                  ['SECONDS', countdownParts.seconds],
                ] as const).map(([label, value]) => (
                  <div className="countdown-unit" key={label} aria-hidden="true">
                    <strong className="countdown-value" key={`${label}-${value}`}>
                      {String(value).padStart(2, '0')}
                    </strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="number-label">
              Estimated time to mandatory signaling at block {dashboard.battleClock.mandatoryStartHeight.toLocaleString('en-US')}
            </p>
            <p className="story-support">
              Based on the rolling block interval. The estimate updates every second; Bitcoin may arrive early or late.
              After that point, rented hash may face real minority-chain and orphan-risk exposure.
            </p>
            <div className="risk-comparison">
              <article>
                <h3>NOW</h3>
                <ul>
                  <li>Rent hash</li>
                  <li>Mine blocks</li>
                  <li>Get paid</li>
                  <li>Post memes</li>
                </ul>
              </article>
              <article>
                <h3>AFTER MANDATORY SIGNALING</h3>
                <ul>
                  <li>Nodes reject non-signaling blocks</li>
                  <li>Minority-chain risk becomes real</li>
                  <li>Hash-rate mistakes become much more expensive</li>
                </ul>
              </article>
            </div>
            <blockquote>The uniforms stay funny. The settlement risk does not.</blockquote>
          </div>
        </section>

        <section className="story-panel mission-panel" id="f2pool" aria-labelledby="mission-title">
          <div className="mission-heading">
            <p className="eyebrow">Matched seven-day window</p>
            <h2 id="mission-title">THE MISSION</h2>
            <strong>MATCH F2POOL</strong>
          </div>
          <div className="mission-stage">
            <figure className="mission-fighter general-side">
              <img src={assetUrl('assets/caricatures/general-kratter-hero-v2.webp')} alt="General Kratter and the smaller BIP-110 army" />
              <figcaption>BIP-110 ARMY</figcaption>
            </figure>
            <div className="mission-meter">
              <div className="mission-stat">
                <span>BIP-110 army</span>
                <strong>{formatSimpleEh(simple.bip110SevenDayEhS)}</strong>
              </div>
              <div className="boss-track" aria-label={`${Math.round(bipWidth)} percent of F2Pool matched`}>
                <i style={{ width: `${bipWidth}%` }} />
              </div>
              <div className="mission-stat">
                <span>F2Pool</span>
                <strong>{formatSimpleEh(simple.f2poolSevenDayEhS)}</strong>
              </div>
              <div className="mission-outcomes">
                <article>
                  <span>Still needed</span>
                  <strong>{formatSimpleEh(simple.reinforcementsNeededEhS, ' still needed')}</strong>
                </article>
                <article>
                  <span>Reinforcement bill</span>
                  <strong>≈ {formatSimpleUsd(simple.matchF2PoolCostPerDayUsd)} / day</strong>
                </article>
              </div>
              <blockquote>
                The boss battle is currently {simple.f2poolMatchedPct === null ? 'unavailable' : `${Math.round(simple.f2poolMatchedPct)}% loaded`}.
              </blockquote>
              <small>Theoretical current-price estimate. Market depth not proven.</small>
            </div>
            <figure className="mission-fighter boss-side">
              <img src={assetUrl('assets/caricatures/wang-chun-boss-v2.webp')} alt="Wang Chun portrayed as the F2Pool boss battle" />
              <figcaption>WANG CHUN // F2POOL</figcaption>
              <blockquote>“{dashboard.bossBattle.quote.text}”</blockquote>
              <a href={dashboard.bossBattle.quote.sourceUrl} target="_blank" rel="noreferrer">SOURCE</a>
            </figure>
          </div>
        </section>

        <section className="story-panel fred-panel" id="fred" aria-labelledby="fred-title">
          <div className="fred-visual">
            <img
              src={assetUrl('assets/caricatures/fred-krueger-recruit-v3.webp')}
              alt="Fred Krueger with a microphone and an empty hashpower receipt"
            />
            <p>He launched a Solana meme coin in seconds. Surely he can launch one hashpower order.</p>
          </div>
          <div className="fred-story">
            <p className="eyebrow">High-value recruit</p>
            <h2 id="fred-title">FRED, WE FOUND YOUR SIDE QUEST</h2>
            <div className="fred-facts">
              <article>
                <span>Publicly reported aggregate startup exit value</span>
                <strong>$500M+</strong>
                <small>Not a measure of personal liquid wealth.</small>
              </article>
              <article>
                <span>Public hash-rental receipt</span>
                <strong>NOT RECORDED</strong>
                <small>This does not prove zero commitment. It means the public ledger has nothing to count.</small>
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
            <details className="why-fred">
              <summary>WHY FRED? <ChevronDown size={17} /></summary>
              <div>
                <p><strong>Public support:</strong> {recruit.publicSupport.profileLabel}; publicly visible.</p>
                <p><strong>Resume:</strong> Ten exits listed on his official site.</p>
                <p><strong>StupidCoin:</strong> {recruit.stupidCoin.description}.</p>
                <p><strong>Former Ordinals enjoyer:</strong> Historical association; archival or secondary evidence only.</p>
                {[...recruit.publicSupport.supportEvidence, ...recruit.resumeScale.sources, ...recruit.stupidCoin.sources].map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                    {source.title} · {source.kind} · {source.confidence}
                  </a>
                ))}
              </div>
            </details>
          </div>
        </section>

        <section className="story-panel pleb-plan-panel" id="pleb-plan" aria-labelledby="pleb-plan-title">
          <header className="pleb-plan-heading">
            <div>
              <p className="eyebrow">Field orders for the ordinary pleb</p>
              <h2 id="pleb-plan-title">PLEB, CHOOSE YOUR ADVENTURE</h2>
            </div>
            <p>Three ways to help the war effort. Only one comes with a textbook.</p>
          </header>

          <div className="pleb-paths">
            <article className="pleb-path economist-path">
              <span className="recommended-badge">RECOMMENDED</span>
              <div className="pleb-path-icon" aria-hidden="true">
                <BookOpen size={42} strokeWidth={1.7} />
              </div>
              <p className="pleb-path-label">THE ECONOMIST</p>
              <h3>1. LEARN THE ECONOMICS FIRST</h3>
              <p className="pleb-dynamic-line">{readingWindowCopy}</p>
              <p>
                Use the time to read <cite>Principles of Economics</cite> by Saifedean Ammous.
                It may save you sats and several hundred hours of emergency X Spaces.
              </p>
              <blockquote>Learn opportunity cost before volunteering to demonstrate it.</blockquote>
              <a
                className="pleb-cta"
                href="https://saifedean.com/poe"
                target="_blank"
                rel="noreferrer"
                aria-label="Read Principles of Economics by Saifedean Ammous in a new tab"
              >
                READ PRINCIPLES OF ECONOMICS <ExternalLink size={15} aria-hidden="true" />
              </a>
              <small>Book information and free preview chapters.</small>
            </article>

            <article className="pleb-path hasher-path">
              <div className="pleb-path-icon" aria-hidden="true">
                <Cpu size={42} strokeWidth={1.7} />
              </div>
              <p className="pleb-path-label">THE HASHER</p>
              <h3>2. STILL CONVINCED? RENT HASH RATE</h3>
              <p>Finished the book—or heroically declined to open it? Then put measurable hash rate behind the slogans.</p>
              <p className="pleb-dynamic-line">
                <strong>{formatSimpleEh(simple.reinforcementsNeededEhS)}</strong> are still needed to match F2Pool.
              </p>
              <blockquote>Congratulations: your support has been upgraded from audible to measurable.</blockquote>
              <a
                className="pleb-cta"
                href={simple.rentHashRateUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Rent hash rate in a new tab"
              >
                RENT HASH RATE <ExternalLink size={15} aria-hidden="true" />
              </a>
              <small>Hash-rate rentals can lose money. Commit only what you are prepared to lose.</small>
            </article>

            <article className="pleb-path recruiter-path">
              <div className="pleb-path-icon" aria-hidden="true">
                <Megaphone size={42} strokeWidth={1.7} />
              </div>
              <p className="pleb-path-label">THE RECRUITER</p>
              <h3>3. RECRUIT YOUR FAVORITE GENERAL</h3>
              <p>Prefer to keep your own sats? Ask your favorite BIP-110 influencer how much hash rate they are personally funding.</p>
              <p className="pleb-dynamic-line">Every public receipt will be counted—especially the inconvenient ones.</p>
              <blockquote>Why spend your own sats when a general with a microphone may still be available?</blockquote>
              <button
                className="pleb-cta"
                type="button"
                onClick={recruitAGeneral}
                aria-label="Recruit a general by sharing this page"
              >
                RECRUIT A GENERAL <Share2 size={16} aria-hidden="true" />
              </button>
              <a
                className="pleb-secondary-cta"
                href={recruit.claimReceiptUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Submit a public hash-rate receipt in a new tab"
              >
                SUBMIT A PUBLIC RECEIPT <ExternalLink size={13} aria-hidden="true" />
              </a>
              <p className="pleb-share-status" role="status" aria-live="polite">{recruitmentStatus}</p>
            </article>
          </div>

          <blockquote className="pleb-plan-footer">
            Read first. Rent second. Recruit the rich before liquidating the plebs.
          </blockquote>
        </section>

        <section className="story-panel summary-panel" aria-labelledby="summary-title">
          <div className="summary-heading">
            <p className="eyebrow">The ledger, after the story</p>
            <h2 id="summary-title">AFTER-ACTION SUMMARY</h2>
          </div>
          <div className="summary-numbers">
            <article>
              <span>Fight cost so far</span>
              <strong>≈ {formatSimpleUsd(simple.fightCostSoFarUsd)}</strong>
            </article>
            <article>
              <span>Current army</span>
              <strong>≈ {formatSimpleUsd(simple.currentArmyCostPerDayUsd)} / day</strong>
            </article>
            <article>
              <span>Cost to match F2Pool</span>
              <strong>≈ {formatSimpleUsd(simple.matchF2PoolCostPerDayUsd)} / day</strong>
            </article>
          </div>
          <blockquote>The chain records blocks. The dashboard records receipts.</blockquote>
        </section>

        <section className="story-panel methodology-panel" id="methodology" aria-labelledby="methodology-title">
          <div className="methodology-heading">
            <p className="eyebrow">Four rules, no terminal</p>
            <h2 id="methodology-title">HOW THESE NUMBERS WORK</h2>
          </div>
          <ol>
            <li>Signaling does not prove rented hash rate.</li>
            <li>The fight-cost estimate applies General Kratter’s illustrative −8% result to the public signaling footprint.</li>
            <li>F2Pool comparisons use matched trailing windows.</li>
            <li>Current-price estimates do not prove available market depth.</li>
          </ol>
          <div className="method-links">
            <a href="?view=methodology">FULL METHODOLOGY</a>
            <a href={assetUrl('data/dashboard.json')}>RAW DATA</a>
            <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">GITHUB</a>
            <a href="?view=ledger">BLOCK LEDGER</a>
          </div>
        </section>

        <section className="story-panel closing-story" aria-labelledby="closing-title">
          <div className="closing-copy">
            <div className="closing-title-block">
              <p className="eyebrow">Final receipt</p>
              <h2 id="closing-title">BLOCKS DON’T LIE</h2>
              <h3>THE CHAIN KEEPS THE RECEIPTS</h3>
            </div>
            <blockquote>Leaders go first. Loudmouths outsource risk to plebs.</blockquote>
          </div>
          <img
            src={assetUrl('assets/caricatures/closing-empty-bags-v1.webp')}
            alt="General Kratter and Wang Chun walking away while plebs hold empty bags"
          />
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
