# LedgerMind — AI Finance Controller
## Build Spec for OpenCode

---

## 1. Project Overview

**Name:** LedgerMind
**One-liner:** An AI agent that ingests Razorpay-style settlement/transaction data, categorizes each transaction using an LLM (not rule-based matching), and auto-generates finance controller reports (P&L summary, category breakdowns, trends, anomaly flags).

**Core value prop:** Replaces the manual first-pass review a human finance controller does on raw settlement data — reasoning through ambiguous transaction descriptions instead of relying on rigid keyword rules.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Backend | Python 3.11+, FastAPI |
| LLM | Open-source model via Groq API (Llama 3.3 70B) — fast + free tier |
| Frontend | Next.js (App Router) + React + Tailwind CSS |
| Data validation | Pydantic v2 |
| Charts | Recharts (frontend) |
| Deployment | Backend → Railway or Render; Frontend → Vercel |
| Storage | Start with in-memory / local JSON for MVP; SQLite if time allows |

---

## 3. Repo Structure

```
ledgermind/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app entrypoint, CORS setup
│   │   ├── config.py                   # env vars, API keys, settings
│   │   ├── models/
│   │   │   └── schemas.py              # Pydantic models (Transaction, CategorizedTransaction, Report)
│   │   ├── agent/
│   │   │   ├── categorizer.py          # LLM categorization logic
│   │   │   ├── prompts.py              # System prompt + few-shot examples
│   │   │   └── llm_client.py           # Groq API wrapper
│   │   ├── data/
│   │   │   ├── synthetic_generator.py  # Generates realistic Razorpay-style CSV data
│   │   │   └── sample_settlements.csv  # Pre-generated sample dataset
│   │   ├── reports/
│   │   │   ├── aggregator.py           # P&L, category breakdowns, MoM trends
│   │   │   └── anomaly_detector.py     # Flags unusual spikes/drops
│   │   └── routes/
│   │       ├── upload.py               # POST /upload — accept CSV
│   │       ├── categorize.py           # POST /categorize — run agent on uploaded data
│   │       └── reports.py              # GET /reports/{id} — return aggregated reports
│   ├── tests/
│   │   └── test_categorizer.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx                    # Landing / upload page
│   │   ├── dashboard/page.tsx          # Main dashboard (table + charts)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── UploadCard.tsx
│   │   ├── TransactionTable.tsx
│   │   ├── CategoryBreakdownChart.tsx
│   │   ├── TrendChart.tsx
│   │   └── AnomalyAlert.tsx
│   ├── lib/
│   │   └── api.ts                      # fetch wrappers to backend
│   ├── package.json
│   └── tailwind.config.ts
├── docs/
│   ├── CHALLENGES.md                   # running log of issues + fixes (fill as you build)
│   └── architecture-diagram.png
├── data/
│   └── sample_settlements.csv          # shared sample dataset
├── README.md
└── .env.example
```

---

## 4. Data Schema

### Raw transaction (input CSV columns)

```
transaction_id     string   e.g. "txn_MZk3Xy9pQr"
date                date     e.g. "2026-07-14"
type                string   e.g. "payment", "refund", "payout", "fee", "chargeback", "tax"
amount              float    signed, in INR
description         string   free text — deliberately messy/ambiguous in places
counterparty        string   e.g. merchant name, bank name
status              string   e.g. "settled", "pending", "failed"
```

### Categorized transaction (agent output)

```json
{
  "transaction_id": "txn_MZk3Xy9pQr",
  "category": "Gateway Fees",
  "subcategory": "Payment Processing Fee",
  "confidence": 0.92,
  "reasoning": "Description references 'MDR' which is a standard payment gateway fee term",
  "needs_review": false
}
```

**Category taxonomy (start with these, expand as needed):**
`Revenue`, `Refunds`, `Gateway Fees`, `Payouts`, `Tax (GST/TDS)`, `Chargebacks`, `Settlements`, `Other/Uncategorized`

### Report output shape

```json
{
  "period": "2026-07",
  "pnl_summary": { "revenue": 0, "fees": 0, "refunds": 0, "net": 0 },
  "category_breakdown": [{ "category": "Revenue", "total": 0, "count": 0 }],
  "monthly_trend": [{ "month": "2026-06", "revenue": 0, "fees": 0 }],
  "anomalies": [{ "type": "fee_spike", "description": "...", "severity": "medium" }]
}
```

---

## 5. Backend Build Order (give OpenCode this sequence)

**Step 1 — Scaffolding**
- Set up FastAPI app with CORS enabled for frontend origin
- Set up `.env` handling for `GROQ_API_KEY`
- Health check endpoint `GET /health`

**Step 2 — Synthetic data generator**
- Generate 150-300 rows of realistic Razorpay-style settlement data
- Deliberately include ambiguous descriptions (e.g. "Adjustment - Ref #3391" that could be refund or chargeback) so the LLM's reasoning is actually tested, not just pattern-matched
- Output to `data/sample_settlements.csv`

