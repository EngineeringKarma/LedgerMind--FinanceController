import pytest
import aiosqlite
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import init_db, create_user, create_session, insert_transactions
from app.auth import hash_password, create_access_token

TEST_USER_ID = "test_user_001"
TEST_USER_EMAIL = "test@ledgermind.com"
TEST_USER_PASSWORD = "testpass123"


@pytest.fixture
async def test_db(tmp_path):
    """Create a temporary SQLite database with schema for testing."""
    db_path = str(tmp_path / "test.db")

    import app.database as db_module
    original_path = db_module.settings.database_path
    db_module.settings.database_path = db_path

    await init_db()

    db = await aiosqlite.connect(db_path)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys=ON")

    await create_user(db, TEST_USER_ID, TEST_USER_EMAIL, hash_password(TEST_USER_PASSWORD))

    yield db

    await db.close()
    db_module.settings.database_path = original_path


@pytest.fixture
async def client(test_db):
    """Async test client with DB dependency overridden to use test_db."""
    async def override_get_db():
        yield test_db

    app.dependency_overrides.clear()
    app.dependency_overrides[__import__("app.database", fromlist=["get_db"]).get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    """Valid JWT authorization headers."""
    token = create_access_token(TEST_USER_ID, TEST_USER_EMAIL)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def invalid_auth_headers():
    """Invalid JWT authorization headers."""
    return {"Authorization": "Bearer invalid.token.here"}


@pytest.fixture
async def seeded_session(test_db):
    """Create a session with sample transactions. Returns session_id."""
    session_id = "sess_test01"
    await create_session(test_db, session_id, TEST_USER_ID, "test.csv", 3)
    transactions = [
        {
            "transaction_id": "txn_001",
            "date": "2026-07-01",
            "type": "payment",
            "amount": 10000.0,
            "description": "Payment",
            "counterparty": "Flipkart",
            "status": "settled",
        },
        {
            "transaction_id": "txn_002",
            "date": "2026-07-05",
            "type": "payment",
            "amount": 15000.0,
            "description": "Payment",
            "counterparty": "Zomato",
            "status": "settled",
        },
        {
            "transaction_id": "txn_003",
            "date": "2026-07-10",
            "type": "fee",
            "amount": -200.0,
            "description": "MDR",
            "counterparty": "Razorpay",
            "status": "settled",
        },
    ]
    await insert_transactions(test_db, session_id, transactions)
    await test_db.commit()
    return session_id


@pytest.fixture
async def empty_session(test_db):
    """Create a session with zero transactions. Returns session_id."""
    session_id = "sess_empty01"
    await create_session(test_db, session_id, TEST_USER_ID, "empty.csv", 0)
    await test_db.commit()
    return session_id
