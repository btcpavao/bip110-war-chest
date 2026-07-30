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
  return `${Math.round(value)} EH/s${suffix}`
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

export type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function estimateLiveMandatorySeconds(
  estimatedSeconds: number | null,
  generatedAt: string,
  nowMs = Date.now(),
): number | null {
  if (estimatedSeconds === null || !Number.isFinite(estimatedSeconds)) return null
  const generatedAtMs = Date.parse(generatedAt)
  if (!Number.isFinite(generatedAtMs)) return Math.max(0, Math.floor(estimatedSeconds))
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - generatedAtMs) / 1_000))
  return Math.max(0, Math.floor(estimatedSeconds) - elapsedSeconds)
}

export function splitCountdown(totalSeconds: number | null): CountdownParts | null {
  if (totalSeconds === null || !Number.isFinite(totalSeconds)) return null
  let remaining = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(remaining / 86_400)
  remaining %= 86_400
  const hours = Math.floor(remaining / 3_600)
  remaining %= 3_600
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return { days, hours, minutes, seconds }
}

export function formatCountdownLabel(parts: CountdownParts): string {
  const unit = (value: number, singular: string, plural: string) => (
    `${value} ${value === 1 ? singular : plural}`
  )
  return [
    unit(parts.days, 'day', 'days'),
    unit(parts.hours, 'hour', 'hours'),
    unit(parts.minutes, 'minute', 'minutes'),
    unit(parts.seconds, 'second', 'seconds'),
  ].join(', ')
}

export function mandatoryReadingWindowCopy(totalSeconds: number | null): string {
  if (totalSeconds === null || !Number.isFinite(totalSeconds)) {
    return 'The battle countdown is unavailable. The book remains cheaper than the lesson.'
  }
  if (totalSeconds <= 0) {
    return 'The recommended reading window has closed. The book remains cheaper than the lesson.'
  }
  return `You have approximately ${formatHumanDuration(totalSeconds)} before mandatory signaling begins.`
}

export function buildPlebShareText({
  reinforcementsNeededEhS,
  reinforcementBillPerDayUsd,
  currentPageUrl,
}: {
  reinforcementsNeededEhS: number | null
  reinforcementBillPerDayUsd: number | null
  currentPageUrl: string
}): string {
  return `BIP-110 still needs ${formatSimpleEh(reinforcementsNeededEhS)} to match F2Pool, at a theoretical cost of about ${formatSimpleUsd(reinforcementBillPerDayUsd)} per day. How much are you personally committing? ${currentPageUrl}`
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
