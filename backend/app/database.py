import json
import logging
import os
from collections.abc import AsyncGenerator

import aiosqlite

from app.config import settings

logger = logging.getLogger(__name__)

SCHEMA_SQL = """
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

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS transactions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    transaction_id  TEXT NOT NULL,
    date            TEXT NOT NULL,
    type            TEXT NOT NULL,
    amount          REAL NOT NULL,
    description     TEXT NOT NULL,
    counterparty    TEXT NOT NULL,
    status          TEXT NOT NULL,
    UNIQUE(session_id, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_txn_session ON transactions(session_id);

CREATE TABLE IF NOT EXISTS categorizations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    transaction_id  TEXT NOT NULL,
    category        TEXT NOT NULL,
    subcategory     TEXT NOT NULL,
    confidence      REAL NOT NULL,
    reasoning       TEXT NOT NULL,
    needs_review    INTEGER NOT NULL,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_cat_session ON categorizations(session_id);

CREATE TABLE IF NOT EXISTS reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL UNIQUE REFERENCES sessions(session_id) ON DELETE CASCADE,
    period      TEXT,
    report_data TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_jobs_session ON jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id);
"""


async def init_db() -> None:
    """Create the database file and tables if they don't exist."""
    db_path = settings.database_path
    os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)

    async with aiosqlite.connect(db_path) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")
        await db.executescript(SCHEMA_SQL)
        await db.commit()
    logger.info(f"Database initialized at {db_path}")


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """FastAPI dependency that yields an aiosqlite connection."""
    db = await aiosqlite.connect(settings.database_path)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
    finally:
        await db.close()


# ── User Operations ───────────────────────────────────────────────────────────

async def create_user(db: aiosqlite.Connection, user_id: str, email: str, password_hash: str) -> None:
    """Insert a new user."""
    await db.execute(
        "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
        (user_id, email, password_hash),
    )
    await db.commit()


async def get_user_by_email(db: aiosqlite.Connection, email: str) -> dict | None:
    """Return a user by email, or None."""
    async with db.execute("SELECT * FROM users WHERE email = ?", (email,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            return None
        return dict(row)


async def get_user_by_id(db: aiosqlite.Connection, user_id: str) -> dict | None:
    """Return a user by ID, or None."""
    async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            return None
        return dict(row)


# ── Session Operations ────────────────────────────────────────────────────────

async def create_session(
    db: aiosqlite.Connection, session_id: str, user_id: str, filename: str, row_count: int
) -> None:
    """Insert a new session record."""
    await db.execute(
        "INSERT INTO sessions (session_id, user_id, filename, row_count) VALUES (?, ?, ?, ?)",
        (session_id, user_id, filename, row_count),
    )


async def session_exists(db: aiosqlite.Connection, session_id: str, user_id: str | None = None) -> bool:
    """Check if a session exists. If user_id provided, verify ownership."""
    if user_id:
        async with db.execute(
            "SELECT 1 FROM sessions WHERE session_id = ? AND user_id = ?", (session_id, user_id)
        ) as cursor:
            return await cursor.fetchone() is not None
    async with db.execute(
        "SELECT 1 FROM sessions WHERE session_id = ?", (session_id,)
    ) as cursor:
        return await cursor.fetchone() is not None


async def list_sessions(db: aiosqlite.Connection, user_id: str) -> list[dict]:
    """Return all sessions for a user with metadata."""
    async with db.execute(
        """SELECT s.session_id, s.filename, s.row_count, s.created_at,
                  j.status as categorization_status, j.progress, j.total_batches
           FROM sessions s
           LEFT JOIN jobs j ON s.session_id = j.session_id
           WHERE s.user_id = ?
           ORDER BY s.created_at DESC""",
        (user_id,),
    ) as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "session_id": row["session_id"],
                "filename": row["filename"],
                "row_count": row["row_count"],
                "created_at": row["created_at"],
                "categorization_status": row["categorization_status"] or "not_started",
                "progress": row["progress"] or 0,
                "total_batches": row["total_batches"] or 0,
            }
            for row in rows
        ]


async def delete_session(db: aiosqlite.Connection, session_id: str, user_id: str | None = None) -> bool:
    """Delete a session and all related data (cascades). Returns True if deleted."""
    if user_id:
        cursor = await db.execute(
            "DELETE FROM sessions WHERE session_id = ? AND user_id = ?", (session_id, user_id)
        )
    else:
        cursor = await db.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
    await db.commit()
    return cursor.rowcount > 0


# ── Transaction Operations ────────────────────────────────────────────────────

async def insert_transactions(
    db: aiosqlite.Connection, session_id: str, transactions: list[dict]
) -> None:
    """Bulk insert transactions for a session."""
    await db.executemany(
        """INSERT INTO transactions (session_id, transaction_id, date, type, amount, description, counterparty, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            (
                session_id,
                t["transaction_id"],
                str(t["date"]),
                str(t["type"]),
                t["amount"],
                t["description"],
                t["counterparty"],
                str(t["status"]),
            )
            for t in transactions
        ],
    )
    await db.commit()


async def get_transactions(db: aiosqlite.Connection, session_id: str) -> list[dict]:
    """Return all transactions for a session."""
    async with db.execute(
        "SELECT transaction_id, date, type, amount, description, counterparty, status "
        "FROM transactions WHERE session_id = ? ORDER BY date",
        (session_id,),
    ) as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "transaction_id": row["transaction_id"],
                "date": row["date"],
                "type": row["type"],
                "amount": row["amount"],
                "description": row["description"],
                "counterparty": row["counterparty"],
                "status": row["status"],
            }
            for row in rows
        ]


# ── Categorization Operations ─────────────────────────────────────────────────

async def insert_categorizations(
    db: aiosqlite.Connection, session_id: str, results: list[dict]
) -> None:
    """Bulk insert or replace categorization results."""
    await db.executemany(
        """INSERT OR REPLACE INTO categorizations
           (session_id, transaction_id, category, subcategory, confidence, reasoning, needs_review)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [
            (
                session_id,
                r["transaction_id"],
                r["category"],
                r["subcategory"],
                r["confidence"],
                r["reasoning"],
                1 if r["needs_review"] else 0,
            )
            for r in results
        ],
    )
    await db.commit()


