// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import dashboardRaw from '../../public/data/dashboard.json'
import { dashboardSchema } from '../lib/schemas'
import { HighValueRecruit } from './HighValueRecruit'

const dashboard = dashboardSchema.parse(dashboardRaw)

function renderRecruit() {
  return render(
    <HighValueRecruit
      recruit={dashboard.highValueRecruit}
      boss={dashboard.bossBattle}
      clock={dashboard.battleClock}
      bitcoinUsd={dashboard.currentPrice.usd}
      psuAnnualUsd={dashboard.satire.annualPriceUsd}
    />,
  )
}

afterEach(cleanup)

describe('high-value recruit dossier', () => {
  it('renders the disciplined no-receipt wording, timeline and CTA', () => {
    renderRecruit()
    expect(screen.getByText('No publicly verifiable hash-rate receipt recorded')).toBeTruthy()
    expect(screen.getByText('This is not proof of zero commitment.')).toBeTruthy()
    expect(screen.getByText('ACHIEVEMENT NOT YET RECORDED')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Submit public receipt' })).toBeTruthy()
    expect(screen.getByText('Primary-source links still being pinned.')).toBeTruthy()
  })

  it('updates commitment outputs and preserves PSU conversion', () => {
    renderRecruit()
    fireEvent.click(screen.getByRole('button', { name: '$500,000' }))
    expect(screen.getByText('$500,000', { selector: '.commitment-ticket > strong' })).toBeTruthy()
    expect(screen.getByText(/632.9 PSU/)).toBeTruthy()
    expect(screen.getAllByText('MARKET DEPTH NOT VERIFIED').length).toBeGreaterThan(0)
  })

  it('shows the missing-artwork fallback without disabling the dossier', () => {
    renderRecruit()
    fireEvent.error(screen.getByAltText('Editorial caricature of Fred Krueger holding a microphone and a blank hash-rate requisition form.'))
    expect(screen.getByText('Fred caricature pending')).toBeTruthy()
    expect(screen.getByText('Convert Rhetoric to Hash Rate')).toBeTruthy()
  })
})
