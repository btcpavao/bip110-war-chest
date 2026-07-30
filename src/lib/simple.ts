const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatSimpleUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Unavailable'
  const absolute = Math.abs(value)
  if (absolute < 100_000) {
    return USD.format(Math.round(value / 100) * 100)
  }
  if (absolute < 1_000_000) {
    return `$${Math.round(value / 10_000) * 10}K`
  }
  return `$${(value / 1_000_000).toFixed(1)}M`
}

export function formatSimpleEh(value: number | null, suffix = ''): string {
  if (value === null || !Number.isFinite(value)) return 'Unavailable'
  const rounded = Math.abs(value - Math.round(value)) < 0.05
    ? Math.round(value).toString()
    : value.toFixed(1)
  return `${rounded} EH/s${suffix}`
}

export function formatCommitmentUsd(value: number): string {
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`
  return `$${Math.round(value / 1_000)}K`
}

export function formatHumanDuration(totalSeconds: number | null): string {
  if (totalSeconds === null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return 'Unavailable'
  }
  if (totalSeconds < 3_600) {
    const minutes = Math.max(1, Math.round(totalSeconds / 60))
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  }
  if (totalSeconds < 2 * 86_400) {
    const hours = Math.max(1, Math.round(totalSeconds / 3_600))
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  const days = Math.max(1, Math.round(totalSeconds / 86_400))
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

export function fredMatchDurationSeconds(
  commitmentUsd: number,
  reinforcementCostPerDayUsd: number | null,
): number | null {
  if (
    !Number.isFinite(commitmentUsd)
    || commitmentUsd < 0
    || reinforcementCostPerDayUsd === null
    || !Number.isFinite(reinforcementCostPerDayUsd)
    || reinforcementCostPerDayUsd <= 0
  ) {
    return null
  }
  return commitmentUsd / reinforcementCostPerDayUsd * 86_400
}