**Step 3 — LLM categorization agent**
- `agent/prompts.py`: system prompt defining the category taxonomy + 5-8 few-shot examples covering edge cases
- `agent/categorizer.py`: takes a transaction (or small batch), calls LLM, parses structured JSON output using Pydantic validation, retries on malformed output
- Batch transactions in groups of ~10-20 per LLM call to control cost/latency (don't do one API call per row)

**Step 4 — Upload + categorize endpoints**
- `POST /upload` — accept CSV, validate schema, store in memory/session
- `POST /categorize` — run agent over uploaded rows, return categorized results
- Handle partial failures gracefully (if one batch fails, don't kill the whole job)

**Step 5 — Reporting logic**
- `reports/aggregator.py` — compute P&L, category breakdown, month-over-month trend from categorized data
- `reports/anomaly_detector.py` — simple statistical rule first (e.g. category total > 1.5x rolling average = flag), not LLM-based — keep this deterministic and explainable

**Step 6 — Tests**
- At least a handful of unit tests on the categorizer with known-answer transactions, and on the aggregator math

---

## 6. Frontend Build Order

**Step 1** — Landing page with CSV upload (drag-and-drop or file picker)
**Step 2** — Loading/progress state while categorization runs (this can take a few seconds — show it, don't hide it)
**Step 3** — Dashboard: transaction table with category, confidence, "needs review" flag highlighted
**Step 4** — Charts: category breakdown (pie/bar), monthly trend (line), anomaly alerts (banner/card)
**Step 5** — Polish: empty states, error states, responsive layout

---

## 7. Non-negotiable Design Principles (tell OpenCode to follow these)

1. **Structured output only.** Every LLM call must request and validate JSON against a Pydantic schema. Never parse free text with regex.
2. **Confidence + review flag.** Every categorization needs a confidence score; anything below a threshold (e.g. 0.7) gets `needs_review: true` and is visually flagged in the UI. This is what makes it "controller-grade" rather than a toy.
3. **Batch, don't loop per-row.** LLM calls are batched to control latency and cost.
4. **Anomaly detection is deterministic, not LLM-based.** Keep this rule/statistics-based so it's explainable and auditable — a real finance team would not accept "the AI said so" for anomaly flags.
5. **Keep `docs/CHALLENGES.md` updated continuously** — log every real bug/issue and its fix as it happens, not retroactively.
6. **No secrets committed.** API keys only via `.env`, `.env.example` checked in with placeholder values.

---

## 8. Environment Variables

```
# backend/.env
GROQ_API_KEY=your_key_here
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-url.vercel.app

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 9. Frontend Visual Design System — "The Audited Ledger"

**Concept:** The UI should feel like a real financial ledger being reviewed by an AI auditor — not a generic SaaS dashboard. Every design choice should reference actual finance-controller workflows (review, stamp, reconcile), not decorative fintech clichés (no generic blue gradients, no rounded-everything cards, no stock dashboard templates).

**Signature element — "Stamp Reveal":**
When categorization completes, each transaction row's category tag animates in with a slight rotation/ink-stamp effect (100-150ms, ease-out), revealing category + confidence % — mimicking an auditor physically stamping a ledger entry as reviewed. Low-confidence rows get a distinct "needs review" stamp state (outlined, not filled) instead of the solid "approved" stamp. This is the one bold visual moment — keep everything else disciplined and quiet around it.

**Color palette:**
| Token | Hex | Use |
|---|---|---|
| `bg-base` | `#0F1B2D` | Page background — deep ink navy, not pure black |
| `bg-surface` | `#16273D` | Cards, table surfaces |
| `text-primary` | `#EDEEF0` | Headers, primary content |
| `text-muted` | `#8B98A8` | Secondary text, captions |
| `accent-stamp` | `#C98A3E` | Primary actions, the stamp mark, active states (brass/ink-amber) |
| `state-verified` | `#4FA88F` | Reconciled/high-confidence rows |
| `state-anomaly` | `#C1553D` | Anomaly flags — used sparingly, alerts only |

**Typography:**
- Display/headers: **Space Grotesk** (geometric, confident — avoid default Inter for headers)
- Data/numbers/table cells: **JetBrains Mono** or **IBM Plex Mono** — tabular figures required so amounts align vertically like a real ledger column
- Body/UI: same sans family as display, regular weight

**Layout principles:**
- Transaction table uses hairline row dividers (like ledger paper), generous row height — not a cramped dense grid
- Stamp/category column is visually distinct, right-aligned, its own space — not squeezed into a badge
- Sidebar reads as a "chart of accounts" — category list with live running totals, not a generic nav menu
- Numbers are always right-aligned and monospaced; text is always left-aligned — never mix this up, it's what makes it read as a real financial document
- Dashboard charts (category breakdown, trend line) use the same palette — accent-stamp for primary series, state-verified/state-anomaly only where semantically correct

**Motion:** Restrained. The stamp-reveal on categorization is the one deliberate animation moment. Table row hover = subtle background lift only. No scroll-triggered animations, no decorative particle effects — those read as AI-generated and undercut the "serious finance tool" credibility this needs with Razorpay reviewers.

**What to explicitly avoid:** cream background + serif + terracotta (generic AI-design default), near-black + acid-green accent, rounded-corner-everything card grids, stock dashboard icon sets, generic "AI sparkle" iconography — none of this is what a finance controller's tool looks like, and reviewers who work in fintech will notice the difference between "looks like AI generated this" and "looks like a tool a finance team would actually trust."

---

## 10. Definition of Done (MVP)

- [ ] Synthetic dataset generated with realistic + ambiguous entries
- [ ] Upload → categorize → results flow works end-to-end locally
- [ ] Confidence scoring + needs-review flagging works
- [ ] P&L summary, category breakdown, and trend chart render correctly
- [ ] At least one anomaly detection rule fires correctly on test data
- [ ] Deployed: backend live on Railway/Render, frontend live on Vercel
- [ ] README with architecture diagram, setup instructions, and screenshots
- [ ] CHALLENGES.md has real, specific entries (not generic ones)
