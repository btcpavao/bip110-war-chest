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


class Receipt(BaseModel):
    name: str
    title: str
    verifiedSpendBtc: float | None = Field(default=None, ge=0)
    maximumReportedInterimLossRate: float | None = Field(default=None, ge=0, le=1)
    maximumReportedInterimLossBtc: float | None = Field(default=None, ge=0)
    historicalUsdLoss: float | None = Field(default=None, ge=0)
    historicalEurLoss: float | None = Field(default=None, ge=0)
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
