#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from pipeline.io import read_json
from pipeline.models import DatasetEnvelope, Receipt, SignalingBlock


def main() -> None:
    dashboard = read_json(ROOT / "public" / "data" / "dashboard.json")
    DatasetEnvelope.model_validate(dashboard)
    blocks = read_json(ROOT / "public" / "data" / "signaling-blocks.json")
    parsed_blocks = [SignalingBlock.model_validate(item) for item in blocks["records"]]
    heights = [item.height for item in parsed_blocks]
    hashes = [item.hash for item in parsed_blocks]
    if len(heights) != len(set(heights)) or len(hashes) != len(set(hashes)):
        raise ValueError("duplicate signaling block height or hash")
    receipts = read_json(ROOT / "public" / "data" / "influencer-receipts.json")
    for item in receipts["entries"]:
        cleaned = {key: value for key, value in item.items() if key != "historicalPsuLoss"}
        Receipt.model_validate(cleaned)
    print("generated data validated")


if __name__ == "__main__":
    main()
