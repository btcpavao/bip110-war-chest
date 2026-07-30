import { ArrowRight, ExternalLink, Receipt, Share2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BrandMark } from '../components/BrandMark'
import { EditorialIllustration } from '../components/EditorialIllustration'
import { ShareMessageDialog } from '../components/ShareMessageDialog'
import type { AppData } from '../lib/loadData'
import { appPath, assetUrl } from '../lib/paths'
import './FabiansPage.css'

const PAGE_TITLE = 'Who Are the Fabians? — BIP-110 War Chest'
const PAGE_DESCRIPTION = 'A ministerial briefing on the alleged long-range Landauer attack, mitochondrial readiness and the missing public hash-rate receipt.'

type MetadataSnapshot = {
  element: HTMLMetaElement | HTMLLinkElement
  value: string | null
}

function useFabiansMetadata(pagePath: '/fabians') {
  useEffect(() => {
    const previousTitle = document.title
    const snapshots: MetadataSnapshot[] = []

    const setMeta = (selector: string, attribute: 'content' | 'href', value: string) => {
      let element = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
      if (!element) {
        element = selector.startsWith('link')
          ? document.createElement('link')
          : document.createElement('meta')
        if (selector.includes('name="description"')) element.setAttribute('name', 'description')
        if (selector.includes('property="og:title"')) element.setAttribute('property', 'og:title')
        if (selector.includes('property="og:description"')) element.setAttribute('property', 'og:description')
        if (selector.includes('property="og:image"')) element.setAttribute('property', 'og:image')
        if (selector.startsWith('link')) element.setAttribute('rel', 'canonical')
        document.head.append(element)
      }
      snapshots.push({ element, value: element.getAttribute(attribute) })
      element.setAttribute(attribute, value)
    }

    document.title = PAGE_TITLE
    setMeta('meta[name="description"]', 'content', PAGE_DESCRIPTION)
    setMeta('meta[property="og:title"]', 'content', PAGE_TITLE)
    setMeta('meta[property="og:description"]', 'content', PAGE_DESCRIPTION)
    setMeta('meta[property="og:image"]', 'content', new URL(assetUrl('og.png'), window.location.origin).href)
    setMeta('link[rel="canonical"]', 'href', new URL(appPath(pagePath), window.location.origin).href)

    return () => {
      document.title = previousTitle
      snapshots.forEach(({ element, value }) => {
        if (value === null) element.remove()
        else if (element instanceof HTMLLinkElement) element.setAttribute('href', value)
        else element.setAttribute('content', value)
      })
    }
  }, [pagePath])
}

