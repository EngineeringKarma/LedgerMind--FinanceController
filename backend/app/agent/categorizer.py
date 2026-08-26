import json
import logging
from typing import Optional

from pydantic import ValidationError

from app.agent.llm_client import chat_completion
from app.agent.prompts import build_messages
from app.config import settings
from app.models.schemas import CategorizedTransaction

logger = logging.getLogger(__name__)


def categorize_batch(transactions: list[dict]) -> list[CategorizedTransaction]:
    """
    Categorize a batch of transactions using the LLM.
    Returns validated CategorizedTransaction objects.
    Raises on malformed output after retry.
    """
    messages = build_messages(transactions)
    raw_response = chat_completion(messages)

    parsed = _parse_response(raw_response)
    validated = _validate_transactions(parsed, {t["transaction_id"] for t in transactions})

    return validated


def categorize_all(transactions: list[dict]) -> list[CategorizedTransaction]:
    """
    Categorize all transactions by splitting into batches.
    Handles partial failures gracefully — failed batches return
    empty results with needs_review=True for all items in that batch.
    """
    batch_size = settings.llm_batch_size
    all_results = []

    for i in range(0, len(transactions), batch_size):
        batch = transactions[i : i + batch_size]
        try:
            results = categorize_batch(batch)
            all_results.extend(results)
            logger.info(
                f"Batch {i // batch_size + 1}: {len(results)}/{len(batch)} transactions categorized"
            )
        except Exception as e:
            logger.error(f"Batch {i // batch_size + 1} failed: {e}")
            # Graceful degradation — mark entire batch as needing review
            for txn in batch:
                all_results.append(
                    CategorizedTransaction(
                        transaction_id=txn["transaction_id"],
                        category="Other/Uncategorized",
                        subcategory="Unclassified Transaction",
                        confidence=0.0,
                        reasoning=f"Batch processing failed: {str(e)[:100]}",
                        needs_review=True,
                    )
                )

    return all_results


def _parse_response(raw: str) -> list[dict]:
    """Parse the raw LLM response into a list of dicts."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse LLM response as JSON: {e}")

    # Handle both direct array and wrapped response
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        # Try common wrapper keys
        for key in ["transactions", "results", "data", "categorized"]:
            if key in data and isinstance(data[key], list):
                return data[key]
        # If only one key and it's a list, use it
        values = list(data.values())
        if len(values) == 1 and isinstance(values[0], list):
            return values[0]

    raise ValueError(f"Unexpected response structure: {type(data)}")


def _validate_transactions(
    items: list[dict], expected_ids: set[str]
) -> list[CategorizedTransaction]:
    """Validate parsed items against Pydantic schema. Creates fallback entries for missing transactions."""
    validated = []
    seen_ids = set()

    for item in items:
        txn_id = item.get("transaction_id", "")
        if txn_id in seen_ids:
            continue
        seen_ids.add(txn_id)

        try:
            ct = CategorizedTransaction(**item)
            validated.append(ct)
        except ValidationError as e:
            logger.warning(f"Validation failed for {txn_id}: {e}")
            # Create a fallback entry requiring review
            validated.append(
                CategorizedTransaction(
                    transaction_id=txn_id,
                    category="Other/Uncategorized",
                    subcategory="Ambiguous Entry",
                    confidence=0.0,
                    reasoning=f"LLM output validation failed: {str(e)[:80]}",
                    needs_review=True,
                )
            )

    # Detect transactions the LLM silently dropped — create fallback entries for them
    missing_ids = expected_ids - seen_ids
    if missing_ids:
        logger.warning(f"LLM returned {len(seen_ids)}/{len(expected_ids)} transactions. "
                       f"Missing: {missing_ids}")
        for txn_id in missing_ids:
            validated.append(
                CategorizedTransaction(
                    transaction_id=txn_id,
                    category="Other/Uncategorized",
                    subcategory="Missing from LLM Response",
                    confidence=0.0,
                    reasoning="Transaction was not included in the LLM response",
                    needs_review=True,
                )
            )

    return validated
