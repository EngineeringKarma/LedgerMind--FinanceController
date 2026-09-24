# LedgerMind — Living Plan

> This document is updated at the end of each phase. Current phase: **0 (Recon & Synthetic Data)**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js 16 Frontend                         │
│  Auth → CSV Upload → Dashboard (P&L, Charts, Anomalies, Table)     │
│  Port 3000                                                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP (JSON)
┌────────────────────────────▼────────────────────────────────────────┐
│                      FastAPI Backend (0.3.0)                        │
│  Port 8000                                                          │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ /auth    │ │ /upload  │ │/categorize│ │/reports  │ │/sessions │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                     │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐    │
│  │ agent/categorizer   │───▶│ agent/llm_client (OpenAI SDK)    │    │
│  │ (rules + LLM batch) │    │ → NVIDIA NIM (Llama 3.3 70B)    │    │
│  └─────────────────────┘    └──────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐    │
│  │ reports/aggregator  │    │ reports/anomaly_detector         │    │
│  │ (P&L, breakdown,    │    │ (spikes, outliers, fee ratios)   │    │
│  │  monthly trends)    │    └──────────────────────────────────┘    │
│  └─────────────────────┘                                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ database.py (aiosqlite, WAL mode)                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Tech Stack:**

| Layer | Technology |
|---|---|
| Backend | Python 3.11+ / FastAPI / Pydantic v2 |
| Database | SQLite via aiosqlite (WAL mode) |
| Auth | bcrypt + python-jose (JWT HS256) |
| LLM | OpenAI SDK → NVIDIA NIM (Llama 3.3 70B) |
| LLM Retry | Tenacity (exponential backoff) |
| Frontend | Next.js 16 / React 19 / Recharts / Tailwind 4 |
| Testing | pytest + pytest-asyncio (69 tests) |

---

## DB Schema

```sql
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id    TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename      TEXT,
    row_count     INTEGER NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    transaction_id  TEXT NOT NULL,
    date            TEXT NOT NULL,
    type            TEXT NOT NULL,
    amount          REAL NOT NULL,            -- ← PROBLEM: stores float, should be INTEGER (paise)
    description     TEXT NOT NULL,
    counterparty    TEXT NOT NULL,
    status          TEXT NOT NULL,
    UNIQUE(session_id, transaction_id)
);

CREATE TABLE IF NOT EXISTS categorizations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    transaction_id  TEXT NOT NULL,
    category        TEXT NOT NULL,
    subcategory     TEXT NOT NULL,
    confidence      REAL NOT NULL,            -- ← OK: confidence is 0.0-1.0, not money
    reasoning       TEXT NOT NULL,
    needs_review    INTEGER NOT NULL,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, transaction_id)
);

CREATE TABLE IF NOT EXISTS reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL UNIQUE REFERENCES sessions(session_id) ON DELETE CASCADE,
    period      TEXT,
    report_data TEXT NOT NULL,                -- JSON blob
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id          TEXT NOT NULL UNIQUE,
    session_id      TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending',
    progress        INTEGER NOT NULL DEFAULT 0,
    total_batches   INTEGER NOT NULL DEFAULT 0,
    categorized_count INTEGER NOT NULL DEFAULT 0,
    needs_review_count INTEGER NOT NULL DEFAULT 0,
    error_message   TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    completed_at    TEXT
);
```

**Indexes:** `idx_sessions_user`, `idx_txn_session`, `idx_cat_session`, `idx_jobs_session`, `idx_jobs_user`

---

## CSV Format

### Current (7 columns, all required by parser)

| Column | Type | Example | Notes |
|---|---|---|---|
| `transaction_id` | string | `txn_vGXWVQCc` | Unique within session |
| `date` | string (YYYY-MM-DD) | `2026-01-02` | Parsed to `date` Pydantic type |
| `type` | string | `payment`, `refund`, `payout`, `fee`, `chargeback`, `tax` | Enum in `TransactionType` |
| `amount` | float | `33022.4` or `-223.74` | **In rupees, not paise** |
| `description` | string | `Customer payment - Invoice #6649` | Free text |
| `counterparty` | string | `HDFC Bank Ltd` | Merchant or bank name |
| `status` | string | `settled`, `pending`, `failed` | Enum in `TransactionStatus` |

### New (2 additional optional columns, appended after existing 7)

| Column | Type | Example | Notes |
|---|---|---|---|
| `settlement_id` | string | `SETT001` | Groups rows into settlement batches. **Optional:** absent in legacy CSVs |
| `utr` | string | `UTR4567890123` | Bank UTR reference. Alias `settlement_utr` also accepted. **Optional** |