async def get_categorizations(db: aiosqlite.Connection, session_id: str) -> list[dict]:
    """Return categorizations for a session (without original transaction fields)."""
    async with db.execute(
        "SELECT transaction_id, category, subcategory, confidence, reasoning, needs_review "
        "FROM categorizations WHERE session_id = ?",
        (session_id,),
    ) as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "transaction_id": row["transaction_id"],
                "category": row["category"],
                "subcategory": row["subcategory"],
                "confidence": row["confidence"],
                "reasoning": row["reasoning"],
                "needs_review": bool(row["needs_review"]),
            }
            for row in rows
        ]


async def get_categorizations_joined(db: aiosqlite.Connection, session_id: str) -> list[dict]:
    """Return categorizations joined with original transaction fields (for frontend display)."""
    async with db.execute(
        """SELECT c.transaction_id, c.category, c.subcategory, c.confidence,
                  c.reasoning, c.needs_review,
                  t.date, t.amount, t.type, t.description, t.counterparty, t.status
           FROM categorizations c
           JOIN transactions t ON c.session_id = t.session_id AND c.transaction_id = t.transaction_id
           WHERE c.session_id = ?
           ORDER BY t.date""",
        (session_id,),
    ) as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "transaction_id": row["transaction_id"],
                "category": row["category"],
                "subcategory": row["subcategory"],
                "confidence": row["confidence"],
                "reasoning": row["reasoning"],
                "needs_review": bool(row["needs_review"]),
                "date": row["date"],
                "amount": row["amount"],
                "type": row["type"],
                "description": row["description"],
                "counterparty": row["counterparty"],
                "status": row["status"],
            }
            for row in rows
        ]


async def categorization_exists(db: aiosqlite.Connection, session_id: str) -> bool:
    """Check if categorizations exist for a session."""
    async with db.execute(
        "SELECT 1 FROM categorizations WHERE session_id = ? LIMIT 1", (session_id,)
    ) as cursor:
        return await cursor.fetchone() is not None


# ── Report Operations ─────────────────────────────────────────────────────────

async def save_report(
    db: aiosqlite.Connection, session_id: str, period: str, report_data: dict
) -> None:
    """Save a report as JSON. Replaces existing report for the session."""
    await db.execute(
        "INSERT OR REPLACE INTO reports (session_id, period, report_data) VALUES (?, ?, ?)",
        (session_id, period, json.dumps(report_data)),
    )
    await db.commit()


async def get_report(db: aiosqlite.Connection, session_id: str) -> dict | None:
    """Return a report parsed from JSON, or None if not found."""
    async with db.execute(
        "SELECT period, report_data FROM reports WHERE session_id = ?", (session_id,)
    ) as cursor:
        row = await cursor.fetchone()
        if not row:
            return None
        return {"period": row["period"], **json.loads(row["report_data"])}


# ── Job Operations ────────────────────────────────────────────────────────────

async def create_job(
    db: aiosqlite.Connection, job_id: str, session_id: str, user_id: str, total_batches: int
) -> None:
    """Create a new categorization job."""
    await db.execute(
        """INSERT INTO jobs (job_id, session_id, user_id, status, total_batches)
           VALUES (?, ?, ?, 'pending', ?)""",
        (job_id, session_id, user_id, total_batches),
    )
    await db.commit()


async def update_job_status(
    db: aiosqlite.Connection,
    job_id: str,
    status: str,
    progress: int | None = None,
    categorized_count: int | None = None,
    needs_review_count: int | None = None,
    error_message: str | None = None,
) -> None:
    """Update job status and progress."""
    sets = ["status = ?"]
    params: list = [status]

    if progress is not None:
        sets.append("progress = ?")
        params.append(progress)
    if categorized_count is not None:
        sets.append("categorized_count = ?")
        params.append(categorized_count)
    if needs_review_count is not None:
        sets.append("needs_review_count = ?")
        params.append(needs_review_count)
    if error_message is not None:
        sets.append("error_message = ?")
        params.append(error_message)
    if status in ("completed", "failed"):
        sets.append("completed_at = datetime('now')")

    params.append(job_id)
    await db.execute(f"UPDATE jobs SET {', '.join(sets)} WHERE job_id = ?", params)
    await db.commit()


async def get_job(db: aiosqlite.Connection, job_id: str) -> dict | None:
    """Return job status and metadata."""
    async with db.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            return None
        return dict(row)


async def get_active_job_for_session(db: aiosqlite.Connection, session_id: str) -> dict | None:
    """Check if there's an active (pending/in_progress) job for a session."""
    async with db.execute(
        "SELECT * FROM jobs WHERE session_id = ? AND status IN ('pending', 'in_progress') LIMIT 1",
        (session_id,),
    ) as cursor:
        row = await cursor.fetchone()
        if not row:
            return None
        return dict(row)
