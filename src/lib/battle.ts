export type DurationPreset =
  | '1h'
  | '24h'
  | '7d'
  | 'untilMandatory'
  | 'mandatoryPeriod'
  | 'custom'

export function durationDays(
  preset: DurationPreset,
  estimatedSecondsRemaining: number,
  mandatoryPeriodBlocks: number,
  blockIntervalSeconds: number,
  customHours: number,
): number {
  if (preset === '1h') return 1 / 24
  if (preset === '24h') return 1
  if (preset === '7d') return 7
  if (preset === 'untilMandatory') return estimatedSecondsRemaining / 86_400
  if (preset === 'mandatoryPeriod') {
    return mandatoryPeriodBlocks * blockIntervalSeconds / 86_400
  }
  return Math.max(customHours, 0) / 24
}

export function reinforcementCosts(
  gapEhS: number,
  days: number,
  hashpriceBtcPerPhDay: number | null,
  marketBtcPerEhDay: number | null,
  lossRate = 0.08,
) {
  const floorBtc = hashpriceBtcPerPhDay === null
    ? null
    : gapEhS * 1_000 * days * hashpriceBtcPerPhDay
  return {
    floorBtc,
    kratterBtc: floorBtc === null ? null : floorBtc / (1 - lossRate),
    marketBtc: marketBtcPerEhDay === null ? null : gapEhS * days * marketBtcPerEhDay,
  }
}

export function formatBattleDuration(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  return days > 0 ? `≈ ${days}d ${hours}h` : `≈ ${hours}h`
}

export function heroEstimateMode(marketAvailable: boolean): 'market' | 'scenario' {
  return marketAvailable ? 'market' : 'scenario'
}
