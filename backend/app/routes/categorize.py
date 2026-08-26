import uuid
import logging

from fastapi import APIRouter, Depends, BackgroundTasks
import aiosqlite

from app.auth import get_current_user
from app.models.schemas import CategorizeResponse
from app.database import (
    get_db,
    session_exists,
    get_transactions,
    categorization_exists,
    get_categorizations_joined,
    create_job,
    get_active_job_for_session,
    get_job,
)
from app.errors import SessionNotFoundError, JobConflictError
from app.worker import run_categorization_job

logger = logging.getLogger(__name__)
router = APIRouter(tags=["categorize"])


@router.post("/categorize/{session_id}", status_code=202)
async def categorize(
    session_id: str,
    background_tasks: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Start LLM categorization as a background job. Returns 202 with job_id."""
    if not await session_exists(db, session_id, current_user["id"]):
        raise SessionNotFoundError(session_id)

    # Check for active job
    active_job = await get_active_job_for_session(db, session_id)
    if active_job:
        raise JobConflictError(
            f"A job is already in progress for this session (job: {active_job['job_id']})"
        )

    transactions = await get_transactions(db, session_id)
    if not transactions:
        from app.errors import LedgerMindError
        raise LedgerMindError("No transactions to categorize", status_code=400)

    # Calculate total batches
    from app.config import settings
    total_batches = (len(transactions) + settings.llm_batch_size - 1) // settings.llm_batch_size

    # Create job record
    job_id = str(uuid.uuid4())[:12]
    await create_job(db, job_id, session_id, current_user["id"], total_batches)

    # Start background task
    background_tasks.add_task(run_categorization_job, job_id, session_id)

    logger.info(f"User {current_user['id']} started categorization job {job_id} for session {session_id}")
    return {"job_id": job_id, "status": "pending", "session_id": session_id}


@router.get("/categorize/{session_id}/results")
async def get_categorized_results(
    session_id: str,
    db: aiosqlite.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve previously categorized results for a session."""
    if not await session_exists(db, session_id, current_user["id"]):
        raise SessionNotFoundError(session_id)

    if not await categorization_exists(db, session_id):
        from app.errors import LedgerMindError
        raise LedgerMindError("No categorized results found. Run categorize first.", status_code=404)

    enriched_results = await get_categorizations_joined(db, session_id)
    return {"session_id": session_id, "results": enriched_results}


@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    db: aiosqlite.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get the status and results of a categorization job."""
    job = await get_job(db, job_id)
    if not job:
        from app.errors import LedgerMindError
        raise LedgerMindError("Job not found", status_code=404)

    if job["user_id"] != current_user["id"]:
        from app.errors import AuthorizationError
        raise AuthorizationError()

    result = {
        "job_id": job["job_id"],
        "session_id": job["session_id"],
        "status": job["status"],
        "progress": job["progress"],
        "total_batches": job["total_batches"],
        "categorized_count": job["categorized_count"],
        "needs_review_count": job["needs_review_count"],
        "error_message": job["error_message"],
        "created_at": job["created_at"],
        "completed_at": job["completed_at"],
    }

    # Include results if completed
    if job["status"] == "completed":
        enriched_results = await get_categorizations_joined(db, job["session_id"])
        result["results"] = enriched_results

    return result
