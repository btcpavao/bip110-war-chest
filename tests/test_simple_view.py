import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


def dashboard() -> dict:
    return json.loads((ROOT / "public" / "data" / "dashboard.json").read_text())


def test_simple_view_daily_costs_use_current_market_price() -> None:
    data = dashboard()
    simple = data["simpleView"]
    boss = data["bossBattle"]
    btc_usd = data["currentPrice"]["usd"]
    market_btc_per_eh_day = boss["costScenarios"]["marketBaseBtcPerEhDay"]

    assert simple["currentArmyCostPerDayUsd"] == pytest.approx(
        boss["bip110WindowEhS"] * market_btc_per_eh_day * btc_usd
    )
    assert simple["matchF2PoolCostPerDayUsd"] == pytest.approx(
        boss["reinforcementsRequiredEhS"] * market_btc_per_eh_day * btc_usd
    )


def test_simple_view_uses_one_matched_seven_day_window() -> None:
    data = dashboard()
    simple = data["simpleView"]
    boss = data["bossBattle"]

    assert boss["comparisonWindow"] == "7d"
    assert simple["bip110SevenDayEhS"] == boss["bip110WindowEhS"]
    assert simple["f2poolSevenDayEhS"] == boss["f2poolWindowEhS"]
    assert simple["reinforcementsNeededEhS"] == boss["reinforcementsRequiredEhS"]


def test_simple_view_countdown_and_historical_kratter_conversion() -> None:
    data = dashboard()
    simple = data["simpleView"]
    kratter = next(
        entry
        for entry in json.loads(
            (ROOT / "data" / "manual" / "influencer-receipts.json").read_text()
        )["entries"]
        if entry["name"] == "Matthew Kratter"
    )

    assert simple["secondsUntilMandatory"] == data["battleClock"]["estimatedSecondsRemaining"]
    assert simple["historicalKratter"]["priceDate"] == kratter["historicalPrice"]["date"]
    assert simple["kratterCommittedUsd"] == pytest.approx(
        kratter["verifiedSpendBtc"] * kratter["historicalPrice"]["btcUsd"]
    )
    assert simple["kratterMaximumLossUsd"] == pytest.approx(
        kratter["maximumReportedInterimLossBtc"]
        * kratter["historicalPrice"]["btcUsd"]
    )
