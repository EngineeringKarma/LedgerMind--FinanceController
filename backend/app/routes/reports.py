from fastapi import APIRouter, HTTPException

from app.store import sessions, categorized_sessions, reports
from app.reports.aggregator import (
    compute_pnl_with_amounts,
    compute_category_breakdown,
    compute_monthly_trend,
)
from app.reports.anomaly_detector import detect_anomalies
from app.models.schemas import Report

router = APIRouter(tags=["reports"])


@router.post("/reports/generate/{session_id}", response_model=Report)
def generate_report(session_id: str):
    """Generate a full report from categorized transaction data."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    if session_id not in categorized_sessions:
        raise HTTPException(status_code=404, detail="No categorized data. Run /categorize first.")

    transactions = sessions[session_id]
    categorized = categorized_sessions[session_id]

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

    reports[session_id] = report
    return report


@router.get("/reports/{session_id}", response_model=Report)
def get_report(session_id: str):
    """Retrieve a previously generated report."""
    if session_id not in reports:
        raise HTTPException(status_code=404, detail="Report not found. Generate one first.")
    return reports[session_id]
