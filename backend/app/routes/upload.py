import csv
import io
import uuid
from datetime import date

from fastapi import APIRouter, File, UploadFile, HTTPException

from app.models.schemas import (
    Transaction,
    TransactionType,
    TransactionStatus,
    UploadResponse,
)
from app.store import sessions

router = APIRouter(tags=["upload"])


def parse_csv(content: bytes) -> list[dict]:
    """Parse CSV content into transaction dicts with validation and flexible parsing."""
    text = content.decode("utf-8")
    lines = text.splitlines()
    if not lines:
        raise ValueError("Empty CSV")

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
            transactions.append(txn.model_dump())
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    if errors and not transactions:
        raise ValueError(f"All rows failed validation: {'; '.join(errors[:5])}")

    return transactions


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV file of transactions. Returns a session ID for subsequent categorization."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        transactions = parse_csv(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    session_id = str(uuid.uuid4())[:8]
    sessions[session_id] = transactions

    return UploadResponse(session_id=session_id, transaction_count=len(transactions))


@router.get("/upload/{session_id}/transactions")
def get_session_transactions(session_id: str):
    """Retrieve stored transactions for a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "transactions": sessions[session_id]}
