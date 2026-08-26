# LedgerMind — AI Finance Controller

An AI agent that ingests Razorpay-style settlement data, categorizes each transaction using an LLM, and auto-generates finance controller reports.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com/) (free tier available)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Generate sample data
python -m app.data.synthetic_generator

# Run tests
python -m pytest tests/ -v

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Upload** — Drop a Razorpay-style settlement CSV into the upload card
2. **Categorize** — The AI agent processes transactions in batches of 15, using Llama 3.3 70B via Groq
3. **Review** — Dashboard shows categorized transactions with confidence scores and "needs review" flags
4. **Analyze** — P&L summary, category breakdown charts, monthly trends, and anomaly detection

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload` | Upload CSV file |
| GET | `/upload/{session_id}/transactions` | Get raw transactions |
| POST | `/categorize/{session_id}` | Run LLM categorization |
| GET | `/categorize/{session_id}/results` | Get categorized results |
| POST | `/reports/generate/{session_id}` | Generate P&L report |
| GET | `/reports/{session_id}` | Retrieve report |

## CSV Format

```
transaction_id,date,type,amount,description,counterparty,status
txn_MZk3Xy9pQr,2026-07-14,payment,15000.00,"Payment received for order #4421",Flipkart Online Services Pvt Ltd,settled
```

**Required columns:** `transaction_id`, `date`, `type`, `amount`, `description`, `counterparty`, `status`

**Valid types:** `payment`, `refund`, `payout`, `fee`, `chargeback`, `tax`

## Category Taxonomy

| Category | Subcategories |
|----------|---------------|
| Revenue | Subscription Revenue, Service Revenue, Product Sales, Affiliate Revenue |
| Refunds | Full Refund, Partial Refund, Goodwill Credit, Processing Fee Refund |
| Gateway Fees | Payment Processing Fee (MDR), Platform Fee, Settlement Fee, Chargeback Fee |
| Payouts | Merchant Payout, Bulk Settlement, Instant Payout, T+1 Settlement |
| Tax (GST/TDS) | GST Collected, TDS Deducted, TCS Collected, GST Remittance |
| Chargebacks | Chargeback Received, Chargeback Won, Chargeback Lost, Representment |
| Settlements | Settlement Adjustment, Reconciliation Entry, Batch Settlement |
| Other/Uncategorized | Unclassified Transaction, Manual Review Required |

## Design System — "The Audited Ledger"

The UI is designed to feel like a real financial ledger being reviewed by an AI auditor.

- **Colors:** Deep ink navy base (`#0F1B2D`), brass/amber accent (`#C98A3E`), verified green (`#4FA88F`), anomaly red (`#C1553D`)
- **Typography:** Space Grotesk for headers, JetBrains Mono for data/numbers
- **Signature:** "Stamp Reveal" animation on categorization — each row's status animates in with a slight rotation/ink-stamp effect

## Architecture

```
Frontend (Next.js)  →  Backend (FastAPI)  →  Groq API (Llama 3.3 70B)
     :3000                  :8000
```

- **In-memory session storage** — uploaded data and categorized results stored in Python dicts (MVP)
- **Batch processing** — 15 transactions per LLM call to balance cost and latency
- **Deterministic anomaly detection** — rule/statistics-based, not LLM-based, for auditability
- **Graceful degradation** — if a batch fails, those transactions are marked `needs_review: true` instead of failing the entire job

## Tech Stack

- **Backend:** Python 3.11, FastAPI, Pydantic v2, Groq SDK
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Recharts
- **LLM:** Llama 3.3 70B via Groq API (fast + free tier)
- **Charts:** Recharts (pie/bar for categories, line for trends)