**Backward compatibility:** Parser uses `row.get()` with defaults for new columns. Old CSVs without `settlement_id`/`utr` parse identically to current behavior. Reconciliation reports `"settlement_id/UTR not present, cannot reconcile"` instead of erroring.

Parser header normalization (existing, unchanged):
- `amt` / `value` → `amount`
- `desc` / `particulars` / `memo` → `description`
- `txn_id` / `id` / `reference` → `transaction_id`
- `settlement_utr` → `utr` (new normalization added in Phase 3)

---

## Float Audit

Every location where money is stored as or computed with `float`:

| # | File:Line | Code | Severity | Phase |
|---|---|---|---|---|
| 1 | `routes/upload.py:56` | `float(row.get("amount") or 0.0)` | **Critical** — parsing boundary | 1 |
| 2 | `models/schemas.py:25` | `amount: float` (Transaction) | **Critical** — storage model | 1 |
| 3 | `models/schemas.py:40` | `amount: float \| None` (CategorizedTransaction) | **High** — display field from DB | 1 |
| 4 | `models/schemas.py:48-53` | `revenue: float`, `fees: float`, etc. (PnLSummary) | **Critical** — report output | 1 |
| 5 | `models/schemas.py:58` | `total: float` (CategoryBreakdown) | **Critical** — report output | 1 |
| 6 | `models/schemas.py:64-69` | All `MonthlyTrend` float fields | **Critical** — report output | 1 |
| 7 | `database.py:36` | `amount REAL NOT NULL` (SQL DDL) | **Critical** — schema definition | 1 |
| 8 | `reports/aggregator.py:51-55` | `revenue = 0.0`, `fees = 0.0`, etc. | **Critical** — accumulator variables | 1 |
| 9 | `reports/aggregator.py:93-98` | `round(revenue, 2)` etc. in PnLSummary | **High** — rounding on floats | 1 |
| 10 | `reports/aggregator.py:105` | `breakdown[category]["total"] = 0.0` | **Medium** — breakdown accumulator | 1 |
| 11 | `reports/aggregator.py:132-134` | Monthly trend accumulators (`0.0`) | **Medium** — trend accumulators | 1 |
| 12 | `reports/anomaly_detector.py:37` | `monthly[month][category] += amount` | **Medium** — anomaly math (uses abs()) | 1 |
| 13 | `reports/anomaly_detector.py:101` | `cat_totals[category].append(amount)` | **Low** — outlier detection | 1 |
| 14 | `reports/anomaly_detector.py:110` | `sum(vals) / len(vals)` | **Low** — average computation | 1 |
| 15 | `reports/anomaly_detector.py:139-140` | `monthly_rev`, `monthly_fees` accumulators | **Medium** — fee ratio math | 1 |

**Not a money float (allowed):**

| File:Line | Code | Why OK |
|---|---|---|
| `config.py:17` | `confidence_threshold: float` | Confidence is 0.0-1.0, not money |
| `llm_client.py:49` | `temperature: float = 0.1` | LLM parameter, not money |
| `prompts.py:35` | `"confidence": float` (in prompt) | LLM output schema, not money |
| `models/schemas.py:35` | `confidence: float` (CategorizedTransaction) | Confidence score |

**Test data with float money:**

| File | Lines | Issue |
|---|---|---|
| `tests/conftest.py:76-98` | `amount: 10000.0`, `15000.0`, `-200.0` | Test fixtures use float |
| `tests/test_categorizer.py:12-31` | `amount: 10000.0`, etc. | Test fixtures use float |
| `tests/test_database.py:54-63` | `amount: 10000.0`, etc. | Test fixtures use float |
| `tests/test_worker.py:20-37` | `amount: 5000.0`, `-100.0` | Test fixtures use float |

---

## LLM Data Flow

```
1. CSV Upload
   parse_csv() → float(amount) → Transaction schema → INSERT INTO transactions (amount REAL)

2. Categorization
   get_transactions() → list[dict] with amount (float from DB)
     → categorize_with_rules(txn) — deterministic, no LLM
     → categorize_batch(transactions) → build_messages(transactions)
       → JSON.dumps(transactions) → sent to LLM as user message
       → LLM returns {category, subcategory, confidence, reasoning, needs_review}
     → CategorizedTransaction(amount=None from LLM response)
     → INSERT INTO categorizations

3. Report Generation
   get_transactions() + get_categorizations()
     → compute_pnl_with_amounts() — float math on amounts
     → compute_category_breakdown() — float abs() and sum
     → compute_monthly_trend() — float accumulation
     → detect_anomalies() — float comparisons
     → Report(pnl_summary=PnLSummary(revenue=float, ...))
     → JSON → INSERT INTO reports
```

