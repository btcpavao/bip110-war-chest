# BIP-110 War Chest

> The chain records blocks. The dashboard records receipts.

`BIP-110 War Chest` is a fully static React dashboard and reproducible Python data pipeline for tracking BIP-110 signaling, its implied hash-rate footprint, observable mining revenue, public promoter receipts, rental-market estimates and a deliberately satirical 8% scenario.

The visual treatment is an exaggerated nineteenth-century propaganda poster wrapped around a serious quantitative ledger. Numerical claims are never embedded in artwork.

> The dashboard deliberately distinguishes public evidence, market estimates and the satirical General Kratter Scenario. A block signal does not prove that hash rate was rented, and the blockchain does not reveal private rental invoices or miner mempools.

> No publicly verifiable receipt is not the same as zero financial commitment.

## Screenshots

After running the site locally, capture the hero, Battlefield Score and Signaling Block Ledger and add them under `docs/screenshots/`. The production Open Graph artwork is `public/og.png`.

## Stack

- React 19, TypeScript strict mode, Vite
- Tailwind CSS 4, shadcn-style local primitives, Radix UI
- Recharts, Lucide, Zod, TanStack Table
- Python 3.12+, httpx, Pydantic, pytest, Ruff
- Static JSON in `public/data`
- GitHub Actions and GitHub Pages

## Local development

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

npm ci
python scripts/backfill_signaling_blocks.py \
  --from-height 927360 \
  --to-height latest
python scripts/generate_dashboard.py
python scripts/validate_data.py

npm run dev
```

For a fast frontend-only session, use the last committed files in `public/data` and run `npm ci && npm run dev`.

## Reproduction and validation

```bash
pytest
ruff check .
python scripts/validate_data.py
npm run typecheck
npm run test
npm run lint
npm run build
```

The complete update is:

```bash
python scripts/update_all.py
```

## Data sources

- [mempool.space API](https://mempool.space/docs/api/rest): chain tip, block version, timestamp, difficulty, reward, fees, pool attribution and public block-template audit fields.
- [BIP-110 monitor](https://bip110monitor.com/api): period-level cross-check only. It is not used as the signaling classifier.
- [NiceHash public order-book API](https://www.nicehash.com/docs/rest/get-main-api-v2-hashpower-orderBook): live `SHA256AsicBoost` buyer orders and paid speed, quoted in BTC/EH/day without an API key.
- [CoinGecko API](https://www.coingecko.com/en/api): current BTC/USD when available. Current-price conversions are labeled “Current value of historical BTC amount.”
- Manual public evidence in `data/manual/influencer-receipts.json`.

## Signaling methodology

Lifetime observation begins inclusively at block `927360`. Each block is independently classified using the BIP9 top bits and bit 4:

```ts
const unsignedVersion = version >>> 0
const VERSION_TOP_MASK = 0xe0000000
const VERSION_TOP_BITS = 0x20000000
const BIP110_BIT_MASK = 1 << 4

const signalsBip110 =
  (unsignedVersion & VERSION_TOP_MASK) === VERSION_TOP_BITS &&
  (unsignedVersion & BIP110_BIT_MASK) !== 0
```

Bit 4 with the wrong BIP9 prefix does not count. Difficulty periods with zero signals are preserved. The current partial period uses inclusive counting.

The ruleset and source commits are pinned in `config/ruleset.json`. Scheduled jobs do not change the classifier. A ruleset update requires a reviewed source change.

## Hash-rate and EH-day model

The period network hash-rate estimate is derived from the observed Bitcoin difficulty:

```text
network EH/s = difficulty × 2^32 ÷ 600 ÷ 10^18
signaling share = signaling blocks ÷ observed blocks
implied signaling EH/s = signaling share × network EH/s
signal EH-days = implied signaling EH/s × elapsed days
```

Block discovery is a Poisson process. A small number of observed blocks is a noisy estimator of the underlying hash rate; the dashboard therefore shows the sample size, period coverage and mining-luck caveat.

Pool attribution comes from coinbase evidence and may identify a pool without identifying the actual hash owner.

## Mining revenue

Observed signaling-block revenue is:

```text
sum(block subsidy + transaction fees)
```

This is verified blockchain revenue, not proof that a specific promoter received it or that hash rate was rented.

## Current hashpower replacement cost

The pipeline downloads every page of the public NiceHash `SHA256AsicBoost` order book. Only live BTC orders with positive `payingSpeed` count. Market depth is weighted by actual paid speed:

```text
low price = paying-speed-weighted P25
base price = paying-speed-weighted P50
high price = paying-speed-weighted P75
current replacement cost = signal EH-days × current sats/EH/day
```

This is an observable current market benchmark, not a claim about what miners historically paid. Each scheduled run appends an aggregate snapshot to `data/nicehash-market-snapshots.json`, allowing a native history to accumulate from the first successful observation onward.

No current quote is backfilled into earlier dates. If the live API is temporarily unavailable, the last stored snapshot may be displayed with reduced confidence and zero live-coverage status.

## General Kratter 8% scenario

The satirical scenario is separate from verified receipts and the rental estimate.

Observed-revenue mode:

```text
gross modeled spending = observed signaling-block revenue ÷ 0.92
modeled loss = gross modeled spending − observed revenue
```

Current spot-replacement mode:

```text
modeled loss = current replacement cost × 0.08
modeled post-mining value = current replacement cost × 0.92
```

The scenario is not a claim that all signaling hash rate was rented, that the current quote applied historically, or that every participant lost 8%.

## PSU

`PSU` means one annual Plebslop University subscription. It is a satirical secondary unit:

```text
PSU = historical USD amount ÷ config/satire.json annualPriceUsd
```

The default is `$790`. It is configuration-driven and never replaces BTC or fiat as the primary financial unit.

## Spam-Rug Tax

The public mempool observer exposes actual fees, expected template fees, block weight and match rate. Transaction-level cost requires classifying missing transactions against the pinned BIP-110 ruleset:

```text
grossRejectedFeesSats =
  sum(fees of missing transactions classified as BIP110-invalid)

