import { z } from 'zod'

export const labelSchema = z.enum([
  'VERIFIED',
  'MARKET ESTIMATE',
  'GENERAL KRATTER SCENARIO',
  'PUBLIC MEMPOOL ESTIMATE',
  'NO PUBLIC RECEIPT',
  'UNKNOWN',
])

const poolSchema = z.object({
  name: z.string(),
  slug: z.string(),
  source: z.string(),
  attributionCaveat: z.string(),
})

export const signalingBlockSchema = z.object({
  height: z.number().int().nonnegative(),
  hash: z.string().length(64),
  timestamp: z.number().int().positive(),
  date: z.string(),
  version: z.number().int(),
  versionHex: z.string(),
  difficultyPeriod: z.number().int(),
  signalsBip110: z.literal(true),
  pool: poolSchema,
  blockSubsidySats: z.number().int().nonnegative(),
  transactionFeesSats: z.number().int().nonnegative(),
  totalMiningRevenueSats: z.number().int().nonnegative(),
  source: z.string(),
  fetchedAt: z.string(),
  impliedEhDays: z.number().nonnegative(),
  marketCostSats: z.number().nullable(),
  rentalPnlSats: z.number().nullable(),
  filterTaxSats: z.number().int().nullable(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']),
})

const periodSchema = z.object({
  periodNum: z.number().int(),
  startBlock: z.number().int(),
  endBlock: z.number().int(),
  totalBlocks: z.number().int(),
  signalingCount: z.number().int(),
  signalingPct: z.number(),
  networkEhS: z.number(),
  impliedSignalingEhS: z.number(),
  signalEhDays: z.number(),
  cumulativeSignalEhDays: z.number(),
  partial: z.boolean(),
})

const envelopeSchema = z.object({
  schemaVersion: z.string(),
  methodologyVersion: z.string(),
  rulesetVersion: z.string(),
  generatedAt: z.string(),
  chainTip: z.number().int(),
  warnings: z.array(z.string()),
  coverage: z.record(z.string(), z.number().nullable()),
})

export const dashboardSchema = envelopeSchema.extend({
  constants: z.object({
    signalStartHeight: z.number().int(),
    monitorHistoryStartHeight: z.number().int(),
    voluntarySignalingEndHeight: z.number().int(),
    mandatorySignalingStartHeight: z.number().int(),
    mandatorySignalingEndHeight: z.number().int(),
    maximumLockInHeight: z.number().int(),
    maximumActivationHeight: z.number().int(),
    activationThresholdBlocks: z.number().int(),
    difficultyPeriodBlocks: z.number().int(),
    signalBit: z.number().int(),
    classifierVersion: z.string(),
    publishedBipCommit: z.string(),
    referenceImplementationCommit: z.string(),
  }).passthrough(),
  satire: z.object({
    psuName: z.string(),
    psuShortName: z.string(),
    annualPriceUsd: z.number().positive(),
    enabled: z.boolean(),
  }).passthrough(),
  summary: z.object({
    blocksSinceStarted: z.number().int(),
    signalingBlocks: z.number().int(),
    lifetimeSignalingPct: z.number(),
    oneSignalPerNBlocks: z.number().nullable(),
    currentPeriodSignalingPct: z.number(),
    currentPeriodSignalCount: z.number().int(),
    currentPeriodBlockCount: z.number().int(),
    distanceFromThresholdBlocks: z.number().int(),
    currentNetworkEhS: z.number(),
    impliedSignalingEhS: z.number(),
    signalEhDays: z.number(),
    observedMiningRevenueSats: z.number().int(),
    observedTransactionFeesSats: z.number().int(),
  }),
  currentPrice: z.object({
    usd: z.number().nullable(),
    timestamp: z.string().nullable(),
    label: z.string(),
  }),
  marketEstimate: z.object({
    label: z.literal('MARKET ESTIMATE'),
    available: z.boolean(),
    lowSats: z.number().nullable(),
    baseSats: z.number().nullable(),
    highSats: z.number().nullable(),
    lowSatsPerEhDay: z.number().nullable(),
    baseSatsPerEhDay: z.number().nullable(),
    highSatsPerEhDay: z.number().nullable(),
    coveragePct: z.number(),
    confidence: z.string(),
    source: z.string(),
    algorithm: z.string(),
    asOf: z.string().nullable(),
    totalSpeedEhS: z.number().nullable(),
    activePaidOrderCount: z.number().int(),
    snapshotCount: z.number().int(),
    reason: z.string(),
  }),
  kratterScenario: z.object({
    label: z.literal('GENERAL KRATTER SCENARIO'),
    lossRate: z.number(),
    observedRevenueModel: z.object({
      observedRevenueSats: z.number().int(),
      grossModeledSpendingSats: z.number().int(),
      modeledLossSats: z.number().int(),
    }),
    marketRentalModel: z.object({
      estimatedRentalCostSats: z.number().nullable(),
      modeledLossSats: z.number().nullable(),
      modeledPostMiningValueSats: z.number().nullable(),
    }),
  }),
  periods: z.array(periodSchema),
  monitor: z.object({
    available: z.boolean(),
    agrees: z.boolean().nullable(),
    data: z.unknown().nullable(),
  }),
})

export const signalingDatasetSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string(),
  fromHeight: z.number().int(),
  toHeight: z.number().int(),
  recordCount: z.number().int(),
  records: z.array(signalingBlockSchema),
})

const evidenceSchema = z.object({
  sourceUrl: z.string().url(),
  title: z.string(),
  date: z.string(),
  archivedScreenshotPath: z.string().nullable(),
  quoteOrNumericalEvidence: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  curatorNote: z.string(),
})

export const receiptsDatasetSchema = envelopeSchema.extend({
  entries: z.array(z.object({
    name: z.string(),
    title: z.string(),
    verifiedSpendBtc: z.number().nullable(),
    maximumReportedInterimLossRate: z.number().nullable(),
    maximumReportedInterimLossBtc: z.number().nullable(),
    historicalUsdLoss: z.number().nullable(),
    annualPsuSubscriptionUsd: z.number(),
    evidence: z.array(evidenceSchema),
    status: z.enum([
      'VERIFIED_OR_PUBLICLY_RECONSTRUCTED',
      'EVIDENCE_REVIEW_REQUIRED',
      'NO_PUBLIC_RECEIPT',
    ]),
    notes: z.string(),
    historicalPsuLoss: z.number().nullable(),
  })),
})

export const spamTaxSchema = envelopeSchema.extend({
  label: z.literal('PUBLIC MEMPOOL ESTIMATE'),
  auditedSignalingBlocks: z.number().int(),
  totalSignalingBlocks: z.number().int(),
  grossRejectedFeesSats: z.number().nullable(),
  templateFeeGapSats: z.number().int(),
  estimatedNetFilterCostSats: z.number().nullable(),
  unknownFeeMassSats: z.number().int(),
  averageMatchRatePct: z.number(),
  classificationCoveragePct: z.number(),
  ruleBreakdown: z.array(z.unknown()),
  records: z.array(z.unknown()),
  note: z.string(),
})

export type DashboardData = z.infer<typeof dashboardSchema>
export type SignalingBlock = z.infer<typeof signalingBlockSchema>
export type ReceiptData = z.infer<typeof receiptsDatasetSchema>
export type SpamTaxData = z.infer<typeof spamTaxSchema>
