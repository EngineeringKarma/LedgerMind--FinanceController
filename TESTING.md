# LedgerMind — Testing Guide

## Prerequisites

- Python 3.11+
- Install backend dependencies:
  ```bash
  cd backend
  pip install -r requirements.txt
  ```

## Running Tests

```bash
cd backend

# Run all tests
python -m pytest tests/ -v

# Run a single test file
python -m pytest tests/test_auth.py -v

# Run with coverage report
python -m pytest tests/ --cov=app --cov-report=term-missing

# Run a specific test class
python -m pytest tests/test_auth.py::TestLogin -v
```

## Test Structure

| File | Tests | Coverage |
|------|-------|----------|
| `conftest.py` | — | Shared fixtures: test DB, auth headers, async client, seeded sessions |
| `test_categorizer.py` | 15 | P&L computation, category breakdown, monthly trends, anomaly detection |
| `test_database.py` | 18 | SQLite CRUD: users, sessions, transactions, categorizations, reports, jobs |
| `test_auth.py` | 16 | Password hashing, JWT tokens, register/login/me routes |
| `test_error_handling.py` | 9 | Exception → HTTP status mapping, response shape validation |
| `test_jobs.py` | 8 | Categorize endpoint, job status polling, duplicate conflict, auth |
| `test_worker.py` | 3 | Background worker: success, no-transactions, LLM failure |

**Total: 69 tests**

## Auth Flow

```bash
# 1. Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'

# Response: {"access_token": "eyJ...", "token_type": "bearer", "user_id": "...", "email": "..."}

# 2. Use token for protected endpoints
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer eyJ..."
```

## Background Job API

```bash
# Start categorization (returns 202)
curl -X POST http://localhost:8000/categorize/{session_id} \
  -H "Authorization: Bearer eyJ..."

# Response: {"job_id": "abc123", "status": "pending", "session_id": "..."}

# Poll job status
curl http://localhost:8000/jobs/abc123 \
  -H "Authorization: Bearer eyJ..."

# Response includes: status, progress, categorized_count, needs_review_count
# When status="completed", results are included in the response
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_API_KEY` | `""` | API key for LLM calls (NVIDIA NIM) |
| `LLM_BASE_URL` | `https://integrate.api.nvidia.com/v1` | LLM API base URL |
| `LLM_MODEL` | `meta/llama-3.3-70b-instruct` | LLM model name |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `JWT_SECRET_KEY` | `ledgermind-dev-secret-change-in-production` | Secret for JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token expiry in minutes |
| `DATABASE_PATH` | `data/ledgermind.db` | SQLite database file path |
| `LLM_BATCH_SIZE` | `15` | Transactions per LLM batch |
| `LLM_MAX_RETRIES` | `3` | Max retries for LLM calls |
| `UPLOAD_MAX_SIZE_MB` | `10` | Max upload file size |

## Design Decisions

- **aiosqlite** chosen over SQLAlchemy for lightweight async SQLite access with raw SQL
- **bcrypt==4.0.1** pinned for passlib compatibility (bcrypt 5.x breaks passlib)
- **Tenacity** for LLM retry with exponential backoff (2s-30s wait, 3 retries)
- **Background tasks** via FastAPI's `BackgroundTasks` for non-blocking categorization
- **OpenAI SDK** used for LLM calls (compatible with NVIDIA NIM, Groq, and other providers)
- **Worker** is an async function compatible with FastAPI's BackgroundTasks
