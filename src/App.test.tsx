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
import {
  buildPlebShareText,
  estimateLiveMandatorySeconds,
  formatCountdownLabel,
  formatHumanDuration,
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
  it('renders the eleven-panel story without the old dashboard controls', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const view = within(container)

    expect(container.querySelectorAll('main > section')).toHaveLength(11)
    expect(view.getByText('GENERAL KRATTER CALLED THE PLEBS TO WAR')).toBeInTheDocument()
    expect(view.getByText('THE GENERAL WENT FIRST')).toBeInTheDocument()
    expect(view.getByText('FOR NOW, THIS IS STILL THE CHEAP PART')).toBeInTheDocument()
    expect(view.getByText('THE COSPLAY ENDS IN')).toBeInTheDocument()
    expect(view.getByText('FRED, WE FOUND YOUR SIDE QUEST')).toBeInTheDocument()
    expect(view.getByText('PLEB, CHOOSE YOUR ADVENTURE')).toBeInTheDocument()
    expect(view.getByText('AFTER-ACTION SUMMARY')).toBeInTheDocument()
    expect(view.queryByText('Display currency')).not.toBeInTheDocument()
    expect(view.queryByText('War Budget Calculator')).not.toBeInTheDocument()
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

  it('renders the simple F2Pool mission metrics', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const mission = container.querySelector('.mission-panel')
    const view = within(mission as HTMLElement)

    expect(view.getByText('MATCH F2POOL')).toBeInTheDocument()
    expect(view.getByText('19 EH/s')).toBeInTheDocument()
    expect(view.getByText('142 EH/s')).toBeInTheDocument()
    expect(view.getByText('123 EH/s still needed')).toBeInTheDocument()
    expect(view.getByText('≈ $4.1M / day')).toBeInTheDocument()
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

    expect(container.querySelectorAll('.fred-picker button')).toHaveLength(3)
    expect(view.getByRole('button', { name: '$50K' })).toBeInTheDocument()
    const fiveMillion = view.getByRole('button', { name: '$5M' })
    fireEvent.click(fiveMillion)
    expect(fiveMillion).toHaveAttribute('aria-pressed', 'true')
    expect(view.getByText(expectedDuration)).toBeInTheDocument()
    expect(view.getByText('Former Ordinals enjoyer:')).toBeInTheDocument()
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
    expect(plebPlan?.querySelectorAll('.pleb-paths > article')).toHaveLength(3)
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
    const { container } = render(<SimpleLanding data={appData()} />)
    const summary = container.querySelector('.summary-panel')
    const methodology = container.querySelector('.methodology-panel')

    expect(summary?.querySelectorAll('.summary-numbers article')).toHaveLength(3)
    expect(within(summary as HTMLElement).getByText('≈ $21.5M')).toBeInTheDocument()
    expect(within(summary as HTMLElement).getByText('≈ $620K / day')).toBeInTheDocument()
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
