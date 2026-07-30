#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import sys
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from pipeline.calculations import (
    difficulty_period_start,
    inclusive_block_count,
    kratter_revenue_model,
    network_hashrate_eh_s,
    one_signal_per_n,
    sats_to_btc,
    signal_eh_days,
    signals_bip110,
    usd_to_psu,
)
from pipeline.io import read_json, write_json_atomic
from pipeline.models import Receipt

PUBLIC_DATA = ROOT / "public" / "data"
MEMPOOL_API = "https://mempool.space/api"
MONITOR_API = "https://bip110monitor.com/api"
BRAIINS_BARS_API = "https://hashpower.braiins.com/v1/spot/bars"


def commit_sha() -> str | None:
    env_sha = os.getenv("GITHUB_SHA")
    if env_sha:
        return env_sha
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()
    except (subprocess.SubprocessError, FileNotFoundError):
        return None


def fetch_optional_json(url: str) -> tuple[Any | None, str | None]:
    try:
        response = httpx.get(
            url,
            timeout=20,
            headers={"User-Agent": "bip110-war-chest/0.1 (+public research dashboard)"},
        )
        response.raise_for_status()
        return response.json(), None
    except (httpx.HTTPError, ValueError) as exc:
        return None, str(exc)


def period_rows(headers: list[dict[str, Any]], signal_start: int) -> list[dict[str, Any]]:
    grouped: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for block in headers:
        grouped[difficulty_period_start(block["height"])].append(block)
    rows: list[dict[str, Any]] = []
    cumulative_eh_days = 0.0
    for start in sorted(grouped):
        blocks = sorted(grouped[start], key=lambda block: block["height"])
        if blocks[-1]["height"] < signal_start:
            continue
        signaling = sum(1 for block in blocks if signals_bip110(int(block["version"])))
        elapsed = max(blocks[-1]["timestamp"] - blocks[0]["timestamp"] + 600, 600)
        network_eh = network_hashrate_eh_s(float(blocks[0]["difficulty"]))
        eh_days = signal_eh_days(signaling, len(blocks), network_eh, elapsed)
        cumulative_eh_days += eh_days
        rows.append(
            {
                "periodNum": start // 2016,
                "startBlock": max(start, signal_start),
                "endBlock": blocks[-1]["height"],
                "totalBlocks": len(blocks),
                "signalingCount": signaling,
                "signalingPct": signaling / len(blocks) * 100,
                "networkEhS": network_eh,
                "impliedSignalingEhS": network_eh * signaling / len(blocks),
                "signalEhDays": eh_days,
                "cumulativeSignalEhDays": cumulative_eh_days,
                "partial": len(blocks) < 2016,
            }
        )
    return rows


