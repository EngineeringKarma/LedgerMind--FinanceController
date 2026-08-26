import csv
import io
import uuid
import logging
from datetime import date

from fastapi import APIRouter, Depends, File, UploadFile
import aiosqlite

from app.auth import get_current_user
from app.config import settings
from app.models.schemas import (
    Transaction,
    TransactionType,
    TransactionStatus,
    UploadResponse,
)
from app.database import get_db, create_session, insert_transactions, get_transactions, session_exists
from app.errors import CSVParseError, SessionNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter(tags=["upload"])


def parse_csv(content: bytes) -> list[dict]:
    """Parse CSV content into transaction dicts with validation and flexible parsing."""
    text = content.decode("utf-8")
    lines = text.splitlines()
    if not lines:
        raise CSVParseError("Empty CSV file")

    # Standardize headers (lower, strip whitespace)
    reader = csv.reader(io.StringIO(lines[0]))
    original_headers = next(reader, [])
    clean_headers = [h.strip().lower().replace(" ", "_") for h in original_headers]
    
    # Map common alternates
    for i, h in enumerate(clean_headers):
        if h in ("amt", "value"): clean_headers[i] = "amount"
        elif h in ("desc", "particulars", "memo"): clean_headers[i] = "description"
        elif h in ("txn_id", "id", "reference"): clean_headers[i] = "transaction_id"

    # Reconstruct text with clean headers
    lines[0] = ",".join(clean_headers)
    dict_reader = csv.DictReader(io.StringIO("\n".join(lines)))

    transactions = []
    errors = []

    for i, row in enumerate(dict_reader, start=2):
        try:
            # Provide defaults for missing columns
            txn_id = row.get("transaction_id") or uuid.uuid4().hex[:12]
            txn_date = row.get("date") or str(date.today())
            txn_desc = row.get("description") or "Unknown Transaction"
            txn_amount = float(row.get("amount") or 0.0)
            txn_type = str(row.get("type") or "payment").strip().lower()
            txn_status = str(row.get("status") or "settled").strip().lower()
            txn_party = row.get("counterparty") or "Unknown"

            # Validate via Pydantic
            txn = Transaction(
                transaction_id=txn_id,
                date=txn_date,
                type=txn_type,
                amount=txn_amount,
                description=txn_desc,
                counterparty=txn_party,
                status=txn_status
            )
            transactions.append(txn.model_dump(mode="json"))
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    if errors and not transactions:
        raise CSVParseError(f"All rows failed validation: {'; '.join(errors[:5])}")

    return transactions


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Upload a CSV file of transactions. Returns a session ID for subsequent categorization."""
    if not file.filename.endswith(".csv"):
        raise CSVParseError("File must be a CSV")

    content = await file.read()
    max_size = settings.upload_max_size_mb * 1024 * 1024
    if len(content) > max_size:
        raise CSVParseError(f"File too large (max {settings.upload_max_size_mb}MB)")

    try:
        transactions = parse_csv(content)
    except CSVParseError:
        raise
    except Exception as e:
        raise CSVParseError(f"Failed to parse CSV: {str(e)}")

    session_id = str(uuid.uuid4())[:8]
    user_id = current_user["id"]

    # Store in SQLite within a transaction
    await db.execute("BEGIN")
    try:
        await create_session(db, session_id, user_id, file.filename, len(transactions))
        await insert_transactions(db, session_id, transactions)
        await db.commit()
    except Exception:
        await db.execute("ROLLBACK")
        raise

    logger.info(f"User {user_id} uploaded {file.filename} ({len(transactions)} txns) -> session {session_id}")
    return UploadResponse(session_id=session_id, transaction_count=len(transactions))


@router.get("/upload/{session_id}/transactions")
async def get_session_transactions(
    session_id: str,
    db: aiosqlite.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve stored transactions for a session."""
    if not await session_exists(db, session_id, current_user["id"]):
        raise SessionNotFoundError(session_id)

    transactions = await get_transactions(db, session_id)
    return {"session_id": session_id, "transactions": transactions}
