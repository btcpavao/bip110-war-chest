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

export function fredCommitmentScenario({
  commitmentUsd,
  bitcoinUsd,
  psuAnnualUsd,
  hashpriceBtcPerPhDay,
  marketBtcPerEhDay,
  reinforcementGapEhS,
  untilMandatoryDays,
  lossRate = 0.08,
}: {
  commitmentUsd: number
  bitcoinUsd: number | null
  psuAnnualUsd: number
  hashpriceBtcPerPhDay: number | null
  marketBtcPerEhDay: number | null
  reinforcementGapEhS: number | null
  untilMandatoryDays: number
  lossRate?: number
}) {
  const safeUsd = Math.max(commitmentUsd, 0)
  const btc = bitcoinUsd && bitcoinUsd > 0 ? safeUsd / bitcoinUsd : null
  const floorEhDays = btc !== null && hashpriceBtcPerPhDay && hashpriceBtcPerPhDay > 0
    ? btc / (hashpriceBtcPerPhDay * 1_000)
    : null
  const marketEhDays = btc !== null && marketBtcPerEhDay && marketBtcPerEhDay > 0
    ? btc / marketBtcPerEhDay
    : null
  const hashForDays = (days: number) =>
    marketEhDays === null || days <= 0 ? null : marketEhDays / days
  const gapClosure = (ehS: number | null) =>
    ehS === null || reinforcementGapEhS === null || reinforcementGapEhS <= 0
      ? null
      : Math.min(ehS / reinforcementGapEhS * 100, 100)
  const oneDayEhS = hashForDays(1)
  const sevenDayEhS = hashForDays(7)
  const untilMandatoryEhS = hashForDays(untilMandatoryDays)
  return {
    commitmentUsd: safeUsd,
    btc,
    psu: psuAnnualUsd > 0 ? safeUsd / psuAnnualUsd : null,
    floorEhDays,
    marketEhDays,
    oneDayEhS,
    sevenDayEhS,
    untilMandatoryEhS,
    oneDayGapClosurePct: gapClosure(oneDayEhS),
    sevenDayGapClosurePct: gapClosure(sevenDayEhS),
    untilMandatoryGapClosurePct: gapClosure(untilMandatoryEhS),
    expectedMiningRevenueFloorBtc:
      marketEhDays !== null && hashpriceBtcPerPhDay !== null
        ? marketEhDays * hashpriceBtcPerPhDay * 1_000
        : null,
    kratterLossUsd: safeUsd * lossRate,
    campaignEnduranceDays:
      marketEhDays !== null && reinforcementGapEhS && reinforcementGapEhS > 0
        ? marketEhDays / reinforcementGapEhS
        : null,
  }
}
