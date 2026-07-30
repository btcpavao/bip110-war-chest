export type Currency = 'BTC' | 'USD' | 'PSU'

const SATS_PER_BTC = 100_000_000

export function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`
}

export function formatSatsAsBtc(sats: number): string {
  return `${(sats / SATS_PER_BTC).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })} BTC`
}

export function formatMoney(
  sats: number | null,
  currency: Currency,
  price: { usd: number | null },
  psuAnnualUsd: number,
): string {
  if (sats === null) return 'Unavailable'
  const btc = sats / SATS_PER_BTC
  if (currency === 'BTC') return formatSatsAsBtc(sats)
  if (currency === 'USD') {
    return price.usd === null
      ? 'Unavailable'
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(btc * price.usd)
  }
  if (price.usd === null) return 'Unavailable'
  return `${(btc * price.usd / psuAnnualUsd).toLocaleString('en-US', {
    maximumFractionDigits: 1,
  })} PSU`
}
