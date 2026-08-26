import logging

from fastapi import APIRouter, Depends
import aiosqlite

from app.auth import get_current_user
from app.reports.aggregator import (
    compute_pnl_with_amounts,
    compute_category_breakdown,
    compute_monthly_trend,
)
from app.reports.anomaly_detector import detect_anomalies
from app.models.schemas import Report
from app.database import (
    get_db,
    session_exists,
    get_transactions,
    get_categorizations,
    save_report,
    get_report,
    categorization_exists,
)
from app.errors import SessionNotFoundError, LedgerMindError

logger = logging.getLogger(__name__)
router = APIRouter(tags=["reports"])


@router.post("/reports/generate/{session_id}", response_model=Report)
async def generate_report(
    session_id: str,
    db: aiosqlite.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Generate a full report from categorized transaction data."""
    if not await session_exists(db, session_id, current_user["id"]):
        raise SessionNotFoundError(session_id)
    if not await categorization_exists(db, session_id):
        raise LedgerMindError("No categorized data. Run /categorize first.", status_code=404)

    transactions = await get_transactions(db, session_id)
    categorized = await get_categorizations(db, session_id)

    # Determine the full period range from the data
    dates = sorted(set(str(t.get("date", ""))[:7] for t in transactions if t.get("date")))
    if len(dates) == 0:
        period = "unknown"
    elif len(dates) == 1:
        period = dates[0]
    else:
        period = f"{dates[0]} to {dates[-1]}"

    pnl = compute_pnl_with_amounts(transactions, categorized)
    breakdown = compute_category_breakdown(transactions, categorized)
    trend = compute_monthly_trend(transactions, categorized)
    anomalies = detect_anomalies(transactions, categorized)

    report = Report(
        period=period,
        pnl_summary=pnl,
        category_breakdown=breakdown,
        monthly_trend=trend,
        anomalies=anomalies,
    )

    # Save report as JSON in SQLite
    report_data = {
        "pnl_summary": pnl.model_dump(),
        "category_breakdown": [b.model_dump() for b in breakdown],
        "monthly_trend": [t.model_dump() for t in trend],
        "anomalies": [{"type": a.type, "description": a.description, "severity": a.severity.value} for a in anomalies],
    }
    await save_report(db, session_id, period, report_data)

    logger.info(f"User {current_user['id']} generated report for session {session_id}")
    return report


@router.get("/reports/{session_id}", response_model=Report)
async def get_report_endpoint(
    session_id: str,
    db: aiosqlite.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve a previously generated report."""
    if not await session_exists(db, session_id, current_user["id"]):
        raise SessionNotFoundError(session_id)

    report_dict = await get_report(db, session_id)
    if not report_dict:
        raise LedgerMindError("Report not found. Generate one first.", status_code=404)
    return report_dict