templateFeeGapSats =
  max(expectedFeesSats − actualFeesSats, 0)

estimatedNetFilterCostSats =
  min(grossRejectedFeesSats, templateFeeGapSats)
```

Unknown transactions are excluded from invalid fee mass. If actual fees meet or exceed expected fees, the estimated net filter cost is zero. The current implementation publishes observable template gaps but leaves gross rejected fees and net filter cost unavailable until full transaction-level, UTXO-aware classification is implemented.

This analysis is never mixed into rental P&L unless the user explicitly enables it—and an unavailable tax still contributes zero.

## Verified receipts and evidence rules

Add or edit a public figure only in `data/manual/influencer-receipts.json`. Every evidence record requires:

- source URL
- title and date
- archived screenshot path, when available
- quote or numerical evidence
- confidence
- curator note

Use `null` for unknown financial values. Never write `0 BTC` unless zero is proven. An entry with `NO_PUBLIC_RECEIPT` must have a `null` spend.

The supplied Matthew Kratter `0.1 BTC / 8%` reconstruction remains `EVIDENCE_REVIEW_REQUIRED` in the checked-in manual record because the matching primary receipt has not yet been pinned. The 8% assumption is permitted only in the clearly labeled illustrative scenario.

## Historical prices

Historical receipt amounts must use BTC/USD near the verified experiment timestamp. Nearest-hour prices are preferred; daily data must be labeled `daily`. The pipeline does not use today’s price for a historical loss. Any present-day comparison is explicitly labeled “Current value of historical BTC amount.”

## Cache, resume and reorg handling

`backfill_signaling_blocks.py`:

- fetches inclusive 15-block batches from mempool.space
- caches immutable raw responses under `.cache/mempool`
- retries with exponential backoff
- resumes from `data/block-headers.json`
- rejects duplicate heights or hashes
- compares a cached height against the live chain and fails on a reorg mismatch
- validates exact satoshi units with Pydantic
- writes atomically

After a real reorg, rerun the affected range with `--force-refresh` and review the resulting hash changes before committing them.

## GitHub Pages

1. Create a GitHub repository and push this project to `main`.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Run **Update data and deploy** from the Actions tab.
4. For a project repository, the workflow builds with `/<repository-name>/` as Vite’s base path. A `username.github.io` repository builds with `/`.

The scheduled workflow runs every 30 minutes, restores the API cache, updates the dataset, validates Python and TypeScript, runs tests, builds the static bundle, commits generated data with `[skip ci]` only when it changed, and deploys the current artifact. Concurrency prevents overlapping deploys and the commit message prevents loops.

The separate **Manual backfill** workflow accepts `startHeight`, `endHeight`, `batchSize`, `forceRefresh`, `auditOnly`, `priceOnly` and `rentalMarketOnly`.

## Generated files

- `public/data/dashboard.json`
- `public/data/signaling-blocks.json` and `.csv`
- `public/data/influencer-receipts.json`
- `public/data/rental-market.json`
- `public/data/spam-rug-tax.json`
- `public/data/methodology.json`
- `public/data/status.json`
- `data/nicehash-market-snapshots.json`

All major values carry schema, methodology, ruleset, generation time, chain tip, freshness, commit SHA, warnings and coverage.

## Known limitations

1. Signaling does not prove filtering.
2. Signaling does not prove rented hash rate.
3. Block outcomes are affected by mining luck.
4. Pool identity may not identify the actual hash owner.
5. NiceHash spot replacement cost is not a historical rental invoice.
6. Market snapshot history begins with this pipeline and is not backfilled.
7. A public mempool observer does not have a miner’s exact private template.
8. The 8% scenario is illustrative.
9. PSU is satire.
10. Exact historical miner P&L is not directly observable.
11. Missing evidence is not zero.
12. Full BIP-110 transaction classification requires spent-output context and the activation-height grandfathering rules.

## License

Code is released under the MIT License. Generated datasets retain source attribution and are provided for research and commentary without warranty. The BIP source and upstream APIs retain their respective terms.