export function FabiansPage({ data }: { data: AppData }) {
  const fabians = data.dashboard.satire.fabians
  const [isShareOpen, setIsShareOpen] = useState(false)
  const summonButtonRef = useRef<HTMLButtonElement>(null)
  useFabiansMetadata(fabians.pagePath)

  const currentPageUrl = new URL(appPath(fabians.pagePath), window.location.origin).href
  const defaultShareMessage = useMemo(
    () => fabians.shareTextTemplate.replace('{currentPageUrl}', currentPageUrl),
    [currentPageUrl, fabians.shareTextTemplate],
  )

  function closeShareDialog() {
    setIsShareOpen(false)
    window.requestAnimationFrame(() => summonButtonRef.current?.focus())
  }

  return (
    <div className="fabians-page">
      <header className="fabians-topbar">
        <a className="wordmark" href={appPath('/#top')}>
          <BrandMark />
          WAR CHEST
        </a>
        <a href={appPath('/#top')}>RETURN TO MAIN BRIEFING</a>
      </header>

      <main>
        <section className="fabians-hero" aria-labelledby="fabians-title">
          <div className="fabians-hero__copy">
            <p className="eyebrow">Ministry of Health, Fitness &amp; Mitochondrial Warfare</p>
            <span className="fabians-classification">CAMPAIGN-LORE CLASSIFICATION</span>
            <h1 id="fabians-title">WHO ARE THE FABIANS?</h1>
            <blockquote>
              A ministerial briefing from {fabians.ministerName}, {fabians.ministerTitle}.
            </blockquote>
            <p>
              According to {fabians.ministerName} and BIP-110 campaign lore, Bitcoin faces a
              long-range Landauer attack that may eventually transform it into Ethereum.
            </p>
          </div>

          <div className="fabians-hero__visual">
            <EditorialIllustration
              src={assetUrl('assets/caricatures/dr-pleb-kruse-fabians.webp')}
              alt="Satirical illustration of Dr. Pleb Kruse wearing red mitochondrial combat goggles while presenting donuts and a diagram claiming that a long-range Landauer attack could eventually turn Bitcoin into Ethereum."
              width={1200}
              height={1000}
              priority
              fallbackLabel="DR. PLEB KRUSE // MINISTERIAL PORTRAIT PENDING"
              caption="The minister is currently conducting an independent longitudinal study into whether red lenses can offset twelve glazed donuts."
            />
            <span className="fabians-specimen fabians-specimen--one">PROOF OF SNACK</span>
            <span className="fabians-specimen fabians-specimen--two">MITOCHONDRIAL HASH RATE: UNVERIFIED</span>
            <span className="fabians-specimen fabians-specimen--three">FABIAN ETA: EVENTUALLY</span>
          </div>
        </section>

        <section className="ministerial-theory" aria-labelledby="theory-title">
          <header>
            <p className="eyebrow">Official sequence of alleged events</p>
            <h2 id="theory-title">THE MINISTERIAL THEORY</h2>
          </header>
          <div className="theory-steps">
            <article>
              <span>1</span>
              <h3>THE FABIANS WAIT</h3>
              <p>Patiently. Quietly. Possibly for decades.</p>
            </article>
            <ArrowRight aria-hidden="true" />
            <article>
              <span>2</span>
              <h3>LANDAUER HAPPENS</h3>
              <p>Thermodynamics enters the group chat.</p>
            </article>
            <ArrowRight aria-hidden="true" />
            <article>
              <span>3</span>
              <h3>BITCOIN BECOMES ETHEREUM</h3>
              <p>Eventually™.</p>
            </article>
          </div>
          <aside className="theory-caveat">
            <strong>
              This is the theory as presented in BIP-110 campaign lore, not an established
              Bitcoin attack classification.
            </strong>
            <p>
              Landauer’s principle is a real concept concerning the thermodynamic cost of
              irreversible computation. “Long-range Landauer attack” is presented here as
              campaign terminology, not as a recognized standard Bitcoin security classification.
            </p>
          </aside>
        </section>

        <section className="fabian-dossier" aria-labelledby="field-guide-title">
          <div className="field-guide">
            <div className="field-guide__stamp">TOP SECRET // SHARE PUBLICLY</div>
            <p className="eyebrow">Ministerial threat matrix</p>
            <h2 id="field-guide-title">FABIAN FIELD GUIDE</h2>
            <dl>
              <div><dt>Threat</dt><dd>Fabians</dd></div>
              <div><dt>Range</dt><dd>Extremely long</dd></div>
              <div><dt>Weapon</dt><dd>Landauer</dd></div>
              <div><dt>Target</dt><dd>Bitcoin</dd></div>
              <div><dt>Alleged final form</dt><dd>Ethereum</dd></div>
              <div><dt>Time horizon</dt><dd>Eventually™</dd></div>
              <div><dt>Evidence class</dt><dd>Ministerial briefing</dd></div>
              <div><dt>Recommended defense</dt><dd>BIP-110 and improved mitochondrial output</dd></div>
            </dl>
            <blockquote>Confidence level: red-tinted.</blockquote>
          </div>

          <div className="deployment-status" aria-labelledby="deployment-title">
            <p className="eyebrow">Current chain-adjacent readiness</p>
            <h2 id="deployment-title">MINISTERIAL DEPLOYMENT STATUS</h2>
            <div className="deployment-status__grid">
              <article>
                <h3>Public BIP-110 support</h3>
                <strong>ACTIVE</strong>
              </article>
              <article>
                <h3>Mitochondrial readiness</h3>
                <strong>BOOSTED</strong>
              </article>
              <article className="is-unrecorded">
                <h3>Public hash-rental receipt</h3>
                <strong>{fabians.receiptDisplayLabel}</strong>
              </article>
            </div>
            <p className="deployment-status__caveat">{fabians.receiptDisclaimer}</p>
            <blockquote>
              The Fabians are allegedly attacking across decades. The receipt can be submitted today.
            </blockquote>
          </div>
        </section>

        <section className="summon-minister" aria-labelledby="summon-title">
          <div>
            <p className="eyebrow">Public hash-rate receipt desk</p>
            <h2 id="summon-title">SUMMON THE MINISTER</h2>
            <p>Know the minister? Please tag him. Know the receipt? Even better.</p>
            <small>Every public receipt will be counted—especially the inconvenient ones.</small>
          </div>
          <div className="summon-minister__actions">
            <button
              ref={summonButtonRef}
              type="button"
              onClick={() => setIsShareOpen(true)}
            >
              <Share2 size={18} aria-hidden="true" />
              SUMMON THE MINISTER
            </button>
            <a
              href={data.dashboard.highValueRecruit.claimReceiptUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Receipt size={18} aria-hidden="true" />
              SUBMIT A RECEIPT
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="fabians-return" aria-labelledby="briefing-complete">
          <p className="eyebrow">Briefing complete</p>
          <h2 id="briefing-complete">THE THREAT REMAINS PATIENT</h2>
          <a href={appPath('/#top')}>
            RETURN TO THE WAR CHEST <ArrowRight size={18} aria-hidden="true" />
          </a>
        </section>
      </main>

      <footer className="fabians-disclosure">
        This page is satire. “Long-range Landauer attack” is represented as BIP-110 campaign
        lore and is not presented as an established Bitcoin attack classification. Public receipt
        status refers only to evidence available to this dashboard.
      </footer>

      <ShareMessageDialog
        open={isShareOpen}
        onClose={closeShareDialog}
        title="SUMMON THE MINISTER"
        description="Review the dispatch, add a handle only if you choose, then copy or share it yourself."
        defaultMessage={defaultShareMessage}
        optionalHandleLabel="Optional minister handle"
      />
    </div>
  )
}
