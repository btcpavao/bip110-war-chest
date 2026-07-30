#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from pipeline.calculations import difficulty_period_start, signals_bip110
from pipeline.io import read_json, write_json_atomic
from pipeline.models import BlockHeader, Pool, SignalingBlock

MEMPOOL_API = "https://mempool.space/api"
SOURCE_URL = "https://mempool.space"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Backfill BIP-110 block versions.")
    parser.add_argument("--from-height", type=int, default=927_360)
    parser.add_argument("--to-height", default="latest")
    parser.add_argument("--batch-size", type=int, default=15)
    parser.add_argument("--concurrency", type=int, default=8)
    parser.add_argument("--force-refresh", action="store_true")
    return parser.parse_args()


async def get_json(client: httpx.AsyncClient, url: str, attempts: int = 5) -> Any:
    error: Exception | None = None
    for attempt in range(attempts):
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            error = exc
            await asyncio.sleep(min(2**attempt, 20))
    raise RuntimeError(f"failed after {attempts} attempts: {url}") from error


async def fetch_batch(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    start_height: int,
    force_refresh: bool,
) -> list[dict[str, Any]]:
    cache_path = ROOT / ".cache" / "mempool" / f"blocks-{start_height}.json"
    if cache_path.exists() and not force_refresh:
        cached = read_json(cache_path)
        if isinstance(cached, list):
            return cached
    async with semaphore:
        payload = await get_json(client, f"{MEMPOOL_API}/v1/blocks/{start_height}")
    if not isinstance(payload, list):
        raise TypeError(f"unexpected block batch at {start_height}")
    write_json_atomic(cache_path, payload)
    return payload


def to_header(block: dict[str, Any]) -> BlockHeader:
    extras = block.get("extras") or {}
    pool_data = extras.get("pool") or {}
    reward = int(extras.get("reward") or 0)
    fees = int(extras.get("totalFees") or 0)
    return BlockHeader(
        height=int(block["height"]),
        hash=str(block["id"]),
        timestamp=int(block["timestamp"]),
        version=int(block["version"]),
        difficulty=float(block.get("difficulty") or 0),
        transactionFeesSats=fees,
        blockRewardSats=reward,
        expectedFeesSats=(
            int(extras["expectedFees"]) if extras.get("expectedFees") is not None else None
        ),
        expectedWeight=(
            int(extras["expectedWeight"]) if extras.get("expectedWeight") is not None else None
        ),
        actualWeight=int(block["weight"]) if block.get("weight") is not None else None,
        matchRate=float(extras["matchRate"]) if extras.get("matchRate") is not None else None,
        pool=Pool(
            name=str(pool_data.get("name") or "Unknown"),
            slug=str(pool_data.get("slug") or "unknown"),
            source=SOURCE_URL,
            attributionCaveat="Pool attribution is inferred from coinbase data and may not identify the hash owner.",
        ),
        previousBlockHash=block.get("previousblockhash"),
    )


async def run(args: argparse.Namespace) -> None:
    existing_payload = read_json(ROOT / "data" / "block-headers.json", {"records": []})
    existing = {
        int(item["height"]): BlockHeader.model_validate(item)
        for item in existing_payload.get("records", [])
    }
    timeout = httpx.Timeout(30)
    headers = {"User-Agent": "bip110-war-chest/0.1 (+public research dashboard)"}
    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        if args.to_height == "latest":
            response = await client.get(f"{MEMPOOL_API}/v1/blocks/tip/height")
            response.raise_for_status()
            to_height = int(response.text)
        else:
            to_height = int(args.to_height)
        if to_height < args.from_height:
            raise ValueError("to-height must be >= from-height")
        starts = list(range(to_height, args.from_height - 1, -args.batch_size))
        reorg_floor = max(args.from_height, to_height - 143)

        def batch_needs_fetch(start: int) -> bool:
            if args.force_refresh or start >= reorg_floor:
                return True
            batch_floor = max(args.from_height, start - args.batch_size + 1)
            return any(height not in existing for height in range(batch_floor, start + 1))

        starts_to_fetch = [start for start in starts if batch_needs_fetch(start)]
        semaphore = asyncio.Semaphore(max(1, args.concurrency))
        batches = await asyncio.gather(
            *[
                fetch_batch(client, semaphore, height, args.force_refresh)
                for height in starts_to_fetch
            ]
        )

    reorg_heights: list[int] = []
    for raw in (block for batch in batches for block in batch):
        height = int(raw["height"])
        if not args.from_height <= height <= to_height:
            continue
        parsed = to_header(raw)
        previous = existing.get(height)
        if previous is not None and previous.hash != parsed.hash:
            if height < reorg_floor:
                raise RuntimeError(
                    f"historical chain mismatch at {height}: "
                    f"cached {previous.hash}, chain {parsed.hash}"
                )
            reorg_heights.append(height)
        existing[height] = parsed

    observed = [existing[height] for height in sorted(existing) if args.from_height <= height <= to_height]
    expected_count = to_height - args.from_height + 1
    if len(observed) != expected_count:
        missing = sorted(set(range(args.from_height, to_height + 1)) - {b.height for b in observed})
        raise RuntimeError(f"incomplete index: {len(missing)} missing heights, first={missing[:5]}")
    hashes = [block.hash for block in observed]
    if len(hashes) != len(set(hashes)):
        raise RuntimeError("duplicate block hashes detected")

    fetched_at = datetime.now(UTC).isoformat()
    signaling: list[SignalingBlock] = []
    for block in observed:
        if not signals_bip110(block.version):
            continue
        subsidy = block.blockRewardSats - block.transactionFeesSats
        signaling.append(
            SignalingBlock(
                height=block.height,
                hash=block.hash,
                timestamp=block.timestamp,
                date=datetime.fromtimestamp(block.timestamp, UTC).date().isoformat(),
                version=block.version,
                versionHex=f"0x{block.version & 0xFFFFFFFF:08x}",
                difficultyPeriod=difficulty_period_start(block.height) // 2016,
                signalsBip110=True,
                pool=block.pool,
                blockSubsidySats=max(subsidy, 0),
                transactionFeesSats=block.transactionFeesSats,
                totalMiningRevenueSats=block.blockRewardSats,
                source=f"{MEMPOOL_API}/block/{block.hash}",
                fetchedAt=fetched_at,
            )
        )

    metadata = {
        "schemaVersion": "1.0.0",
        "generatedAt": fetched_at,
        "fromHeight": args.from_height,
        "toHeight": to_height,
        "recordCount": len(observed),
    }
    write_json_atomic(
        ROOT / "data" / "block-headers.json",
        {**metadata, "records": [item.model_dump(mode="json") for item in observed]},
    )
    signaling_payload = {
        **metadata,
        "recordCount": len(signaling),
        "records": [item.model_dump(mode="json") for item in signaling],
    }
    write_json_atomic(ROOT / "data" / "signaling-blocks.json", signaling_payload)
    write_json_atomic(ROOT / "public" / "data" / "signaling-blocks.json", signaling_payload)
    if reorg_heights:
        print(
            "reorg detected and refreshed in the rolling safety window at heights: "
            + ", ".join(str(height) for height in sorted(reorg_heights))
        )
    print(
        f"indexed {len(observed):,} blocks ({args.from_height}-{to_height}); "
        f"{len(signaling):,} signal BIP-110; "
        f"fetched {len(starts_to_fetch):,}/{len(starts):,} batches"
    )


if __name__ == "__main__":
    asyncio.run(run(parse_args()))
