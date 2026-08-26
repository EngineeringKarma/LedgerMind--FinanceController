from fastapi import APIRouter, HTTPException

from app.store import sessions, categorized_sessions
from app.agent.categorizer import categorize_all
from app.models.schemas import CategorizeResponse

router = APIRouter(tags=["categorize"])


@router.post("/categorize/{session_id}", response_model=CategorizeResponse)
def categorize(session_id: str):
    """Run LLM categorization on all transactions in a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Upload CSV first.")

    transactions = sessions[session_id]
    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions to categorize")

    results = categorize_all(transactions)

    # Merge original transaction fields into categorized results for frontend display
    txn_lookup = {t["transaction_id"]: t for t in transactions}
    enriched_results = []
    for r in results:
        r_dict = r.model_dump()
        txn = txn_lookup.get(r["transaction_id"], {})
        if txn:
            r_dict["date"] = str(txn.get("date", ""))
            r_dict["amount"] = txn.get("amount")
            r_dict["type"] = str(txn.get("type", ""))
            r_dict["description"] = txn.get("description", "")
            r_dict["counterparty"] = txn.get("counterparty", "")
            r_dict["status"] = str(txn.get("status", ""))
        enriched_results.append(r_dict)

    categorized_sessions[session_id] = enriched_results
    needs_review_count = sum(1 for r in results if r.needs_review)

    return CategorizeResponse(
        session_id=session_id,
        categorized_count=len(results),
        needs_review_count=needs_review_count,
        results=enriched_results,
    )


@router.get("/categorize/{session_id}/results")
def get_categorized_results(session_id: str):
    """Retrieve previously categorized results for a session."""
    if session_id not in categorized_sessions:
        raise HTTPException(status_code=404, detail="No categorized results found. Run categorize first.")
    return {"session_id": session_id, "results": categorized_sessions[session_id]}
