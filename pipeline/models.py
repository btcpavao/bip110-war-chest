from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl, model_validator


class Pool(BaseModel):
    name: str
    slug: str
    source: str
    attributionCaveat: str


class BlockHeader(BaseModel):
    height: int = Field(ge=0)
    hash: str = Field(min_length=64, max_length=64)
    timestamp: int = Field(gt=0)
    version: int
    difficulty: float = Field(ge=0)
    transactionFeesSats: int = Field(ge=0)
    blockRewardSats: int = Field(ge=0)
    expectedFeesSats: int | None = Field(default=None, ge=0)
    expectedWeight: int | None = Field(default=None, ge=0)
    actualWeight: int | None = Field(default=None, ge=0)
    matchRate: float | None = Field(default=None, ge=0, le=100)
    pool: Pool
    previousBlockHash: str | None = None


class SignalingBlock(BaseModel):
    height: int
    hash: str
    timestamp: int
    date: str
    version: int
    versionHex: str
    difficultyPeriod: int
    signalsBip110: Literal[True]
    pool: Pool
    blockSubsidySats: int
    transactionFeesSats: int
    totalMiningRevenueSats: int
    source: str
    fetchedAt: str
    impliedEhDays: float = 0
    marketCostSats: float | None = None
    rentalPnlSats: float | None = None
    filterTaxSats: int | None = None
    confidence: Literal["HIGH", "MEDIUM", "LOW", "UNKNOWN"] = "MEDIUM"


class Evidence(BaseModel):
    sourceUrl: HttpUrl
    title: str
    date: str
    archivedScreenshotPath: str | None = None
    quoteOrNumericalEvidence: str
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    curatorNote: str


class HistoricalPrice(BaseModel):
    date: str
    btcUsd: float = Field(gt=0)
    granularity: Literal["daily", "hourly"]
    sourceUrl: HttpUrl
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    note: str


class Receipt(BaseModel):
    name: str
    title: str
    verifiedSpendBtc: float | None = Field(default=None, ge=0)
    maximumReportedInterimLossRate: float | None = Field(default=None, ge=0, le=1)
    maximumReportedInterimLossBtc: float | None = Field(default=None, ge=0)
    historicalUsdLoss: float | None = Field(default=None, ge=0)
    historicalPrice: HistoricalPrice | None = None
    annualPsuSubscriptionUsd: float = Field(gt=0)
    evidence: list[Evidence]
    status: Literal[
        "VERIFIED_OR_PUBLICLY_RECONSTRUCTED",
        "EVIDENCE_REVIEW_REQUIRED",
        "NO_PUBLIC_RECEIPT",
    ]
    notes: str

    @model_validator(mode="after")
    def zero_is_not_no_receipt(self) -> Receipt:
        if self.status == "NO_PUBLIC_RECEIPT" and self.verifiedSpendBtc is not None:
            raise ValueError("NO_PUBLIC_RECEIPT must use null, never zero")
        return self


class RecruitSource(BaseModel):
    title: str
    url: HttpUrl
    kind: str
    confidence: Literal["HIGH", "MEDIUM", "LOW"]


class RecruitPublicSupport(BaseModel):
    bip110SupportActive: bool
    profileLabel: str
    spacesParticipation: str
    supportEvidence: list[RecruitSource]


class RecruitResumeScale(BaseModel):
    tenExitsListed: bool
    aggregateExitValueUsd: int = Field(ge=0)
    aggregateExitValueLabel: str
    liquidityDisclaimer: str
    sources: list[RecruitSource]


class RecruitEpisode(BaseModel):
    present: bool
    label: str
    description: str
    sources: list[RecruitSource]


class RecruitArchivalEvidence(BaseModel):
    status: Literal["ARCHIVAL_OR_SECONDARY_EVIDENCE"]
    description: str
    sources: list[RecruitSource]


class RecruitReceiptStatus(BaseModel):
    publicHashReceiptRecorded: bool
    label: str
    disclaimer: str
    explanation: str

    @model_validator(mode="after")
    def missing_receipt_is_not_zero(self) -> RecruitReceiptStatus:
        if self.publicHashReceiptRecorded:
            raise ValueError("Recruit dossier currently models the no-public-receipt state")
        if self.disclaimer != "This is not proof of zero commitment":
            raise ValueError("Recruit receipt disclaimer must preserve the required wording")
        return self


class RecruitScenarios(BaseModel):
    usdPresets: list[int]


class HighValueRecruit(BaseModel):
    name: str
    publicSupport: RecruitPublicSupport
    resumeScale: RecruitResumeScale
    stupidCoin: RecruitEpisode
    historicalOrdinals: RecruitArchivalEvidence
    receiptStatus: RecruitReceiptStatus
    recruitmentScenarios: RecruitScenarios
    claimReceiptUrl: HttpUrl


class DatasetEnvelope(BaseModel):
    schemaVersion: str
    methodologyVersion: str
    rulesetVersion: str
    generatedAt: datetime
    chainTip: int
    sourceFreshness: dict[str, Any]
    pipelineCommitSha: str | None
    warnings: list[str]
    coverage: dict[str, float | int | None]
