#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts" / "backfill_signaling_blocks.py"),
            "--from-height",
            "927360",
            "--to-height",
            "latest",
        ],
        check=True,
        cwd=ROOT,
    )
    subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "generate_dashboard.py")],
        check=True,
        cwd=ROOT,
    )


if __name__ == "__main__":
    main()
