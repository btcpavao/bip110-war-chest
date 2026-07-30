import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from pipeline.models import HighValueRecruit

ROOT = Path(__file__).resolve().parents[1]


def recruit_payload() -> dict:
    return json.loads(
        (ROOT / "data" / "manual" / "high-value-recruit.json").read_text()
    )


def test_high_value_recruit_manual_data_validates() -> None:
    recruit = HighValueRecruit.model_validate(recruit_payload())
    assert recruit.name == "Fred Krueger"
    assert recruit.resumeScale.tenExitsListed
    assert recruit.resumeScale.aggregateExitValueUsd == 500_000_000
    assert not recruit.receiptStatus.publicHashReceiptRecorded
    assert recruit.historicalOrdinals.sources == []


def test_missing_receipt_cannot_be_reframed_as_zero() -> None:
    payload = recruit_payload()
    payload["receiptStatus"]["disclaimer"] = "Fred committed zero"
    with pytest.raises(ValidationError):
        HighValueRecruit.model_validate(payload)
