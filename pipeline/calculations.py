from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from math import inf
from statistics import mean

VERSION_TOP_MASK = 0xE0000000
VERSION_TOP_BITS = 0x20000000
BIP110_BIT_MASK = 1 << 4
SATOSHIS_PER_BTC = 100_000_000
HASHES_PER_EH = 10**18
EXPECTED_BLOCK_SECONDS = 600


def signals_bip110(version: int) -> bool:
    unsigned_version = version & 0xFFFFFFFF
    return (
        unsigned_version & VERSION_TOP_MASK
    ) == VERSION_TOP_BITS and (unsigned_version & BIP110_BIT_MASK) != 0


def inclusive_block_count(start_height: int, end_height: int) -> int:
    if end_height < start_height:
        return 0
    return end_height - start_height + 1


def difficulty_period_start(height: int, period_blocks: int = 2016) -> int:
    return height - (height % period_blocks)


def one_signal_per_n(total_blocks: int, signal_blocks: int) -> float | None:
    if signal_blocks <= 0:
        return None
    return total_blocks / signal_blocks


def network_hashrate_eh_s(difficulty: float) -> float:
    if difficulty < 0:
        raise ValueError("difficulty cannot be negative")
    return difficulty * (2**32) / EXPECTED_BLOCK_SECONDS / HASHES_PER_EH


def signal_eh_days(
    signaling_blocks: int,
    observed_blocks: int,
    network_eh_s: float,
    elapsed_seconds: float,
) -> float:
    if observed_blocks <= 0 or elapsed_seconds <= 0:
        return 0.0
    return signaling_blocks / observed_blocks * network_eh_s * elapsed_seconds / 86_400


def kratter_revenue_model(revenue_sats: int, loss_rate: float = 0.08) -> tuple[int, int]:
    if not 0 <= loss_rate < 1:
        raise ValueError("loss rate must be in [0, 1)")
    gross = round(revenue_sats / (1 - loss_rate))
    return gross, gross - revenue_sats


def kratter_market_model(cost_sats: int, loss_rate: float = 0.08) -> tuple[int, int]:
    if not 0 <= loss_rate <= 1:
        raise ValueError("loss rate must be in [0, 1]")
    loss = round(cost_sats * loss_rate)
    return loss, cost_sats - loss


def sats_to_btc(sats: int | float) -> float:
    return sats / SATOSHIS_PER_BTC


def usd_to_psu(usd: float | None, annual_price_usd: float) -> float | None:
    if usd is None:
        return None
    if annual_price_usd <= 0:
        raise ValueError("PSU annual price must be positive")
    return usd / annual_price_usd


@dataclass(frozen=True)
class RentalPrice:
    low_sats_per_eh_day: float | None
    base_sats_per_eh_day: float | None
    high_sats_per_eh_day: float | None


def rental_cost(signal_eh_days_value: float, price: RentalPrice) -> dict[str, float | None]:
    def cost(value: float | None) -> float | None:
        return None if value is None else signal_eh_days_value * value

    return {
        "lowSats": cost(price.low_sats_per_eh_day),
        "baseSats": cost(price.base_sats_per_eh_day),
        "highSats": cost(price.high_sats_per_eh_day),
    }


def weighted_quantile(
    values_and_weights: Iterable[tuple[float, float]],
    quantile: float,
) -> float | None:
    if not 0 <= quantile <= 1:
        raise ValueError("quantile must be in [0, 1]")
    rows = sorted(
        (value, weight)
        for value, weight in values_and_weights
        if value >= 0 and weight > 0
    )
    if not rows:
        return None
    total_weight = sum(weight for _, weight in rows)
    target = total_weight * quantile
    cumulative = 0.0
    for value, weight in rows:
        cumulative += weight
        if cumulative >= target:
            return value
    return rows[-1][0]


def estimated_net_filter_cost(
    actual_fees_sats: int,
    expected_fees_sats: int | None,
    invalid_missing_fees_sats: int,
) -> int | None:
    if expected_fees_sats is None:
        return None
    fee_gap = max(expected_fees_sats - actual_fees_sats, 0)
    return min(max(invalid_missing_fees_sats, 0), fee_gap)


def safe_mean(values: Iterable[float]) -> float | None:
    materialized = list(values)
    return None if not materialized else mean(materialized)


def finite_or_none(value: float) -> float | None:
    return None if value in (inf, -inf) else value
