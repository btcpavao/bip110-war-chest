// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import dashboardRaw from '../public/data/dashboard.json'
import receiptsRaw from '../public/data/influencer-receipts.json'
import blocksRaw from '../public/data/signaling-blocks.json'
import spamTaxRaw from '../public/data/spam-rug-tax.json'
import { SimpleLanding } from './App'
import type { AppData } from './lib/loadData'
import { routeFromPathname } from './lib/paths'
import {
  buildPlebShareText,
  estimateLiveMandatorySeconds,
  formatCountdownLabel,
  formatHumanDuration,
  formatSimpleEh,
  formatSimpleUsd,
  fredMatchDurationSeconds,
  mandatoryReadingWindowCopy,
  splitCountdown,
} from './lib/simple'
import {
  dashboardSchema,
  receiptsDatasetSchema,
  signalingDatasetSchema,
  spamTaxSchema,
} from './lib/schemas'
import { FabiansPage } from './pages/FabiansPage'

function appData(): AppData {
  const blocks = signalingDatasetSchema.parse(blocksRaw)
  return {
    dashboard: dashboardSchema.parse(dashboardRaw),
    blocks: blocks.records,
    receipts: receiptsDatasetSchema.parse(receiptsRaw),
    spamTax: spamTaxSchema.parse(spamTaxRaw),
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  Reflect.deleteProperty(navigator, 'share')
  Reflect.deleteProperty(navigator, 'clipboard')
})