def main() -> None:
    rules = read_json(ROOT / "config" / "ruleset.json")
    satire = read_json(ROOT / "config" / "satire.json")
    header_payload = read_json(ROOT / "data" / "block-headers.json", {"records": []})
    headers: list[dict[str, Any]] = header_payload["records"]
    if not headers:
        raise RuntimeError("run backfill_signaling_blocks.py first")
    headers.sort(key=lambda block: block["height"])
    signal_payload = read_json(ROOT / "data" / "signaling-blocks.json", {"records": []})
    signaling_records: list[dict[str, Any]] = signal_payload["records"]
    receipts_payload = read_json(ROOT / "data" / "manual" / "influencer-receipts.json")
    receipts = [Receipt.model_validate(entry) for entry in receipts_payload["entries"]]

    generated_at = datetime.now(UTC).isoformat()
    chain_tip = headers[-1]["height"]
    signal_start = int(rules["signalStartHeight"])
    periods = period_rows(headers, signal_start)
    total_blocks = inclusive_block_count(signal_start, chain_tip)
    signal_count = len(signaling_records)
    current_period = periods[-1]
    total_revenue_sats = sum(int(block["totalMiningRevenueSats"]) for block in signaling_records)
    total_fees_sats = sum(int(block["transactionFeesSats"]) for block in signaling_records)
    gross_spend_sats, modeled_loss_sats = kratter_revenue_model(total_revenue_sats)
    signal_eh_days_total = sum(float(period["signalEhDays"]) for period in periods)

    monitor, monitor_error = fetch_optional_json(MONITOR_API)
    current_price, current_price_error = fetch_optional_json(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur"
    )
    monitor_agrees: bool | None = None
    if monitor and int(monitor.get("periodStart", -1)) == int(current_period["startBlock"]):
        monitor_agrees = int(monitor.get("signalingCount", -1)) == int(
            current_period["signalingCount"]
        )

    _, braiins_error = fetch_optional_json(
        f"{BRAIINS_BARS_API}?aggregation_period=1d&limit=1000"
    )
    rental_available = braiins_error is None
    warnings = [
        "Historical public rental-market bars are unavailable without a Braiins API key; "
        "market totals are intentionally null."
    ]
    if monitor_error:
        warnings.append(f"BIP-110 monitor unavailable during generation: {monitor_error}")
    elif monitor_agrees is False:
        warnings.append("Internal current-period signaling count disagrees with bip110monitor.com.")
    warnings.append(
        "Spam-Rug Tax transaction classification is not claimed until missing transactions "
        "can be evaluated against the pinned ruleset."
    )
    if current_price_error:
        warnings.append(f"Current CoinGecko price unavailable: {current_price_error}")

    spam_auditable = [
        block
        for block in headers
        if signals_bip110(int(block["version"]))
        and block.get("expectedFeesSats") is not None
    ]
    template_fee_gap = sum(
        max(int(block["expectedFeesSats"]) - int(block["transactionFeesSats"]), 0)
        for block in spam_auditable
    )
    average_match = (
        sum(float(block["matchRate"]) for block in spam_auditable if block.get("matchRate") is not None)
        / max(sum(1 for block in spam_auditable if block.get("matchRate") is not None), 1)
    )

    envelope = {
        "schemaVersion": "1.0.0",
        "methodologyVersion": "2026-07-30.1",
        "rulesetVersion": rules["classifierVersion"],
        "generatedAt": generated_at,
        "chainTip": chain_tip,
        "sourceFreshness": {
            "mempoolSpace": header_payload.get("generatedAt"),
            "bip110Monitor": monitor.get("updatedAt") if monitor else None,
            "braiinsHashpower": None,
            "coinGecko": generated_at if current_price else None,
        },
        "pipelineCommitSha": commit_sha(),
        "warnings": warnings,
        "coverage": {
            "blockIndexPct": len(headers) / total_blocks * 100,
            "monitorCrossCheck": 100 if monitor_agrees else 0,
            "rentalMarketPct": 0 if not rental_available else 100,
            "spamAuditBlockPct": len(spam_auditable) / max(signal_count, 1) * 100,
            "spamClassificationPct": 0,
        },
    }

    dashboard = {
        **envelope,
        "constants": rules,
        "satire": satire,
        "summary": {
            "blocksSinceStarted": total_blocks,
            "signalingBlocks": signal_count,
            "lifetimeSignalingPct": signal_count / total_blocks * 100,
            "oneSignalPerNBlocks": one_signal_per_n(total_blocks, signal_count),
            "currentPeriodSignalingPct": current_period["signalingPct"],
            "currentPeriodSignalCount": current_period["signalingCount"],
            "currentPeriodBlockCount": current_period["totalBlocks"],
            "distanceFromThresholdBlocks": max(
                int(rules["activationThresholdBlocks"])
                - int(current_period["signalingCount"]),
                0,
            ),
            "currentNetworkEhS": current_period["networkEhS"],
            "impliedSignalingEhS": current_period["impliedSignalingEhS"],
            "signalEhDays": signal_eh_days_total,
            "observedMiningRevenueSats": total_revenue_sats,
            "observedTransactionFeesSats": total_fees_sats,
        },
        "currentPrice": {
            "usd": current_price.get("bitcoin", {}).get("usd") if current_price else None,
            "eur": current_price.get("bitcoin", {}).get("eur") if current_price else None,
            "timestamp": generated_at if current_price else None,
            "label": "Current value of historical BTC amount",
        },
        "marketEstimate": {
            "label": "MARKET ESTIMATE",
            "available": False,
            "lowSats": None,
            "baseSats": None,
            "highSats": None,
            "coveragePct": 0,
            "confidence": "UNKNOWN",
            "reason": (
                "No unauthenticated historical Braiins bars were available at generation time; "
                "no extrapolation was made."
            ),
        },
        "kratterScenario": {
            "label": "GENERAL KRATTER SCENARIO",
            "lossRate": 0.08,
            "observedRevenueModel": {
                "observedRevenueSats": total_revenue_sats,
                "grossModeledSpendingSats": gross_spend_sats,
                "modeledLossSats": modeled_loss_sats,
            },
            "marketRentalModel": {
                "estimatedRentalCostSats": None,
                "modeledLossSats": None,
                "modeledPostMiningValueSats": None,
            },
        },
        "periods": periods,
        "monitor": {
            "available": monitor is not None,
            "agrees": monitor_agrees,
            "data": monitor,
        },
    }
    write_json_atomic(PUBLIC_DATA / "dashboard.json", dashboard)

    receipts_public = {
        **envelope,
        "entries": [
            {
                **receipt.model_dump(mode="json"),
                "historicalPsuLoss": usd_to_psu(
                    receipt.historicalUsdLoss, float(satire["annualPriceUsd"])
                ),
            }
            for receipt in receipts
        ],
    }
    write_json_atomic(PUBLIC_DATA / "influencer-receipts.json", receipts_public)
    write_json_atomic(
        PUBLIC_DATA / "rental-market.json",
        {
            **envelope,
            "source": "Braiins Hashpower",
            "units": "sats/EH/day (as declared by /spot/settings when authenticated)",
            "available": False,
            "records": [],
            "missingReason": (
                "The current public endpoint requires an API key. No historical prices were "
                "invented or backfilled from current quotes."
            ),
        },
    )
    write_json_atomic(
        PUBLIC_DATA / "spam-rug-tax.json",
        {
            **envelope,
            "label": "PUBLIC MEMPOOL ESTIMATE",
            "auditedSignalingBlocks": len(spam_auditable),
            "totalSignalingBlocks": signal_count,
            "grossRejectedFeesSats": None,
            "templateFeeGapSats": template_fee_gap,
            "estimatedNetFilterCostSats": None,
            "unknownFeeMassSats": template_fee_gap,
            "averageMatchRatePct": average_match,
            "classificationCoveragePct": 0,
            "ruleBreakdown": [],
            "records": [],
            "note": (
                "Template fee gaps are observable. They are not counted as BIP-110 filter cost "
                "without transaction-level rule classification."
            ),
        },
    )
    write_json_atomic(
        PUBLIC_DATA / "methodology.json",
        {
            **envelope,
            "formulas": {
                "signalDetection": "(version & 0xe0000000) === 0x20000000 && (version & (1 << 4)) !== 0",
                "networkHashrate": "difficulty × 2^32 ÷ 600 ÷ 10^18 EH/s",
                "signalEhDays": "(signal blocks ÷ observed blocks) × network EH/s × elapsed days",
                "observedRevenueGrossSpend": "observed signaling-block revenue ÷ 0.92",
                "observedRevenueLoss": "gross modeled spending − observed revenue",
                "marketLoss": "estimated historical rental cost × 0.08",
                "psu": "historical USD amount ÷ configured annual PSU price",
                "filterTax": "min(BIP110-invalid missing fees, max(expected fees − actual fees, 0))",
            },
            "disclaimers": [
                "Signaling does not prove filtering.",
                "Signaling does not prove rented hash rate.",
                "Block outcomes are affected by mining luck.",
                "Pool identity may not identify the actual hash owner.",
                "Historical rental-market coverage may be incomplete.",
                "A public mempool observer does not possess the miner's exact private block template.",
                "The Kratter 8% scenario is illustrative.",
                "PSU is a satirical comparison unit.",
                "Exact historical miner P&L is not directly observable.",
                "Missing evidence must not be treated as zero.",
            ],
        },
    )
    write_json_atomic(
        PUBLIC_DATA / "status.json",
        {
            **envelope,
            "status": "PARTIAL",
            "internalSignalCount": signal_count,
            "monitorSignalCount": monitor.get("signalingCount") if monitor else None,
            "monitorAgrees": monitor_agrees,
        },
    )

    # Add block-level model fields only where they are supported. Market and filter fields remain null.
    period_lookup = {period["periodNum"]: period for period in periods}
    per_period_signal_counts = {
        period["periodNum"]: max(period["signalingCount"], 1) for period in periods
    }
    for record in signaling_records:
        period_num = record["difficultyPeriod"]
        period = period_lookup[period_num]
        record["impliedEhDays"] = period["signalEhDays"] / per_period_signal_counts[period_num]
        record["marketCostSats"] = None
        record["rentalPnlSats"] = None
        record["filterTaxSats"] = None
        record["confidence"] = "MEDIUM"
    signal_payload["records"] = signaling_records
    write_json_atomic(PUBLIC_DATA / "signaling-blocks.json", signal_payload)

    csv_headers = [
        "height",
        "hash",
        "date",
        "pool",
        "versionHex",
        "impliedEhDays",
        "marketCostSats",
        "totalMiningRevenueSats",
        "rentalPnlSats",
        "filterTaxSats",
        "confidence",
    ]
    csv_lines = [",".join(csv_headers)]
    for record in signaling_records:
        values = [
            record["height"],
            record["hash"],
            record["date"],
            json.dumps(record["pool"]["name"]),
            record["versionHex"],
            f'{record["impliedEhDays"]:.8f}',
            "",
            record["totalMiningRevenueSats"],
            "",
            "",
            record["confidence"],
        ]
        csv_lines.append(",".join(map(str, values)))
    (PUBLIC_DATA / "signaling-blocks.csv").write_text(
        "\n".join(csv_lines) + "\n", encoding="utf-8"
    )
    print(
        f"dashboard generated at block {chain_tip}: {signal_count} signals, "
        f"{sats_to_btc(total_revenue_sats):.8f} BTC observed revenue"
    )


if __name__ == "__main__":
    main()
