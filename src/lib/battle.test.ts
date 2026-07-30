import { describe, expect, it } from 'vitest'
import {
  durationDays,
  formatBattleDuration,
  fredCommitmentScenario,
  heroEstimateMode,
  reinforcementCosts,
} from './battle'

describe('battle calculations', () => {
  it('converts presets to days from the live clock', () => {
    expect(durationDays('1h', 0, 2016, 600, 0)).toBeCloseTo(1 / 24)
    expect(durationDays('untilMandatory', 172_800, 2016, 600, 0)).toBe(2)
    expect(durationDays('mandatoryPeriod', 0, 2016, 600, 0)).toBe(14)
    expect(durationDays('custom', 0, 2016, 600, 36)).toBe(1.5)
  })

  it('keeps Fred commitment math theoretical and gap-relative', () => {
    const scenario = fredCommitmentScenario({
      commitmentUsd: 500_000,
      bitcoinUsd: 100_000,
      psuAnnualUsd: 1_000,
      hashpriceBtcPerPhDay: 0.0005,
      marketBtcPerEhDay: 0.5,
      reinforcementGapEhS: 100,
      untilMandatoryDays: 10,
    })
    expect(scenario.btc).toBe(5)
    expect(scenario.psu).toBe(500)
    expect(scenario.floorEhDays).toBe(10)
    expect(scenario.marketEhDays).toBe(10)
    expect(scenario.oneDayEhS).toBe(10)
    expect(scenario.sevenDayEhS).toBeCloseTo(10 / 7)
    expect(scenario.oneDayGapClosurePct).toBe(10)
    expect(scenario.untilMandatoryGapClosurePct).toBe(1)
    expect(scenario.expectedMiningRevenueFloorBtc).toBe(5)
    expect(scenario.kratterLossUsd).toBe(40_000)
    expect(scenario.campaignEnduranceDays).toBe(0.1)
  })

  it('keeps the theoretical floor separate from the spot quote', () => {
    const costs = reinforcementCosts(2, 1, 0.00005, 0.5)
    expect(costs.floorBtc).toBeCloseTo(0.1)
    expect(costs.kratterBtc).toBeCloseTo(0.10869565)
    expect(costs.marketBtc).toBeCloseTo(1)
  })

  it('selects the scenario hero only when market coverage is unavailable', () => {
    expect(heroEstimateMode(true)).toBe('market')
    expect(heroEstimateMode(false)).toBe('scenario')
    expect(formatBattleDuration(176_400)).toBe('≈ 2d 1h')
  })
})
