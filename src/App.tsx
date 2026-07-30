import {
  ArrowDown,
  ChevronDown,
  Coins,
  ExternalLink,
  Receipt,
  Share2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { BrandMark } from './components/BrandMark'
import { EditorialIllustration } from './components/EditorialIllustration'
import { FabiansTooltip } from './components/FabiansTooltip'
import { PlebClassCard } from './components/PlebClassCard'
import { SignalLedger } from './components/SignalLedger'
import type { AppData } from './lib/loadData'
import { loadAppData } from './lib/loadData'
import { assetUrl, routeFromPathname } from './lib/paths'
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
import { FabiansPage } from './pages/FabiansPage'

const REPOSITORY_URL = 'https://github.com/btcpavao/bip110-war-chest'

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
        <BrandMark /> WAR CHEST
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
  const psuAnnualPriceUsd = dashboard.satire.annualPriceUsd
  const formattedPsuAnnualPriceUsd = psuAnnualPriceUsd.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })
  const [heroImageMissing, setHeroImageMissing] = useState(false)
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
        <a className="wordmark" href="#top"><BrandMark /> WAR CHEST</a>
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
            <h1 id="hero-title">
              <span className="hero-title-line">GENERAL KRATTER</span>{' '}
              <span className="hero-title-line">CALLED THE PLEBS</span>{' '}
              <span className="hero-title-line">TO WAR</span>
            </h1>
            <blockquote>
              <span>Rent hash rate. Rug the spammers.</span>
              <span>
                Defend the network. Fight the{' '}
                <FabiansTooltip pagePath={dashboard.satire.fabians.pagePath} />.
              </span>
            </blockquote>
          </div>
          <div className="hero-story-visual">
            {heroImageMissing ? (
              <div
                className="hero-story-fallback"
                role="img"
                aria-label="General Kratter battlefield illustration unavailable"
              >
                <span>Field illustration unavailable</span>
                <strong>GENERAL KRATTER’S ORDERS REMAIN ON FILE</strong>
              </div>
            ) : (
              <img
                className="hero-story-art"
                src={assetUrl('assets/caricatures/general-kratter-hero-large.webp')}
                srcSet={`${assetUrl('assets/caricatures/general-kratter-hero-large-960.webp')} 960w, ${assetUrl('assets/caricatures/general-kratter-hero-large.webp')} 1402w`}
                sizes="(max-width: 760px) 100vw, 58vw"
                alt="Satirical illustration of General Kratter pointing a marching pleb army toward a Bitcoin mining battlefield."
                width={1402}
                height={1122}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onError={() => setHeroImageMissing(true)}
              />
            )}
          </div>
          <div className="hero-story-footer">
            <p>Naturally, we opened the ledger.</p>
            <a href="#kratter" aria-label="Continue to the General’s commitment">
              CONTINUE <ArrowDown size={18} aria-hidden="true" />
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
              <a
                href="https://youtu.be/0qIIMD9ZMz8?si=iSm7UTsftIqBqmkf"
                target="_blank"
                rel="noreferrer"
              >
                Archival footage: the General mobilizes the plebs
                <ExternalLink size={12} aria-hidden="true" />
              </a>
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

        <section className="story-panel loss-panel" id="kratter-loss" aria-labelledby="loss-title">
          <EditorialIllustration
            className="loss-illustration"
            src={assetUrl('assets/caricatures/general-returned-from-battle.webp')}
            alt="Satirical illustration of General Kratter displaying a roughly $600 battlefield-loss receipt while standing in front of a largely untouched Bitcoin reserve vault."
            width={1672}
            height={941}
            fallbackLabel="The General Returned From Battle"
          />
          <div className="story-copy">
            <p className="eyebrow">After-action report</p>
            <h2 id="loss-title">THE GENERAL RETURNED FROM BATTLE</h2>
            <strong className="story-number">≈ {formatSimpleUsd(simple.kratterMaximumLossUsd)} LOST</strong>
            <p className="story-support">
              The general returned with cosmetic damage and most of the conviction reserves untouched.
            </p>
            <small className="data-note">
              Based on the publicly reconstructed experiment and maximum reported interim loss.
            </small>
            <details className="satire-note">
              <summary>ABOUT THE RESERVE VAULT</summary>
              <p>
                The reserve vault is satirical. The dashboard does not claim knowledge of Matthew Kratter’s total Bitcoin holdings.
              </p>
            </details>
          </div>
        </section>

        <section className="story-panel plebslop-panel" id="plebslop" aria-labelledby="plebslop-title">
          <EditorialIllustration
            className="plebslop-illustration"
            src={assetUrl('assets/caricatures/plebslop-university.webp')}
            alt="Satirical Plebslop University admissions scene where plebs pay $790 annual tuition while the professor’s reported BIP-110 campaign loss is shown as roughly $600."
            width={1672}
            height={941}
            fallbackLabel="Plebslop University"
          />
          <div className="story-copy plebslop-copy">
            <p className="eyebrow">Plebslop University admissions</p>
            <h2 id="plebslop-title">ONE YEAR OF PLEBSLOP COSTS MORE THAN THE WAR</h2>
            <div className="plebslop-comparison" aria-label="The general's reported loss compared with one year of Plebslop">
              <div>
                <span>General’s reported loss</span>
                <strong>≈ {formatSimpleUsd(simple.kratterMaximumLossUsd)}</strong>
              </div>
              <div>
                <span>One year of Plebslop</span>
                <strong>${formattedPsuAnnualPriceUsd}</strong>
              </div>
            </div>
            <p className="psu-joke">
              1 PSU = one annual ${formattedPsuAnnualPriceUsd} Plebslop University subscription.
            </p>
            <blockquote>
              The students paid more for the lecture than the professor demonstrated losing in the war.
            </blockquote>
            <div className="loss-cta">
              <div>
                <h3>FOLLOW THE GENERAL’S EXAMPLE</h3>
                <p>It takes less than five minutes.</p>
              </div>
              <a href={dashboard.satire.rentHashRateUrl} target="_blank" rel="noreferrer">
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
          <EditorialIllustration
            className="cashback-illustration"
            src={assetUrl('assets/caricatures/partial-cashback-v1.webp')}
            alt="A satirical machine returning most of a hash-rental payment as mining rewards while premiums, variance and the spammer tax drain away"
            width={1448}
            height={1086}
            fallbackLabel="War With Partial Cashback"
          />
        </section>

        <section className="story-panel risk-panel" id="risk" aria-labelledby="risk-title">
          <EditorialIllustration
            className="risk-illustration"
            src={assetUrl('assets/caricatures/mandatory-signaling-v1.webp')}
            alt="A BIP-110 parade approaching a warning sign for mandatory signaling, minority-chain risk and orphan risk"
            width={1448}
            height={1086}
            fallbackLabel="Mandatory Signaling Ahead"
          />
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
          <div className="fred-media">
            <EditorialIllustration
              className="fred-visual"
              src={assetUrl('assets/caricatures/fred-speech-corps.webp')}
              alt="Satirical illustration of Fred Krueger in the Speech Corps speaking into a microphone, holding an unfiled public hash-rental receipt beside a machine that fails to convert X Spaces rhetoric into SHA-256."
              width={1448}
              height={1086}
              fallbackLabel="FRED SPEECH CORPS ILLUSTRATION UNAVAILABLE"
              caption="Click to inspect the receipt. Current rank: Speech Corps. Promotion requirement: one public hashpower receipt."
            />
            <p className="fred-punchline">He launched a Solana meme coin in seconds. Surely he can launch one hashpower order.</p>
            <span className="fred-rhetoric">Rhetoric is not SHA-256 compatible.</span>
          </div>
          <div className="fred-story">
            <p className="eyebrow">High-value recruit</p>
            <h2 id="fred-title">FRED, WE FOUND YOUR SIDE QUEST</h2>
            <div className="fred-facts">
              <article>
                <strong>$500M+</strong>
                <span>Publicly reported aggregate startup exit value</span>
                <small>Not a measure of personal liquid wealth.</small>
              </article>
              <article>
                <strong>NOT RECORDED</strong>
                <span>Public hash-rental receipt</span>
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
            <small className="fred-cta-note">Public evidence will be added whether it helps or hurts the satire.</small>
            <details className="why-fred">
              <summary>WHY FRED? <ChevronDown size={17} /></summary>
              <div>
                <p><strong>Public support:</strong> {recruit.publicSupport.profileLabel}; publicly visible.</p>
                <p>
                  <strong>Résumé:</strong> Ten exits listed on his official site; $500M+ publicly reported aggregate exit value.
                  {' '}{recruit.resumeScale.liquidityDisclaimer}.
                </p>
                <p><strong>StupidCoin:</strong> {recruit.stupidCoin.description}.</p>
                <p><strong>Former Ordinals enjoyer:</strong> Historical association; archival or secondary evidence only.</p>
                <p className="fred-methodology-note">
                  The Speech Corps, Hash Cavalry and SHA-256 converter are satirical. The receipt status refers only to publicly verifiable evidence recorded by this dashboard.
                </p>
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
            <PlebClassCard
              className="economist-path"
              imageSrc={assetUrl('assets/caricatures/pleb-economist.webp')}
              imageAlt="Satirical illustration of an ordinary Bitcoin pleb reading Principles of Economics before deciding whether to join the BIP-110 campaign."
              imageWidth={1122}
              imageHeight={1402}
              classLabel="THE ECONOMIST"
              recommended
              heading="1. LEARN THE ECONOMICS FIRST"
              primaryAction={(
                <a
                  className="pleb-cta"
                  href="https://saifedean.com/poe"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Read Principles of Economics by Saifedean Ammous in a new tab"
                >
                  READ PRINCIPLES OF ECONOMICS <ExternalLink size={15} aria-hidden="true" />
                </a>
              )}
            >
              <p className="pleb-dynamic-line">{readingWindowCopy}</p>
              <p>
                Use the time to read <cite>Principles of Economics</cite> by Saifedean Ammous.
              </p>
              <blockquote>Learn opportunity cost before volunteering to demonstrate it.</blockquote>
            </PlebClassCard>

            <PlebClassCard
              className="hasher-path"
              imageSrc={assetUrl('assets/caricatures/pleb-hasher.webp')}
              imageAlt="Satirical illustration of the same pleb pushing a rented-hash machine while holding a hash-rate rental receipt."
              imageWidth={1122}
              imageHeight={1402}
              classLabel="THE HASHER"
              heading="2. STILL CONVINCED? RENT HASH RATE"
              primaryAction={(
                <a
                  className="pleb-cta"
                  href={simple.rentHashRateUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Rent hash rate in a new tab"
                >
                  RENT HASH RATE <ExternalLink size={15} aria-hidden="true" />
                </a>
              )}
              secondaryAction={(
                <small>Hash-rate rentals can lose money. Commit only what you are prepared to lose.</small>
              )}
            >
              <p>Finished the book—or heroically declined to open it? Put measurable hash rate behind the slogans.</p>
              <p className="pleb-dynamic-line">
                <strong>{formatSimpleEh(simple.reinforcementsNeededEhS)}</strong> are still needed to match F2Pool.
              </p>
              <blockquote>Congratulations: your support has been upgraded from audible to measurable.</blockquote>
            </PlebClassCard>

            <PlebClassCard
              className="recruiter-path"
              imageSrc={assetUrl('assets/caricatures/pleb-recruiter.webp')}
              imageAlt="Satirical illustration of the same pleb using a megaphone and BIP-110 War Chest material to recruit wealthier campaign supporters."
              imageWidth={1122}
              imageHeight={1402}
              classLabel="THE RECRUITER"
              heading="3. RECRUIT YOUR FAVORITE GENERAL"
              primaryAction={(
                <button
                  className="pleb-cta"
                  type="button"
                  onClick={recruitAGeneral}
                  aria-label="Recruit a general by sharing this page"
                >
                  RECRUIT A GENERAL <Share2 size={16} aria-hidden="true" />
                </button>
              )}
              secondaryAction={(
                <a
                  className="pleb-secondary-cta"
                  href={recruit.claimReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Submit a public hash-rate receipt in a new tab"
                >
                  SUBMIT A PUBLIC RECEIPT <ExternalLink size={13} aria-hidden="true" />
                </a>
              )}
              status={(
                <p className="pleb-share-status" role="status" aria-live="polite">{recruitmentStatus}</p>
              )}
            >
              <p>Prefer to keep your own sats? Ask your favorite BIP-110 influencer how much hash rate they are personally funding.</p>
              <p className="pleb-dynamic-line">Every public receipt will be counted—especially the inconvenient ones.</p>
              <blockquote>Why spend your own sats when a general with a microphone may still be available?</blockquote>
            </PlebClassCard>
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

  const route = routeFromPathname(window.location.pathname)
  if (route === data.dashboard.satire.fabians.pagePath && data.dashboard.satire.fabians.enabled) {
    return <FabiansPage data={data} />
  }

  const view = new URLSearchParams(window.location.search).get('view')
  if (view === 'methodology') return <MethodologyPage data={data} />
  if (view === 'ledger') return <LedgerPage data={data} />
  return <SimpleLanding data={data} />
}

export default App
