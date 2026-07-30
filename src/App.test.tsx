// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import dashboardRaw from '../public/data/dashboard.json'
import receiptsRaw from '../public/data/influencer-receipts.json'
import blocksRaw from '../public/data/signaling-blocks.json'
import spamTaxRaw from '../public/data/spam-rug-tax.json'
import { SimpleLanding } from './App'
import type { AppData } from './lib/loadData'
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

describe('simplified landing page', () => {
  it('renders the six-section story without the old currency selector', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const view = within(container)

    expect(container.querySelectorAll('main > section')).toHaveLength(6)
    expect(view.getByText('THE GENERAL WENT FIRST')).toBeInTheDocument()
    expect(view.getByText('THE REAL BATTLE')).toBeInTheDocument()
    expect(view.getByText('FRED, WE NEED REINFORCEMENTS')).toBeInTheDocument()
    expect(view.queryByText('Display currency')).not.toBeInTheDocument()
    expect(view.queryByText('War Budget Calculator')).not.toBeInTheDocument()
  })

  it('renders exactly three hero metrics and three Fred commitments', () => {
    const { container } = render(<SimpleLanding data={appData()} />)
    const view = within(container)

    expect(container.querySelectorAll('.hero-metrics .landing-metric')).toHaveLength(3)
    expect(container.querySelectorAll('.fred-picker button')).toHaveLength(3)
    expect(view.getByRole('button', { name: '$50K' })).toBeInTheDocument()
    expect(view.getByRole('button', { name: '$5M' })).toBeInTheDocument()
  })

  it('uses responsive layout hooks without fixed page width', () => {
    const { container } = render(<SimpleLanding data={appData()} />)

    expect(container.querySelector('.site-shell')).toBeInTheDocument()
    expect(container.querySelector('.boss-stage')).toBeInTheDocument()
    expect(container.querySelector('.fred-layout')).toBeInTheDocument()
  })

  it('shows honest hero fallbacks when current-price values are unavailable', () => {
    const data = appData()
    data.dashboard.simpleView.fightCostSoFarUsd = null
    data.dashboard.simpleView.currentArmyCostPerDayUsd = null
    data.dashboard.simpleView.matchF2PoolCostPerDayUsd = null
    const { container } = render(<SimpleLanding data={data} />)

    const values = [...container.querySelectorAll('.hero-metrics strong')]
      .map((node) => node.textContent)
    expect(values).toEqual(['Unavailable', 'Unavailable / day', 'Unavailable / day'])
  })
})
