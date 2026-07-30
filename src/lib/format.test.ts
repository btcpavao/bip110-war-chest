import { describe, expect, it } from 'vitest'
import { formatMoney, formatPercent, formatSatsAsBtc } from './format'

describe('financial formatting', () => {
  const price = { usd: 100_000 }

  it('preserves BTC as the native primary unit', () => {
    expect(formatSatsAsBtc(100_000_000)).toBe('1.00 BTC')
    expect(formatMoney(100_000_000, 'BTC', price, 790)).toBe('1.00 BTC')
  })

  it('labels missing fiat coverage as unavailable', () => {
    expect(formatMoney(100_000_000, 'USD', { usd: null }, 790)).toBe('Unavailable')
  })

  it('converts the configured PSU comparison through USD', () => {
    expect(formatMoney(79_000_000, 'PSU', { usd: 1_000 }, 790)).toBe('1 PSU')
  })

  it('formats percentages without changing the value', () => {
    expect(formatPercent(2.045)).toBe('2.04%')
  })
})