**What reaches the LLM:**
- Full `transaction_id`, `date`, `type`, `amount`, `description`, `counterparty`, `status`
- Serialized as JSON in `prompts.py:build_user_message()`

**What does NOT reach the LLM:**
- `session_id`, `user_id` — never included in messages
- Database internals — only Pydantic model fields

**PII risk:** `description` and `counterparty` fields may contain emails, phone numbers, UPI VPAs, card numbers. Currently sent raw to the LLM. **Phase 2 will add masking.**

---

## Category Taxonomy

| Category | Subcategories |
|---|---|
| Revenue | Subscription Revenue, Service Revenue, Product Sales, Affiliate Revenue |
| Refunds | Full Refund, Partial Refund, Goodwill Credit, Processing Fee Refund |
| Gateway Fees | Payment Processing Fee (MDR), Platform Fee, Settlement Fee, Chargeback Fee, Refund Processing Fee |
| Payouts | Merchant Payout, Bulk Settlement, Instant Payout, T+1 Settlement |
| Tax (GST/TDS) | GST Collected, TDS Deducted, TCS Collected, GST Remittance, TDS Certificate |
| Chargebacks | Chargeback Received, Chargeback Won, Chargeback Lost, Representment, Dispute Resolution |
| Settlements | Settlement Adjustment, Reconciliation Entry, Batch Settlement, Correction Entry |
| Other/Uncategorized | Unclassified Transaction, Manual Review Required, Ambiguous Entry |

---

## API Surface

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check |
| `POST` | `/auth/register` | No | Register new user |
| `POST` | `/auth/login` | No | Login, get JWT |
| `GET` | `/auth/me` | Yes | Current user info |
| `POST` | `/upload` | Yes | Upload CSV file |
| `GET` | `/upload/{session_id}/transactions` | Yes | Get raw transactions |
| `POST` | `/categorize/{session_id}` | Yes | Start LLM categorization (202, background) |
| `GET` | `/jobs/{job_id}` | Yes | Poll job status |
| `GET` | `/categorize/{session_id}/results` | Yes | Get categorized results |
| `POST` | `/reports/generate/{session_id}` | Yes | Generate P&L report |
| `GET` | `/reports/{session_id}` | Yes | Retrieve report |
| `GET` | `/sessions` | Yes | List all sessions |
| `DELETE` | `/sessions/{session_id}` | Yes | Delete session + related data |

**User/session isolation:** Every endpoint with `session_id` param verifies `user_id` owns the session via `session_exists(db, session_id, user_id)`. The one exception is `GET /jobs/{job_id}` which checks `job["user_id"] != current_user["id"]` directly.

---

## Future Tables (Phase 3+)

```sql
-- Phase 3: Reconciliation
CREATE TABLE IF NOT EXISTS bank_statement_rows (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL REFERENCES users(id),
    session_id      TEXT NOT NULL REFERENCES sessions(session_id),
    txn_date        TEXT NOT NULL,
    narration       TEXT NOT NULL,
    utr             TEXT,
    credit_paise    INTEGER NOT NULL DEFAULT 0,
    debit_paise     INTEGER NOT NULL DEFAULT 0,
    balance_paise   INTEGER NOT NULL DEFAULT 0,
    raw_json        TEXT,
    file_hash       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recon_results (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL REFERENCES users(id),
    session_id      TEXT NOT NULL REFERENCES sessions(session_id),
    settlement_id   TEXT,
    bank_row_id     INTEGER REFERENCES bank_statement_rows(id),
    expected_paise  INTEGER NOT NULL,
    actual_paise    INTEGER,
    diff_paise      INTEGER NOT NULL,
    status          TEXT NOT NULL,  -- matched|amount_mismatch|missing_in_bank|unexpected_credit|fuzzy_match_needs_review
    match_method    TEXT,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS integrity_findings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL REFERENCES users(id),
    session_id      TEXT NOT NULL REFERENCES sessions(session_id),
    transaction_id  TEXT,
    settlement_id   TEXT,
    kind            TEXT NOT NULL,  -- duplicate_payment_id|refund_without_payment|captured_not_settled|settlement_total_mismatch|orphan_adjustment
    severity        TEXT NOT NULL,
    detail_json     TEXT
);

-- Phase 2: Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL,
    session_id      TEXT,
    transaction_id  TEXT,
    action          TEXT NOT NULL,  -- categorized|recategorized|flagged|reconciled|rule_created
    actor           TEXT NOT NULL,  -- rule|llm|human|system
    before_json     TEXT,
    after_json      TEXT,
    model_name      TEXT,
    prompt_version  TEXT,
    confidence      REAL,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- Phase 4: Fee Rules
CREATE TABLE IF NOT EXISTS fee_rules (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_method  TEXT NOT NULL,
    card_network    TEXT,
    card_type       TEXT,
    bps_rate        INTEGER NOT NULL,  -- basis points
    flat_paise      INTEGER NOT NULL DEFAULT 0,
    min_paise       INTEGER NOT NULL DEFAULT 0,
    max_paise       INTEGER NOT NULL DEFAULT 999999999,
    gst_rate        REAL NOT NULL DEFAULT 0.18,  -- 18%
    tds_rate        REAL NOT NULL DEFAULT 0.0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now'))
);
```

