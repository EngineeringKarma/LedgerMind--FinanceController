import logging

from fastapi import APIRouter, Depends
import aiosqlite

from app.auth import get_current_user
from app.database import get_db, list_sessions, delete_session, session_exists
from app.errors import SessionNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter(tags=["sessions"])


@router.get("/sessions")
async def get_sessions(
    db: aiosqlite.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all upload sessions for the current user with metadata."""
    sessions = await list_sessions(db, current_user["id"])
    return {"sessions": sessions}


@router.delete("/sessions/{session_id}")
async def delete_session_endpoint(
    session_id: str,
    db: aiosqlite.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a session and all related data (transactions, categorizations, reports)."""
    deleted = await delete_session(db, session_id, current_user["id"])
    if not deleted:
        raise SessionNotFoundError(session_id)

    logger.info(f"User {current_user['id']} deleted session {session_id}")
    return {"detail": f"Session {session_id} deleted successfully"}
