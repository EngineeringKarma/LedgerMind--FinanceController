import asyncio
import logging

import aiosqlite

from app.config import settings
from app.agent.categorizer import categorize_all
from app.database import (
    get_transactions,
    insert_categorizations,
    update_job_status,
)

logger = logging.getLogger(__name__)


async def run_categorization_job(job_id: str, session_id: str) -> None:
    """
    Background job that runs LLM categorization for a session.
    This is an async function compatible with FastAPI's BackgroundTasks.
    """
    db = await aiosqlite.connect(settings.database_path)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys=ON")
    try:
        await update_job_status(db, job_id, "in_progress")
        logger.info(f"Job {job_id}: Starting categorization for session {session_id}")

        transactions = await get_transactions(db, session_id)
        if not transactions:
            await update_job_status(db, job_id, "failed", error_message="No transactions found")
            logger.error(f"Job {job_id}: No transactions found for session {session_id}")
            return

        loop = asyncio.get_running_loop()

        def progress_callback(batch_num: int, total_batches: int, categorized: int, needs_rev: int):
            asyncio.run_coroutine_threadsafe(
                update_job_status(
                    db,
                    job_id,
                    "in_progress",
                    progress=batch_num,
                    categorized_count=categorized,
                    needs_review_count=needs_rev,
                ),
                loop,
            )

        results = await asyncio.to_thread(categorize_all, transactions, progress_callback)

        categorization_dicts = [r.model_dump() for r in results]
        await insert_categorizations(db, session_id, categorization_dicts)

        needs_review_count = sum(1 for r in results if r.needs_review)
        await update_job_status(
            db,
            job_id,
            "completed",
            progress=1,
            categorized_count=len(results),
            needs_review_count=needs_review_count,
        )
        logger.info(
            f"Job {job_id}: Completed. {len(results)} categorized, "
            f"{needs_review_count} need review"
        )

    except Exception as e:
        logger.exception(f"Job {job_id}: Failed with error")
        await update_job_status(db, job_id, "failed", error_message=str(e)[:500])
    finally:
        await db.close()
