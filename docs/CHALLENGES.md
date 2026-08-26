# LedgerMind — Challenges & Fixes

A running log of issues encountered during development and their solutions.

---

## 2026-08-24 — Initial Build

### 1. Pydantic v2 + pydantic-settings import
**Issue:** `BaseSettings` moved from `pydantic` to `pydantic-settings` in v2.
**Fix:** Install `pydantic-settings` and import from `pydantic_settings`.

### 2. Groq API structured output
**Issue:** Need to ensure LLM returns valid JSON for categorization.
**Fix:** Use `response_format={"type": "json_object"}` in Groq API call + Pydantic validation on the response. If output is malformed, retry with a fallback entry marked `needs_review: true`.

### 3. Batch processing vs per-row API calls
**Issue:** Calling the LLM once per transaction is expensive and slow.
**Fix:** Batch 15 transactions per API call. Build few-shot examples in system prompt, then append the batch as a single user message. Parse the array response.

### 4. Ambiguous transaction descriptions
**Issue:** Descriptions like "Adjustment - Ref #3391" could be refund, chargeback, or settlement correction.
**Fix:** This is by design — the LLM reasons through context (transaction type, amount, counterparty) and assigns confidence < 0.7 when uncertain. These get flagged `needs_review: true`.

### 5. Tailwind v4 CSS-based config
**Issue:** Next.js 16 ships with Tailwind v4 which uses `@theme inline` in CSS instead of `tailwind.config.ts`.
**Fix:** All design tokens defined in `globals.css` using `@theme inline { --color-*: ... }` syntax.

### 6. useSearchParams() Suspense boundary
**Issue:** Next.js 16 requires `useSearchParams()` to be wrapped in a `<Suspense>` boundary for static generation.
**Fix:** Split dashboard into `page.tsx` (wrapper with Suspense) and `DashboardContent.tsx` (actual component using useSearchParams).

### 7. Anomaly detector false positives on small datasets
**Issue:** With only 2 months of data, the rolling average is unstable — a single higher month triggers a spike alert.
**Fix:** Added minimum data requirement (2+ months) before computing rolling averages. Outlier detection uses category-level averaging across all transactions.

### 8. In-memory session storage
**Issue:** MVP uses in-memory dicts for session storage — data lost on server restart.
**Fix:** Migrated to SQLite with aiosqlite for async persistence. All data (sessions, transactions, categorizations, reports) now survives server restarts.

### 9. No user authentication
**Issue:** MVP had no authentication — all endpoints were open.
**Fix:** Added JWT authentication with bcrypt password hashing. All data endpoints are user-scoped. Registration and login endpoints added.

---

## Known Limitations (MVP)
- No real-time progress during categorization (batch calls happen synchronously in the background worker)
- Single-user mode per token; no role-based access control
