import { describe, expect, it } from 'vitest'
import {
  buildPlebShareText,
  estimateLiveMandatorySeconds,
  formatCountdownLabel,
  formatHumanDuration,
  formatCommitmentUsd,
  formatSimpleEh,
  formatSimpleUsd,
  fredMatchDurationSeconds,
  mandatoryReadingWindowCopy,
  splitCountdown,
} from './simple'

describe('simple landing formatters', () => {
  it('rounds USD below 100K to the nearest $100 without cents', () => {
    expect(formatSimpleUsd(7_549)).toBe('$7,500')
    expect(formatSimpleUsd(621.91)).toBe('$600')
  })

  it('rounds six-figure and million values for human reading', () => {
    expect(formatSimpleUsd(621_284.12)).toBe('$620K')
    expect(formatSimpleUsd(4_038_661.43)).toBe('$4.0M')
  })

  it('preserves unavailable states and concise hash rate', () => {
    expect(formatSimpleUsd(null)).toBe('Unavailable')
    expect(formatSimpleEh(18.04)).toBe('18 EH/s')
    expect(formatSimpleEh(123.34, ' needed')).toBe('123 EH/s needed')
  })

  it('uses the three compact commitment labels', () => {
    expect(formatCommitmentUsd(50_000)).toBe('$50K')
    expect(formatCommitmentUsd(500_000)).toBe('$500K')
    expect(formatCommitmentUsd(5_000_000)).toBe('$5M')
  })

  it('formats countdowns and Fred commitments intuitively', () => {
    expect(formatHumanDuration(18 * 60)).toBe('18 minutes')
    expect(formatHumanDuration(3 * 3_600)).toBe('3 hours')
    expect(formatHumanDuration(9.2 * 86_400)).toBe('9 days')
    expect(fredMatchDurationSeconds(50_000, 4_000_000)).toBe(1_080)
  })

  it('adapts the recommended reading window before and after mandatory signaling', () => {
    expect(mandatoryReadingWindowCopy(5 * 3_600)).toBe(
      'You have approximately 5 hours before mandatory signaling begins.',
    )
    expect(mandatoryReadingWindowCopy(0)).toBe(
      'The recommended reading window has closed. The book remains cheaper than the lesson.',
    )
  })

  it('turns the block-time estimate into a drift-free live countdown', () => {
    const generatedAt = '2026-07-30T12:00:00Z'
    expect(estimateLiveMandatorySeconds(90_061, generatedAt, Date.parse(generatedAt))).toBe(90_061)
    expect(estimateLiveMandatorySeconds(90_061, generatedAt, Date.parse(generatedAt) + 1_500)).toBe(90_060)
    expect(splitCountdown(90_061)).toEqual({
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
    })
    expect(formatCountdownLabel({
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
    })).toBe('1 day, 1 hour, 1 minute, 1 second')
  })

  it('builds the factual recruitment message from existing display values', () => {
    expect(buildPlebShareText({
      reinforcementsNeededEhS: 123.313,
      reinforcementBillPerDayUsd: 4_056_274,
      currentPageUrl: 'https://example.com/war-chest/',
    })).toBe(
      'BIP-110 still needs 123 EH/s to match F2Pool, at a theoretical cost of about $4.1M per day. How much are you personally committing? https://example.com/war-chest/',
    )
  })
})
