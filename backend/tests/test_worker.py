import pytest
import aiosqlite
from unittest.mock import patch

from app.database import create_job, get_job, insert_transactions, create_session
from app.worker import run_categorization_job
from app.models.schemas import CategorizedTransaction
from app.config import settings

TEST_USER_ID = "test_user_001"


@pytest.fixture
async def job_with_session(test_db):
    """Create a session, insert transactions, and create a job. Returns (job_id, session_id)."""
    session_id = "sess_worker01"
    job_id = "job_worker01"
    await create_session(test_db, session_id, TEST_USER_ID, "worker_test.csv", 2)
    transactions = [
        {
            "transaction_id": "txn_w01",
            "date": "2026-07-01",
            "type": "payment",
            "amount": 5000.0,
            "description": "Payment",
            "counterparty": "Flipkart",
            "status": "settled",
        },
        {
            "transaction_id": "txn_w02",
            "date": "2026-07-05",
            "type": "fee",
            "amount": -100.0,
            "description": "MDR",
            "counterparty": "Razorpay",
            "status": "settled",
        },
    ]
    await insert_transactions(test_db, session_id, transactions)
    await create_job(test_db, job_id, session_id, TEST_USER_ID, total_batches=1)
    await test_db.commit()
    return job_id, session_id


class TestWorkerSuccess:
    async def test_worker_success(self, test_db, job_with_session, monkeypatch):
        job_id, session_id = job_with_session

        mock_results = [
            CategorizedTransaction(
                transaction_id="txn_w01",
                category="Revenue",
                subcategory="Product Sales",
                confidence=0.9,
                reasoning="Payment from Flipkart",
                needs_review=False,
            ),
            CategorizedTransaction(
                transaction_id="txn_w02",
                category="Gateway Fees",
                subcategory="Payment Processing Fee (MDR)",
                confidence=0.95,
                reasoning="Fee from Razorpay",
                needs_review=False,
            ),
        ]

        import app.database as db_module
        monkeypatch.setattr(db_module.settings, "database_path", db_module.settings.database_path)

        with patch("app.worker.categorize_all", return_value=mock_results):
            await run_categorization_job(job_id, session_id)

        job = await get_job(test_db, job_id)
        assert job["status"] == "completed"
        assert job["categorized_count"] == 2
        assert job["needs_review_count"] == 0


class TestWorkerFailure:
    async def test_worker_no_transactions(self, test_db, monkeypatch):
        session_id = "sess_empty_worker"
        job_id = "job_empty_worker"
        await create_session(test_db, session_id, TEST_USER_ID, "empty.csv", 0)
        await create_job(test_db, job_id, session_id, TEST_USER_ID, total_batches=1)
        await test_db.commit()

        import app.database as db_module
        monkeypatch.setattr(db_module.settings, "database_path", db_module.settings.database_path)

        await run_categorization_job(job_id, session_id)

        job = await get_job(test_db, job_id)
        assert job["status"] == "failed"
        assert "No transactions" in job["error_message"]

    async def test_worker_llm_exception(self, test_db, job_with_session, monkeypatch):
        job_id, session_id = job_with_session

        import app.database as db_module
        monkeypatch.setattr(db_module.settings, "database_path", db_module.settings.database_path)

        with patch("app.worker.categorize_all", side_effect=RuntimeError("LLM API timeout")):
            await run_categorization_job(job_id, session_id)

        job = await get_job(test_db, job_id)
        assert job["status"] == "failed"
        assert "LLM API timeout" in job["error_message"]
