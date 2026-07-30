from pipeline.calculations import (
    RentalPrice,
    difficulty_period_start,
    estimated_net_filter_cost,
    inclusive_block_count,
    kratter_market_model,
    kratter_revenue_model,
    network_hashrate_eh_s,
    one_signal_per_n,
    rental_cost,
    signal_eh_days,
    signals_bip110,
    usd_to_psu,
)


def test_inclusive_block_count_and_started_height() -> None:
    assert inclusive_block_count(927_360, 927_360) == 1
    assert inclusive_block_count(927_360, 927_359) == 0


def test_difficulty_period_boundaries() -> None:
    assert difficulty_period_start(927_360) == 927_360
    assert difficulty_period_start(929_375) == 927_360
    assert difficulty_period_start(929_376) == 929_376


def test_bip9_prefix_and_bit_four_are_both_required() -> None:
    assert signals_bip110(0x20000010)
    assert not signals_bip110(0x00000010)
    assert not signals_bip110(0x20000000)
    assert not signals_bip110(-0x5FFFFFF0)  # unsigned 0xa0000010 has an invalid prefix


def test_one_signal_per_n_handles_zero() -> None:
    assert one_signal_per_n(100, 4) == 25
    assert one_signal_per_n(100, 0) is None


def test_hashrate_and_eh_days() -> None:
    assert network_hashrate_eh_s(0) == 0
    assert signal_eh_days(0, 2016, 800, 1_209_600) == 0
    assert signal_eh_days(1008, 2016, 800, 1_209_600) == 5600


def test_rental_cost_preserves_missing_coverage() -> None:
    result = rental_cost(2, RentalPrice(10, None, 30))
    assert result == {"lowSats": 20, "baseSats": None, "highSats": 60}


def test_kratter_models_remain_distinct() -> None:
    gross, loss = kratter_revenue_model(92)
    assert gross == 100
    assert loss == 8
    market_loss, post = kratter_market_model(100)
    assert market_loss == 8
    assert post == 92


def test_psu_conversion() -> None:
    assert usd_to_psu(790, 790) == 1
    assert usd_to_psu(None, 790) is None


def test_filter_tax_cases() -> None:
    assert estimated_net_filter_cost(100, 120, 30) == 20
    assert estimated_net_filter_cost(100, 150, 20) == 20
    assert estimated_net_filter_cost(130, 120, 20) == 0
    assert estimated_net_filter_cost(100, None, 20) is None
