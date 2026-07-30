import { describe, expect, it } from 'vitest'
import {
  formatHumanDuration,
  formatCommitmentUsd,
  formatSimpleEh,
  formatSimpleUsd,
  fredMatchDurationSeconds,
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
    expect(formatSimpleEh(123.34, ' needed')).toBe('123.3 EH/s needed')
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
})