describe('scroll-story landing page', () => {
  it('renders the twelve-panel story without the old dashboard controls', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const view = within(container)

    expect(container.querySelectorAll('main > section')).toHaveLength(12)
    expect(view.getByRole('heading', { name: 'GENERAL KRATTER CALLED THE PLEBS TO WAR' })).toBeInTheDocument()
    expect(view.getByText('THE GENERAL WENT FIRST')).toBeInTheDocument()
    expect(view.getByText('FOR NOW, THIS IS STILL THE CHEAP PART')).toBeInTheDocument()
    expect(view.getByText('THE COSPLAY ENDS IN')).toBeInTheDocument()
    expect(view.getByText('FRED, WE FOUND YOUR SIDE QUEST')).toBeInTheDocument()
    expect(view.getByText('PLEB, CHOOSE YOUR ADVENTURE')).toBeInTheDocument()
    expect(view.getByText('AFTER-ACTION SUMMARY')).toBeInTheDocument()
    expect(view.queryByText('Display currency')).not.toBeInTheDocument()
    expect(view.queryByText('War Budget Calculator')).not.toBeInTheDocument()
    expect(container.querySelector('.topbar .wordmark-logo')).toHaveAttribute(
      'src',
      expect.stringContaining('assets/brand/bitcoin-knots.svg'),
    )
    expect(container.querySelector('.topbar .wordmark > span')).not.toBeInTheDocument()
  })

  it('keeps financial KPIs out of the hero and splits Kratter commitment from loss', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const hero = container.querySelector('.hero-story')
    const commitment = container.querySelector('.commitment-panel')
    const loss = container.querySelector('.loss-panel')

    expect(hero).not.toBeNull()
    expect(within(hero as HTMLElement).queryByText('Fight cost so far')).not.toBeInTheDocument()
    expect(container.querySelector('.hero-metrics')).not.toBeInTheDocument()
    expect(within(commitment as HTMLElement).getByText('≈ $8,000 COMMITTED')).toBeInTheDocument()
    expect(within(loss as HTMLElement).getByText('≈ $600 LOST')).toBeInTheDocument()
  })

  it('links Kratter’s evidence note to the satirical call-to-arms footage', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const commitment = within(container.querySelector('.commitment-panel') as HTMLElement)
    const footage = commitment.getByRole('link', {
      name: 'Archival footage: the General mobilizes the plebs',
    })

    expect(footage).toHaveAttribute(
      'href',
      'https://youtu.be/0qIIMD9ZMz8?si=iSm7UTsftIqBqmkf',
    )
    expect(footage).toHaveAttribute('target', '_blank')
    expect(footage).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders the full-height split hero with the new eager artwork and working Fabians briefing', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const hero = container.querySelector('.hero-story') as HTMLElement
    const view = within(hero)
    const image = view.getByRole('img', {
      name: 'Satirical illustration of General Kratter pointing a marching pleb army toward a Bitcoin mining battlefield.',
    })
    const directChildren = Array.from(hero.children)

    expect(image).toHaveAttribute('src', expect.stringContaining('general-kratter-hero-large.webp'))
    expect(image).toHaveAttribute('srcset', expect.stringContaining('general-kratter-hero-large-960.webp'))
    expect(image).toHaveAttribute('sizes', '(max-width: 760px) 100vw, 58vw')
    expect(image).toHaveAttribute('width', '1402')
    expect(image).toHaveAttribute('height', '1122')
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('fetchpriority', 'high')
    expect(view.getAllByRole('img')).toHaveLength(1)
    expect(hero.querySelector('img[src*="general-kratter-hero-v2.webp"]')).not.toBeInTheDocument()

    const fabians = view.getByRole('link', { name: 'Fabians' })
    expect(fabians).toHaveAttribute('href', '/fabians')
    expect(fabians).toHaveAttribute('aria-describedby', 'fabians-tooltip')
    expect(fabians).toHaveTextContent(/^Fabians$/)
    expect(view.queryByRole('link', { name: /Fight the Fabians/i })).not.toBeInTheDocument()

    fireEvent.mouseEnter(fabians.closest('.fabians-briefing') as HTMLElement)
    expect(view.getByRole('tooltip')).toHaveTextContent('Apparently, they are attacking Bitcoin extremely slowly.')
    fireEvent.mouseLeave(fabians.closest('.fabians-briefing') as HTMLElement)
    fireEvent.focus(fabians)
    expect(view.getByRole('tooltip')).toHaveTextContent('Meet the minister who discovered them')
    fireEvent.keyDown(fabians, { key: 'Escape' })
    expect(view.queryByRole('tooltip')).not.toBeInTheDocument()

    expect(view.getByRole('link', { name: 'Continue to the General’s commitment' })).toHaveAttribute('href', '#kratter')

    expect(directChildren[0]).toHaveClass('hero-story-copy')
    expect(directChildren[1]).toHaveClass('hero-story-visual')
    expect(directChildren[2]).toHaveClass('hero-story-footer')
  })

  it('resolves the shareable Fabians path directly', () => {
    expect(routeFromPathname('/fabians')).toBe('/fabians')
    expect(routeFromPathname('/fabians/')).toBe('/fabians')
  })

  it('renders the Dr. Pleb Kruse ministerial briefing and all evidence caveats', () => {
    const { container } = render(<FabiansPage data={appData()} />)
    const view = within(container)

    expect(view.getByRole('heading', { level: 1, name: 'WHO ARE THE FABIANS?' })).toBeInTheDocument()
    expect(view.getByText(/A ministerial briefing from Dr\. Pleb Kruse/i)).toBeInTheDocument()
    expect(view.getByText(/According to Dr\. Pleb Kruse and BIP-110 campaign lore/i)).toBeInTheDocument()
    expect(view.getByText('CAMPAIGN-LORE CLASSIFICATION')).toBeInTheDocument()
    expect(document.title).toBe('Who Are the Fabians? — BIP-110 War Chest')

    expect(view.getByRole('heading', { name: 'THE FABIANS WAIT' })).toBeInTheDocument()
    expect(view.getByRole('heading', { name: 'LANDAUER HAPPENS' })).toBeInTheDocument()
    expect(view.getByRole('heading', { name: 'BITCOIN BECOMES ETHEREUM' })).toBeInTheDocument()
    expect(view.getByText(/not an established Bitcoin attack classification/i)).toBeInTheDocument()

    const fieldGuide = within(view.getByRole('heading', { name: 'FABIAN FIELD GUIDE' }).closest('.field-guide') as HTMLElement)
    expect(fieldGuide.getByText('Fabians')).toBeInTheDocument()
    expect(fieldGuide.getByText('Extremely long')).toBeInTheDocument()
    expect(fieldGuide.getByText('Landauer')).toBeInTheDocument()
    expect(fieldGuide.getByText('Eventually™')).toBeInTheDocument()
    expect(fieldGuide.getByText('Ministerial briefing')).toBeInTheDocument()
    expect(fieldGuide.getByText('BIP-110 and improved mitochondrial output')).toBeInTheDocument()

    expect(view.getByText('ACTIVE')).toBeInTheDocument()
    expect(view.getByText('BOOSTED')).toBeInTheDocument()
    expect(view.getByText('NOT RECORDED')).toBeInTheDocument()
    expect(view.getByText(/does not prove that Dr\. Pleb Kruse committed nothing/i)).toBeInTheDocument()

    const receiptLink = view.getByRole('link', { name: /SUBMIT A RECEIPT/i })
    expect(receiptLink).toHaveAttribute('href', appData().dashboard.highValueRecruit.claimReceiptUrl)
    expect(view.getByRole('link', { name: /RETURN TO THE WAR CHEST/i })).toHaveAttribute('href', '/#top')
  })

  it('opens an editable, user-controlled minister sharing dialog without a predefined handle', async () => {
    const { container } = render(<FabiansPage data={appData()} />)
    const view = within(container)

    fireEvent.click(view.getByRole('button', { name: 'SUMMON THE MINISTER' }))

    const dialog = view.getByRole('dialog', { name: 'SUMMON THE MINISTER' })
    const dialogView = within(dialog)
    expect(dialogView.getByLabelText('Optional minister handle')).toHaveValue('')
    expect(dialogView.getByLabelText('Message')).toHaveValue(
      'Dr. Pleb Kruse, the Fabians have been spotted. Please report your BIP-110 hash-rate deployment and current mitochondrial readiness. http://localhost:3000/fabians',
    )
    expect(dialogView.getByRole('link', { name: /OPEN X/i })).toHaveAttribute(
      'href',
      expect.stringContaining('https://x.com/intent/post?text='),
    )
    expect(dialogView.getByText(/Nothing is posted automatically/i)).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(view.queryByRole('dialog', { name: 'SUMMON THE MINISTER' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(view.getByRole('button', { name: 'SUMMON THE MINISTER' })).toHaveFocus()
    })
  })

  it('shows a useful editorial fallback when the ministerial portrait is missing', () => {
    const { container } = render(<FabiansPage data={appData()} />)
    const view = within(container)
    const image = view.getByRole('img', { name: /Dr\. Pleb Kruse wearing red mitochondrial combat goggles/i })

    fireEvent.error(image)

    expect(view.getByRole('img', {
      name: /Dr\. Pleb Kruse wearing red mitochondrial combat goggles.*Image unavailable/i,
    })).toBeInTheDocument()
    expect(view.getByText('DR. PLEB KRUSE // MINISTERIAL PORTRAIT PENDING')).toBeInTheDocument()
  })

  it('preserves the hero copy and transition when its image is unavailable', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const hero = container.querySelector('.hero-story') as HTMLElement
    const view = within(hero)

    fireEvent.error(view.getByRole('img', { name: /General Kratter pointing a marching pleb army/i }))

    expect(view.getByRole('heading', { name: 'GENERAL KRATTER CALLED THE PLEBS TO WAR' })).toBeInTheDocument()
    expect(view.getByRole('img', { name: 'General Kratter battlefield illustration unavailable' })).toBeInTheDocument()
    expect(view.getByText('GENERAL KRATTER’S ORDERS REMAIN ON FILE')).toBeInTheDocument()
    expect(view.getByRole('link', { name: 'Continue to the General’s commitment' })).toBeInTheDocument()
  })

  it('renders the data-driven Kratter loss and Plebslop panels with the supplied illustrations', () => {
    const data = appData()
    data.dashboard.simpleView.kratterMaximumLossUsd = 643.21
    data.dashboard.satire.annualPriceUsd = 925.5
    const { container } = render(<SimpleLanding data={data} />)
    const lossElement = container.querySelector('.loss-panel') as HTMLElement
    const plebslopElement = container.querySelector('.plebslop-panel') as HTMLElement
    const loss = within(lossElement)
    const plebslop = within(plebslopElement)

    expect(lossElement).toHaveAttribute('id', 'kratter-loss')
    expect(plebslopElement).toHaveAttribute('id', 'plebslop')
    expect(loss.getByRole('img', { name: /General Kratter displaying a roughly \$600 battlefield-loss receipt/i }))
      .toHaveAttribute('src', expect.stringContaining('general-returned-from-battle.webp'))
    expect(loss.getByText('≈ $600 LOST')).toBeInTheDocument()
    expect(loss.queryByText(/\$600\.00/)).not.toBeInTheDocument()
    expect(loss.getByText(/The reserve vault is satirical/i)).toBeInTheDocument()

    expect(plebslop.getByRole('img', { name: /Plebslop University admissions scene/i }))
      .toHaveAttribute('src', expect.stringContaining('plebslop-university.webp'))
    expect(plebslop.getByText('≈ $600')).toBeInTheDocument()
    expect(plebslop.getByText('$926')).toBeInTheDocument()
    expect(plebslop.queryByText(/\$925\.50/)).not.toBeInTheDocument()
    expect(plebslop.getByRole('link', { name: /Rent hash rate/i })).toHaveAttribute(
      'href',
      data.dashboard.satire.rentHashRateUrl,
    )

    expect(container.querySelector('.loss-art')).not.toBeInTheDocument()
    expect(container.querySelector('.loss-scale')).not.toBeInTheDocument()
    expect(container.querySelector('img[src*="kratter-scale.webp"]')).not.toBeInTheDocument()
  })

  it('renders the simple F2Pool mission metrics', () => {
    const data = appData()
    const simple = data.dashboard.simpleView
    const { container } = render(<SimpleLanding data={data} />)
    const mission = container.querySelector('.mission-panel')
    const view = within(mission as HTMLElement)

    expect(view.getByText('MATCH F2POOL')).toBeInTheDocument()
    expect(view.getByText(formatSimpleEh(simple.bip110SevenDayEhS))).toBeInTheDocument()
    expect(view.getByText(formatSimpleEh(simple.f2poolSevenDayEhS))).toBeInTheDocument()
    expect(view.getByText(formatSimpleEh(simple.reinforcementsNeededEhS, ' still needed'))).toBeInTheDocument()
    expect(view.getByText(`≈ ${formatSimpleUsd(simple.matchF2PoolCostPerDayUsd)} / day`)).toBeInTheDocument()
  })

  it('updates the mandatory block countdown every second', () => {
    const data = appData()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(data.dashboard.generatedAt))
    const initialParts = splitCountdown(data.dashboard.simpleView.secondsUntilMandatory)
    const nextParts = splitCountdown((data.dashboard.simpleView.secondsUntilMandatory ?? 0) - 1)
    const { container } = render(<SimpleLanding data={data} />)
    const risk = within(container.querySelector('.risk-panel') as HTMLElement)

    expect(risk.getByRole('timer')).toHaveAccessibleName(
      `${formatCountdownLabel(initialParts!)} until mandatory signaling`,
    )
    act(() => vi.advanceTimersByTime(1_000))
    expect(risk.getByRole('timer')).toHaveAccessibleName(
      `${formatCountdownLabel(nextParts!)} until mandatory signaling`,
    )
  })

  it('keeps Fred to three commitments and updates the one major duration result', () => {
    const data = appData()
    const expectedDuration = formatHumanDuration(
      fredMatchDurationSeconds(5_000_000, data.dashboard.simpleView.matchF2PoolCostPerDayUsd),
    ).toUpperCase()
    const { container } = render(<SimpleLanding data={data} />)
    const fred = container.querySelector('.fred-panel')
    const view = within(fred as HTMLElement)

    const fredImage = view.getByRole('img', {
      name: /Fred Krueger in the Speech Corps speaking into a microphone/i,
    })
    expect(fredImage).toHaveAttribute('src', expect.stringContaining('fred-speech-corps.webp'))
    expect(fredImage).toHaveAttribute('width', '1448')
    expect(fredImage).toHaveAttribute('height', '1086')
    expect(fredImage).toHaveAttribute('loading', 'lazy')
    expect(view.getAllByRole('img')).toHaveLength(1)
    expect(container.querySelector('img[src*="fred-krueger-recruit-v3.webp"]')).not.toBeInTheDocument()
    expect(view.getByText('$500M+')).toBeInTheDocument()
    expect(view.getByText('Not a measure of personal liquid wealth.')).toBeInTheDocument()
    expect(view.getByText('NOT RECORDED')).toBeInTheDocument()
    expect(view.getByText(/This does not prove zero commitment/i)).toBeInTheDocument()
    expect(container.querySelectorAll('.fred-picker button')).toHaveLength(3)
    expect(view.getByRole('button', { name: '$50K' })).toBeInTheDocument()
    const fiveMillion = view.getByRole('button', { name: '$5M' })
    fireEvent.click(fiveMillion)
    expect(fiveMillion).toHaveAttribute('aria-pressed', 'true')
    expect(view.getByText(expectedDuration)).toBeInTheDocument()
    expect(view.getByRole('link', { name: /Fred, claim your receipt/i })).toHaveAttribute(
      'href',
      data.dashboard.highValueRecruit.claimReceiptUrl,
    )
    expect(view.getByText('Public evidence will be added whether it helps or hurts the satire.')).toBeInTheDocument()
    const whyFred = fred?.querySelector('.why-fred') as HTMLDetailsElement
    fireEvent.click(within(whyFred).getByText('WHY FRED?'))
    expect(whyFred).toHaveAttribute('open')
    expect(view.getByText('Former Ordinals enjoyer:')).toBeInTheDocument()
    expect(view.getByText(/Speech Corps, Hash Cavalry and SHA-256 converter are satirical/i)).toBeInTheDocument()
  })

  it('keeps Fred controls working when the illustration is unavailable', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const fred = container.querySelector('.fred-panel') as HTMLElement
    const view = within(fred)
    const image = view.getByRole('img', {
      name: /Fred Krueger in the Speech Corps speaking into a microphone/i,
    })

    fireEvent.error(image)

    expect(view.getByText('FRED SPEECH CORPS ILLUSTRATION UNAVAILABLE')).toBeInTheDocument()
    expect(view.getAllByRole('button', { name: /\$(50K|500K|5M)/ })).toHaveLength(3)
    expect(view.getByRole('link', { name: /Fred, claim your receipt/i })).toBeInTheDocument()
  })

  it('opens Fred’s receipt lightbox, closes it with Escape and restores focus', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const fred = within(container.querySelector('.fred-panel') as HTMLElement)
    const trigger = fred.getByRole('button', {
      name: /Open full-size illustration: Satirical illustration of Fred Krueger/i,
    })

    fireEvent.click(trigger)
    expect(fred.getByRole('dialog', { name: /Full-size illustration/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(fred.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('renders exactly three Pleb Plan paths with dynamic copy and configured destinations', () => {
    const data = appData()
    const { container } = render(<SimpleLanding data={data} />)
    const plebPlan = within(container)
      .getByRole('heading', { name: 'PLEB, CHOOSE YOUR ADVENTURE' })
      .closest('section')
    const view = within(plebPlan as HTMLElement)

    expect(plebPlan).toBeInTheDocument()
    expect(plebPlan).toHaveAttribute('id', 'pleb-plan')
    expect(plebPlan).toHaveClass('pleb-plan-panel')
    expect(plebPlan?.querySelectorAll('.pleb-paths > article')).toHaveLength(3)
    expect(plebPlan?.querySelector('.pleb-paths')).toBeInTheDocument()
    expect(view.getByText(mandatoryReadingWindowCopy(estimateLiveMandatorySeconds(
      data.dashboard.simpleView.secondsUntilMandatory,
      data.dashboard.generatedAt,
    )))).toBeInTheDocument()
    expect(view.getByText('RECOMMENDED')).toBeInTheDocument()
    expect(view.getByRole('link', { name: /Read Principles of Economics by Saifedean Ammous/i })).toHaveAttribute(
      'href',
      'https://saifedean.com/poe',
    )
    expect(view.getByRole('link', { name: /Rent hash rate/i })).toHaveAttribute(
      'href',
      data.dashboard.simpleView.rentHashRateUrl,
    )
    expect(view.getByRole('link', { name: /Submit a public hash-rate receipt/i })).toHaveAttribute(
      'href',
      data.dashboard.highValueRecruit.claimReceiptUrl,
    )
    expect(view.getByRole('button', { name: /Recruit a general by sharing this page/i })).toBeInTheDocument()
    expect(view.getByText(formatSimpleEh(data.dashboard.simpleView.reinforcementsNeededEhS))).toBeInTheDocument()
    const economistImage = view.getByRole('img', {
      name: /ordinary Bitcoin pleb reading Principles of Economics/i,
    })
    expect(economistImage).toHaveAttribute('src', expect.stringContaining('pleb-economist.webp'))
    expect(economistImage).toHaveAttribute('loading', 'lazy')
    expect(economistImage).toHaveAttribute('width', '1122')
    expect(economistImage).toHaveAttribute('height', '1402')
    expect(view.getByRole('img', { name: /same pleb pushing a rented-hash machine/i }))
      .toHaveAttribute('src', expect.stringContaining('pleb-hasher.webp'))
    expect(view.getByRole('img', { name: /same pleb using a megaphone/i }))
      .toHaveAttribute('src', expect.stringContaining('pleb-recruiter.webp'))
    expect(view.getAllByRole('img')).toHaveLength(3)
    expect(plebPlan?.querySelector('.pleb-path-icon')).not.toBeInTheDocument()
  })

  it('opens a lightweight illustration dialog and closes it with Escape', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const plebPlan = within(container)
      .getByRole('heading', { name: 'PLEB, CHOOSE YOUR ADVENTURE' })
      .closest('section')
    const view = within(plebPlan as HTMLElement)

    fireEvent.click(view.getByRole('button', { name: /Open full-size illustration: Satirical illustration of an ordinary Bitcoin pleb/i }))
    expect(view.getByRole('dialog', { name: /Full-size illustration/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(view.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an editorial fallback without breaking the card when an illustration fails', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const plebPlan = within(container)
      .getByRole('heading', { name: 'PLEB, CHOOSE YOUR ADVENTURE' })
      .closest('section')
    const view = within(plebPlan as HTMLElement)
    const economistImage = view.getByRole('img', {
      name: /ordinary Bitcoin pleb reading Principles of Economics/i,
    })

    fireEvent.error(economistImage)

    expect(view.getByRole('img', { name: /Image unavailable/i })).toBeInTheDocument()
    expect(view.getByRole('heading', { name: '1. LEARN THE ECONOMICS FIRST' })).toBeInTheDocument()
    expect(view.getByRole('link', { name: /Read Principles of Economics/i })).toBeInTheDocument()
  })

  it('uses the post-mandatory reading fallback', () => {
    const data = appData()
    data.dashboard.simpleView.secondsUntilMandatory = 0
    const { container } = render(<SimpleLanding data={data} />)
    const plebPlan = within(container)
      .getByRole('heading', { name: 'PLEB, CHOOSE YOUR ADVENTURE' })
      .closest('section')

    expect(within(plebPlan as HTMLElement).getByText(
      'The recommended reading window has closed. The book remains cheaper than the lesson.',
    )).toBeInTheDocument()
  })

  it('shares the dynamic recruitment order through the Web Share API', async () => {
    const data = appData()
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    const { container } = render(<SimpleLanding data={data} />)
    const plebPlan = within(container)
      .getByRole('heading', { name: 'PLEB, CHOOSE YOUR ADVENTURE' })
      .closest('section')
    const view = within(plebPlan as HTMLElement)
    const currentPageUrl = `${window.location.origin}${window.location.pathname}`

    fireEvent.click(view.getByRole('button', { name: /Recruit a general by sharing this page/i }))

    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'BIP-110 War Chest',
      text: buildPlebShareText({
        reinforcementsNeededEhS: data.dashboard.simpleView.reinforcementsNeededEhS,
        reinforcementBillPerDayUsd: data.dashboard.simpleView.matchF2PoolCostPerDayUsd,
        currentPageUrl,
      }),
    }))
    expect(view.getByRole('status')).toHaveTextContent('Recruitment order shared')
  })

  it('copies the recruitment order when Web Share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const { container } = render(<SimpleLanding data={appData()} />)
    const plebPlan = within(container)
      .getByRole('heading', { name: 'PLEB, CHOOSE YOUR ADVENTURE' })
      .closest('section')
    const view = within(plebPlan as HTMLElement)

    fireEvent.click(view.getByRole('button', { name: /Recruit a general by sharing this page/i }))

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    expect(view.getByRole('status')).toHaveTextContent('Recruitment order copied')
  })

  it('puts the three KPIs in the after-action summary and keeps advanced routes linked', () => {
    const data = appData()
    const simple = data.dashboard.simpleView
    const { container } = render(<SimpleLanding data={data} />)
    const summary = container.querySelector('.summary-panel')
    const methodology = container.querySelector('.methodology-panel')

    expect(summary?.querySelectorAll('.summary-numbers article')).toHaveLength(3)
    expect(within(summary as HTMLElement).getByText(`≈ ${formatSimpleUsd(simple.fightCostSoFarUsd)}`)).toBeInTheDocument()
    expect(within(summary as HTMLElement).getByText(`≈ ${formatSimpleUsd(simple.currentArmyCostPerDayUsd)} / day`)).toBeInTheDocument()
    expect(within(summary as HTMLElement).getByText(`≈ ${formatSimpleUsd(simple.matchF2PoolCostPerDayUsd)} / day`)).toBeInTheDocument()
    expect(within(methodology as HTMLElement).getByRole('link', { name: 'FULL METHODOLOGY' })).toHaveAttribute('href', '?view=methodology')
    expect(within(methodology as HTMLElement).getByRole('link', { name: 'BLOCK LEDGER' })).toHaveAttribute('href', '?view=ledger')
    expect(within(methodology as HTMLElement).getByRole('link', { name: 'RAW DATA' })).toHaveAttribute('href', expect.stringContaining('data/dashboard.json'))
  })

  it('uses light editorial panel hooks and honest unavailable states', () => {
    const data = appData()
    data.dashboard.simpleView.fightCostSoFarUsd = null
    data.dashboard.simpleView.currentArmyCostPerDayUsd = null
    data.dashboard.simpleView.matchF2PoolCostPerDayUsd = null
    const { container } = render(<SimpleLanding data={data} />)

    expect(container.querySelector('.hero-story')).toBeInTheDocument()
    expect(container.querySelector('.cheap-panel')).toBeInTheDocument()
    expect(container.querySelector('.risk-panel')).toBeInTheDocument()
    expect(container.querySelector('.summary-panel')).toBeInTheDocument()
    expect(container.textContent).toContain('≈ Unavailable / DAY')
    expect(container.textContent).toContain('≈ Unavailable / day')
  })

  it('uses the supplied full illustrations for partial cashback and mandatory signaling', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const cheap = within(container.querySelector('.cheap-panel') as HTMLElement)
    const risk = within(container.querySelector('.risk-panel') as HTMLElement)

    expect(cheap.getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('partial-cashback-v1.webp'),
    )
    expect(risk.getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('mandatory-signaling-v1.webp'),
    )
    expect(container.querySelector('.cashback-machine')).not.toBeInTheDocument()
    expect(container.querySelector('.risk-clock')).not.toBeInTheDocument()
  })

  it('keeps the closing copy outside the full-width artwork', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const closing = container.querySelector('.closing-story')

    expect(closing?.firstElementChild).toHaveClass('closing-copy')
    expect(closing?.lastElementChild?.tagName).toBe('IMG')
    expect(within(closing as HTMLElement).getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('closing-empty-bags-v1.webp'),
    )
  })
})
