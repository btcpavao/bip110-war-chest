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
    RentalPrice,
    difficulty_period_start,
    inclusive_block_count,
    kratter_market_model,
    kratter_revenue_model,
    network_hashrate_eh_s,
    one_signal_per_n,
    rental_cost,
    sats_to_btc,
    signal_eh_days,
    signals_bip110,
    usd_to_psu,
    weighted_quantile,
)
from pipeline.io import read_json, write_json_atomic
from pipeline.models import Receipt

PUBLIC_DATA = ROOT / "public" / "data"
MEMPOOL_API = "https://mempool.space/api"
MONITOR_API = "https://bip110monitor.com/api"
NICEHASH_ORDERBOOK_API = "https://api2.nicehash.com/main/api/v2/hashpower/orderBook"
NICEHASH_ALGORITHM = "SHA256AsicBoost"
NICEHASH_SNAPSHOTS = ROOT / "data" / "nicehash-market-snapshots.json"


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


def fetch_nicehash_market() -> tuple[dict[str, Any] | None, str | None]:
    first, error = fetch_optional_json(
        f"{NICEHASH_ORDERBOOK_API}?algorithm={NICEHASH_ALGORITHM}&size=100&page=0"
    )
    if first is None:
        return None, error
    try:
        stats = first["stats"]["BTC"]
        page_count = int(stats["pagination"]["totalPageCount"])
        orders = list(stats["orders"])
        for page in range(1, page_count):
            payload, page_error = fetch_optional_json(
                f"{NICEHASH_ORDERBOOK_API}?algorithm={NICEHASH_ALGORITHM}"
                f"&size=100&page={page}"
            )
            if payload is None:
                return None, f"NiceHash page {page} unavailable: {page_error}"
            orders.extend(payload["stats"]["BTC"]["orders"])

        priced_speed = [
            (float(order["price"]), float(order["payingSpeed"]))
            for order in orders
            if order.get("alive") is True
            and order.get("currencyMarket") == "BTC"
            and float(order.get("payingSpeed") or 0) > 0
        ]
        low = weighted_quantile(priced_speed, 0.25)
        base = weighted_quantile(priced_speed, 0.50)
        high = weighted_quantile(priced_speed, 0.75)
        if low is None or base is None or high is None:
            raise ValueError("NiceHash order book contains no live paid SHA-256 speed")
        return {
            "timestamp": str(stats["updatedTs"]),
            "algorithm": NICEHASH_ALGORITHM,
            "currency": "BTC",
            "unit": "BTC/EH/day",
            "lowSatsPerEhDay": round(low * 100_000_000),
            "baseSatsPerEhDay": round(base * 100_000_000),
            "highSatsPerEhDay": round(high * 100_000_000),
            "totalSpeedEhS": float(stats["totalSpeed"]),
            "activePaidOrderCount": len(priced_speed),
            "quantiles": "payingSpeed-weighted P25 / P50 / P75",
            "source": (
                f"{NICEHASH_ORDERBOOK_API}?algorithm={NICEHASH_ALGORITHM}"
                "&size=100&page=0"
            ),
        }, None
    except (KeyError, TypeError, ValueError) as exc:
        return None, f"unexpected NiceHash order-book response: {exc}"


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
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    )
    monitor_agrees: bool | None = None
    if monitor and int(monitor.get("periodStart", -1)) == int(current_period["startBlock"]):
        monitor_agrees = int(monitor.get("signalingCount", -1)) == int(
            current_period["signalingCount"]
        )

    nicehash_market, nicehash_error = fetch_nicehash_market()
    snapshot_payload = read_json(
        NICEHASH_SNAPSHOTS,
        {
            "schemaVersion": "1.0.0",
            "source": "NiceHash public SHA256AsicBoost order book",
            "records": [],
        },
    )
    market_snapshots: list[dict[str, Any]] = snapshot_payload.get("records", [])
    if nicehash_market and not any(
        row.get("timestamp") == nicehash_market["timestamp"] for row in market_snapshots
    ):
        market_snapshots.append(nicehash_market)
        market_snapshots = market_snapshots[-35_040:]
        write_json_atomic(
            NICEHASH_SNAPSHOTS,
            {
                "schemaVersion": "1.0.0",
                "source": "NiceHash public SHA256AsicBoost order book",
                "records": market_snapshots,
            },
        )
    latest_market = nicehash_market or (market_snapshots[-1] if market_snapshots else None)
    rental_available = latest_market is not None
    is_live_market = nicehash_market is not None
    market_prices = RentalPrice(
        low_sats_per_eh_day=(
            float(latest_market["lowSatsPerEhDay"]) if latest_market else None
        ),
        base_sats_per_eh_day=(
            float(latest_market["baseSatsPerEhDay"]) if latest_market else None
        ),
        high_sats_per_eh_day=(
            float(latest_market["highSatsPerEhDay"]) if latest_market else None
        ),
    )
    market_costs = rental_cost(signal_eh_days_total, market_prices)
    market_costs = {
        key: round(value) if value is not None else None
        for key, value in market_costs.items()
    }
    market_loss_sats, market_post_value_sats = (
        kratter_market_model(int(market_costs["baseSats"]))
        if market_costs["baseSats"] is not None
        else (None, None)
    )
    warnings = [
        "NiceHash is a current spot replacement-cost benchmark. Applying its quote to "
        "historical signal EH-days is not evidence of a historical rental invoice."
    ]
    if nicehash_error:
        if latest_market:
            warnings.append(
                f"NiceHash live order book unavailable; latest stored snapshot used: {nicehash_error}"
            )
        else:
            warnings.append(f"NiceHash order book unavailable: {nicehash_error}")
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
        "methodologyVersion": "2026-07-30.2",
        "rulesetVersion": rules["classifierVersion"],
        "generatedAt": generated_at,
        "chainTip": chain_tip,
        "sourceFreshness": {
            "mempoolSpace": header_payload.get("generatedAt"),
            "bip110Monitor": monitor.get("updatedAt") if monitor else None,
            "niceHashOrderBook": latest_market.get("timestamp") if latest_market else None,
            "coinGecko": generated_at if current_price else None,
        },
        "pipelineCommitSha": commit_sha(),
        "warnings": warnings,
        "coverage": {
            "blockIndexPct": len(headers) / total_blocks * 100,
            "monitorCrossCheck": 100 if monitor_agrees else 0,
            "rentalMarketPct": 100 if is_live_market else 0,
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
            "timestamp": generated_at if current_price else None,
            "label": "Current value of historical BTC amount",
        },
        "marketEstimate": {
            "label": "MARKET ESTIMATE",
            "available": rental_available,
            "lowSats": market_costs["lowSats"],
            "baseSats": market_costs["baseSats"],
            "highSats": market_costs["highSats"],
            "lowSatsPerEhDay": (
                latest_market.get("lowSatsPerEhDay") if latest_market else None
            ),
            "baseSatsPerEhDay": (
                latest_market.get("baseSatsPerEhDay") if latest_market else None
            ),
            "highSatsPerEhDay": (
                latest_market.get("highSatsPerEhDay") if latest_market else None
            ),
            "coveragePct": 100 if is_live_market else 0,
            "confidence": "MEDIUM" if is_live_market else "LOW",
            "source": "NiceHash public SHA256AsicBoost order book",
            "algorithm": NICEHASH_ALGORITHM,
            "asOf": latest_market.get("timestamp") if latest_market else None,
            "totalSpeedEhS": (
                latest_market.get("totalSpeedEhS") if latest_market else None
            ),
            "activePaidOrderCount": (
                latest_market.get("activePaidOrderCount") if latest_market else 0
            ),
            "snapshotCount": len(market_snapshots),
            "reason": (
                "Current NiceHash SHA256AsicBoost paying-speed-weighted spot quote applied "
                "to the observed signal EH-day footprint as a replacement-cost benchmark. "
                "It is not claimed as the historical invoice."
                if latest_market
                else "No live or stored NiceHash market snapshot is available."
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
                "estimatedRentalCostSats": market_costs["baseSats"],
                "modeledLossSats": market_loss_sats,
                "modeledPostMiningValueSats": market_post_value_sats,
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
            "source": "NiceHash public SHA256AsicBoost order book",
            "units": "sats/EH/day",
            "available": rental_available,
            "currentSpot": latest_market,
            "records": market_snapshots,
            "missingReason": (
                None
                if rental_available
                else "No live or stored NiceHash market snapshot is available."
            ),
            "historyNote": (
                "Snapshots accumulate from the first successful pipeline run. No current quote "
                "is backfilled into dates before it was observed."
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
                "spotReplacementCost": (
                    "signal EH-days × NiceHash paying-speed-weighted spot BTC/EH/day"
                ),
                "marketLoss": "current spot replacement cost × 0.08",
                "psu": "historical USD amount ÷ configured annual PSU price",
                "filterTax": "min(BIP110-invalid missing fees, max(expected fees − actual fees, 0))",
            },
            "disclaimers": [
                "Signaling does not prove filtering.",
                "Signaling does not prove rented hash rate.",
                "Block outcomes are affected by mining luck.",
                "Pool identity may not identify the actual hash owner.",
                "NiceHash spot replacement cost is not a historical rental invoice.",
                "Snapshot history begins with this pipeline and is not backfilled.",
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

    # Current spot replacement cost is assigned explicitly; historical invoices and P&L stay unknown.
    period_lookup = {period["periodNum"]: period for period in periods}
    per_period_signal_counts = {
        period["periodNum"]: max(period["signalingCount"], 1) for period in periods
    }
    for record in signaling_records:
        period_num = record["difficultyPeriod"]
        period = period_lookup[period_num]
        record["impliedEhDays"] = period["signalEhDays"] / per_period_signal_counts[period_num]
        record["marketCostSats"] = (
            record["impliedEhDays"] * market_prices.base_sats_per_eh_day
            if market_prices.base_sats_per_eh_day is not None
            else None
        )
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
            (
                f'{record["marketCostSats"]:.0f}'
                if record["marketCostSats"] is not None
                else ""
            ),
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
