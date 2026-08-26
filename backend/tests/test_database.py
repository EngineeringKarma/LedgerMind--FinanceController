import pytest
import aiosqlite
import os

from app.database import (
    init_db,
    create_user,
    create_session,
    insert_transactions,
    get_transactions,
    session_exists,
    insert_categorizations,
    get_categorizations,
    get_categorizations_joined,
    categorization_exists,
    save_report,
    get_report,
    list_sessions,
    delete_session,
)
from app.auth import hash_password


# ── Test Fixtures ─────────────────────────────────────────────────────────────

TEST_USER_ID = "test_user_001"
TEST_USER_EMAIL = "test@ledgermind.com"


@pytest.fixture
async def test_db(tmp_path):
    """Create a temporary SQLite database for testing."""
    db_path = str(tmp_path / "test.db")

    import app.database as db_module
    original_path = db_module.settings.database_path
    db_module.settings.database_path = db_path

    await init_db()

    db = await aiosqlite.connect(db_path)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys=ON")

    # Create a test user
    await create_user(db, TEST_USER_ID, TEST_USER_EMAIL, hash_password("testpass123"))

    yield db

    await db.close()
    db_module.settings.database_path = original_path


SAMPLE_TRANSACTIONS = [
    {"transaction_id": "txn_001", "date": "2026-07-01", "type": "payment", "amount": 10000.0, "description": "Payment", "counterparty": "Flipkart", "status": "settled"},
    {"transaction_id": "txn_002", "date": "2026-07-05", "type": "payment", "amount": 15000.0, "description": "Payment", "counterparty": "Zomato", "status": "settled"},
    {"transaction_id": "txn_003", "date": "2026-07-10", "type": "fee", "amount": -200.0, "description": "MDR", "counterparty": "Razorpay", "status": "settled"},
]

SAMPLE_CATEGORIZATIONS = [
    {"transaction_id": "txn_001", "category": "Revenue", "subcategory": "Product Sales", "confidence": 0.9, "reasoning": "test", "needs_review": False},
    {"transaction_id": "txn_002", "category": "Revenue", "subcategory": "Product Sales", "confidence": 0.9, "reasoning": "test", "needs_review": False},
    {"transaction_id": "txn_003", "category": "Gateway Fees", "subcategory": "MDR", "confidence": 0.95, "reasoning": "test", "needs_review": False},
]


# ── User Tests ────────────────────────────────────────────────────────────────

class TestUserOperations:
    async def test_create_user(self, test_db):
        from app.database import get_user_by_email
        user = await get_user_by_email(test_db, TEST_USER_EMAIL)
        assert user is not None
        assert user["id"] == TEST_USER_ID
        assert user["email"] == TEST_USER_EMAIL


# ── Session Tests ─────────────────────────────────────────────────────────────

class TestSessionOperations:
    async def test_create_session(self, test_db):
        await create_session(test_db, "abc12345", TEST_USER_ID, "test.csv", 3)
        assert await session_exists(test_db, "abc12345", TEST_USER_ID)

    async def test_session_not_found(self, test_db):
        assert not await session_exists(test_db, "nonexistent", TEST_USER_ID)

    async def test_list_sessions(self, test_db):
        await create_session(test_db, "s1", TEST_USER_ID, "a.csv", 10)
        await create_session(test_db, "s2", TEST_USER_ID, "b.csv", 20)
        sessions = await list_sessions(test_db, TEST_USER_ID)
        assert len(sessions) == 2
        ids = {s["session_id"] for s in sessions}
        assert ids == {"s1", "s2"}

    async def test_delete_session_cascades(self, test_db):
        await create_session(test_db, "del1", TEST_USER_ID, "del.csv", 2)
        await insert_transactions(test_db, "del1", SAMPLE_TRANSACTIONS[:2])
        await insert_categorizations(test_db, "del1", SAMPLE_CATEGORIZATIONS[:2])

        deleted = await delete_session(test_db, "del1", TEST_USER_ID)
        assert deleted is True
        assert not await session_exists(test_db, "del1", TEST_USER_ID)
        assert not await categorization_exists(test_db, "del1")

        txns = await get_transactions(test_db, "del1")
        assert len(txns) == 0

    async def test_delete_nonexistent(self, test_db):
        deleted = await delete_session(test_db, "ghost", TEST_USER_ID)
        assert deleted is False


# ── Transaction Tests ─────────────────────────────────────────────────────────

class TestTransactionOperations:
    async def test_insert_and_get(self, test_db):
        await create_session(test_db, "t1", TEST_USER_ID, "test.csv", 3)
        await insert_transactions(test_db, "t1", SAMPLE_TRANSACTIONS)

        txns = await get_transactions(test_db, "t1")
        assert len(txns) == 3
        assert txns[0]["transaction_id"] == "txn_001"
        assert txns[0]["amount"] == 10000.0

    async def test_get_empty_session(self, test_db):
        await create_session(test_db, "t2", TEST_USER_ID, "empty.csv", 0)
        txns = await get_transactions(test_db, "t2")
        assert len(txns) == 0


# ── Categorization Tests ──────────────────────────────────────────────────────