---

## File Layout

```
backend/
├── app/
│   ├── main.py              # FastAPI entrypoint, CORS, middleware, routers
│   ├── config.py            # Pydantic Settings (env vars)
│   ├── database.py          # SQLite DDL + CRUD (aiosqlite)
│   ├── auth.py              # bcrypt + JWT (get_current_user dependency)
│   ├── errors.py            # Custom exception hierarchy (6 types)
│   ├── worker.py            # Background categorization job runner
│   ├── models/
│   │   └── schemas.py       # Pydantic v2 models (Transaction, PnLSummary, etc.)
│   ├── agent/
│   │   ├── categorizer.py   # Hybrid categorizer (rules + LLM batches)
│   │   ├── llm_client.py    # OpenAI SDK client with tenacity retry
│   │   └── prompts.py       # System prompt, 8 few-shot examples, message builder
│   ├── routes/
│   │   ├── upload.py        # POST /upload, GET /upload/{id}/transactions
│   │   ├── categorize.py    # POST /categorize/{id}, GET /jobs/{id}, GET /results
│   │   ├── reports.py       # POST /reports/generate/{id}, GET /reports/{id}
│   │   ├── sessions.py      # GET /sessions, DELETE /sessions/{id}
│   │   └── auth.py          # POST /auth/register, POST /auth/login, GET /auth/me
│   ├── reports/
│   │   ├── aggregator.py    # P&L, category breakdown, monthly trends
│   │   └── anomaly_detector.py  # 3 deterministic anomaly rules
│   └── data/
│       └── synthetic_generator.py  # Existing 200-row generator (DO NOT MODIFY)
├── tests/
│   ├── conftest.py          # Fixtures: test DB, auth headers, seeded session
│   ├── test_auth.py         # 16 tests
│   ├── test_categorizer.py  # 15 tests
│   ├── test_database.py     # 18 tests
│   ├── test_error_handling.py  # 9 tests
│   ├── test_jobs.py         # 8 tests
│   └── test_worker.py       # 3 tests
├── requirements.txt
├── pyproject.toml
└── .env / .env.example
```

---

## Decisions Log

### Phase 0: Recon & Synthetic Data

| # | Decision | Rationale |
|---|---|---|
| 0.1 | New synthetic generator in `scripts/gen_synthetic.py`, not modifying `backend/app/data/synthetic_generator.py` | Existing tests and app may depend on it |
| 0.2 | New CSV columns `settlement_id` and `utr` appended after existing 7, backward-compatible | Parser uses `row.get()` with defaults; old CSVs still parse |
| 0.3 | `settlement_utr` accepted as alias for `utr` | Razorpay exports may use either column name |
| 0.4 | `docs/PLAN.md` is a living document, updated at end of each phase | Single source of truth for architecture and decisions |
| 0.5 | `scripts/gen_synthetic.py` uses `Decimal` internally, outputs paise as ints in ground_truth.json | Aligns with Phase 1 goal of integer paise storage |
| 0.6 | Fault injection uses `--fault` CLI flags, not config files | Simple, explicit, CI-friendly |
| 0.7 | Each fault type gets exactly one injection by default (configurable via `--fault-count`) | Deterministic, easy to assert in tests |
| 0.8 | Reconciliation reports `"settlement_id/UTR not present"` instead of erroring on old CSVs | Graceful degradation for legacy data |

---

## Provider Notes

### NVIDIA NIM (current LLM backend)

- Client is standard OpenAI SDK pointed at `https://integrate.api.nvidia.com/v1` with `LLM_API_KEY`.
- JSON-mode must be requested explicitly via `response_format={"type": "json_object"}` in the
  `chat.completions.create()` call — verified working against `meta/llama-3.3-70b-instruct`.
- Available models can be enumerated with `client.models.list().data` using the same client config.
- *(Note: patterns extracted from scratch scripts `test_qwen.py` / `test_models.py` — those files deleted in repo cleanup 2026-09-24.)*