class TestCategorizationOperations:
    async def test_insert_and_get_categorizations(self, test_db):
        await create_session(test_db, "c1", TEST_USER_ID, "test.csv", 3)
        await insert_transactions(test_db, "c1", SAMPLE_TRANSACTIONS)
        await insert_categorizations(test_db, "c1", SAMPLE_CATEGORIZATIONS)

        cats = await get_categorizations(test_db, "c1")
        assert len(cats) == 3
        assert cats[0]["category"] == "Revenue"
        assert cats[0]["needs_review"] is False

    async def test_categorization_exists(self, test_db):
        await create_session(test_db, "c2", TEST_USER_ID, "test.csv", 1)
        assert not await categorization_exists(test_db, "c2")

        await insert_categorizations(test_db, "c2", SAMPLE_CATEGORIZATIONS[:1])
        assert await categorization_exists(test_db, "c2")

    async def test_joined_query(self, test_db):
        await create_session(test_db, "j1", TEST_USER_ID, "test.csv", 3)
        await insert_transactions(test_db, "j1", SAMPLE_TRANSACTIONS)
        await insert_categorizations(test_db, "j1", SAMPLE_CATEGORIZATIONS)

        joined = await get_categorizations_joined(test_db, "j1")
        assert len(joined) == 3
        assert "category" in joined[0]
        assert "date" in joined[0]
        assert "amount" in joined[0]
        assert "counterparty" in joined[0]

    async def test_upsert_categorizations(self, test_db):
        await create_session(test_db, "u1", TEST_USER_ID, "test.csv", 1)
        await insert_transactions(test_db, "u1", SAMPLE_TRANSACTIONS[:1])

        await insert_categorizations(test_db, "u1", SAMPLE_CATEGORIZATIONS[:1])
        cats = await get_categorizations(test_db, "u1")
        assert len(cats) == 1

        updated = [{**SAMPLE_CATEGORIZATIONS[0], "confidence": 0.99}]
        await insert_categorizations(test_db, "u1", updated)
        cats = await get_categorizations(test_db, "u1")
        assert len(cats) == 1
        assert cats[0]["confidence"] == 0.99


# ── Report Tests ──────────────────────────────────────────────────────────────

class TestReportOperations:
    async def test_save_and_get_report(self, test_db):
        await create_session(test_db, "r1", TEST_USER_ID, "test.csv", 3)

        report_data = {
            "pnl_summary": {"revenue": 25000, "fees": -200, "refunds": 0, "tax": 0, "chargebacks": 0, "net": 24800},
            "category_breakdown": [{"category": "Revenue", "total": 25000, "count": 2}],
            "monthly_trend": [{"month": "2026-07", "revenue": 25000, "fees": -200, "refunds": 0, "tax": 0, "chargebacks": 0, "net": 24800}],
            "anomalies": [],
        }

        await save_report(test_db, "r1", "2026-07", report_data)

        report = await get_report(test_db, "r1")
        assert report is not None
        assert report["period"] == "2026-07"
        assert report["pnl_summary"]["revenue"] == 25000

    async def test_get_nonexistent_report(self, test_db):
        report = await get_report(test_db, "ghost")
        assert report is None

    async def test_upsert_report(self, test_db):
        await create_session(test_db, "r2", TEST_USER_ID, "test.csv", 3)

        report_v1 = {"pnl_summary": {"revenue": 100}, "category_breakdown": [], "monthly_trend": [], "anomalies": []}
        report_v2 = {"pnl_summary": {"revenue": 200}, "category_breakdown": [], "monthly_trend": [], "anomalies": []}

        await save_report(test_db, "r2", "v1", report_v1)
        await save_report(test_db, "r2", "v2", report_v2)

        report = await get_report(test_db, "r2")
        assert report["period"] == "v2"
        assert report["pnl_summary"]["revenue"] == 200


# ── Job Tests ─────────────────────────────────────────────────────────────────

class TestJobOperations:
    async def test_create_and_get_job(self, test_db):
        from app.database import create_job, get_job, update_job_status

        await create_session(test_db, "j1", TEST_USER_ID, "test.csv", 3)
        await create_job(test_db, "job_001", "j1", TEST_USER_ID, 5)

        job = await get_job(test_db, "job_001")
        assert job is not None
        assert job["status"] == "pending"
        assert job["total_batches"] == 5

    async def test_update_job_status(self, test_db):
        from app.database import create_job, get_job, update_job_status

        await create_session(test_db, "j2", TEST_USER_ID, "test.csv", 3)
        await create_job(test_db, "job_002", "j2", TEST_USER_ID, 3)

        await update_job_status(test_db, "job_002", "in_progress", progress=1)
        job = await get_job(test_db, "job_002")
        assert job["status"] == "in_progress"
        assert job["progress"] == 1

        await update_job_status(test_db, "job_002", "completed", categorized_count=10, needs_review_count=2)
        job = await get_job(test_db, "job_002")
        assert job["status"] == "completed"
        assert job["categorized_count"] == 10
        assert job["completed_at"] is not None

    async def test_get_active_job(self, test_db):
        from app.database import create_job, get_active_job_for_session, update_job_status

        await create_session(test_db, "j3", TEST_USER_ID, "test.csv", 3)
        await create_job(test_db, "job_003", "j3", TEST_USER_ID, 2)

        active = await get_active_job_for_session(test_db, "j3")
        assert active is not None
        assert active["job_id"] == "job_003"

        # Complete the job — should no longer be active
        await update_job_status(test_db, "job_003", "completed")
        active = await get_active_job_for_session(test_db, "j3")
        assert active is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
