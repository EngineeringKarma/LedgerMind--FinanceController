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


def categorize_with_rules(txn: dict) -> Optional[CategorizedTransaction]:
    """
    Attempt to categorize a transaction using high-confidence deterministic rules.
    Returns CategorizedTransaction if high confidence match, else None (delegating to LLM).
    """
    txn_type = str(txn.get("type", "")).lower().strip()
    desc = str(txn.get("description", "")).lower().strip()

    # Check if explicitly ambiguous description keyword - delegate to LLM
    ambiguous_keywords = ["disputed", "unauthorized", "suspicious", "unknown"]
    if any(k in desc for k in ambiguous_keywords):
        return None

    if txn_type == "payment":
        if "subscription" in desc or "renewal" in desc:
            sub = "Subscription Revenue"
        elif "service" in desc or "invoice" in desc:
            sub = "Service Revenue"
        elif "affiliate" in desc:
            sub = "Affiliate Revenue"
        else:
            sub = "Product Sales"
        return CategorizedTransaction(
            transaction_id=txn["transaction_id"],
            category="Revenue",
            subcategory=sub,
            confidence=0.95,
            reasoning=f"Rule-matched payment transaction ({sub})",
            needs_review=False,
        )

    if txn_type == "refund":
        if "partial" in desc:
            sub = "Partial Refund"
        elif "goodwill" in desc:
            sub = "Goodwill Credit"
        elif "fee" in desc:
            sub = "Processing Fee Refund"
        else:
            sub = "Full Refund"
        return CategorizedTransaction(
            transaction_id=txn["transaction_id"],
            category="Refunds",
            subcategory=sub,
            confidence=0.95,
            reasoning=f"Rule-matched refund transaction ({sub})",
            needs_review=False,
        )

    if txn_type == "fee":
        if "platform" in desc:
            sub = "Platform Fee"
        elif "settlement" in desc:
            sub = "Settlement Fee"
        elif "chargeback" in desc:
            sub = "Chargeback Fee"
        else:
            sub = "Payment Processing Fee (MDR)"
        return CategorizedTransaction(
            transaction_id=txn["transaction_id"],
            category="Gateway Fees",
            subcategory=sub,
            confidence=0.95,
            reasoning=f"Rule-matched fee transaction ({sub})",
            needs_review=False,
        )

    if txn_type == "payout":
        if "instant" in desc or "express" in desc:
            sub = "Instant Payout"
        elif "bulk" in desc:
            sub = "Bulk Settlement"
        elif "t+1" in desc:
            sub = "T+1 Settlement"
        else:
            sub = "Merchant Payout"
        return CategorizedTransaction(
            transaction_id=txn["transaction_id"],
            category="Payouts",
            subcategory=sub,
            confidence=0.95,
            reasoning=f"Rule-matched payout transaction ({sub})",
            needs_review=False,
        )

    if txn_type == "tax":
        if "tds" in desc or "194" in desc:
            sub = "TDS Deducted"
        elif "tcs" in desc:
            sub = "TCS Collected"
        elif "remittance" in desc:
            sub = "GST Remittance"
        else:
            sub = "GST Collected"
        return CategorizedTransaction(
            transaction_id=txn["transaction_id"],
            category="Tax (GST/TDS)",
            subcategory=sub,
            confidence=0.95,
            reasoning=f"Rule-matched tax transaction ({sub})",
            needs_review=False,
        )

    if txn_type == "chargeback":
        if "won" in desc:
            sub = "Chargeback Won"
        elif "lost" in desc:
            sub = "Chargeback Lost"
        elif "representment" in desc:
            sub = "Representment"
        else:
            sub = "Chargeback Received"
        return CategorizedTransaction(
            transaction_id=txn["transaction_id"],
            category="Chargebacks",
            subcategory=sub,
            confidence=0.95,
            reasoning=f"Rule-matched chargeback transaction ({sub})",
            needs_review=False,
        )

    # Fallback keyword match for unclassified types
    if "payment" in desc or "received" in desc or "order" in desc:
        return CategorizedTransaction(
            transaction_id=txn["transaction_id"],
            category="Revenue",
            subcategory="Product Sales",
            confidence=0.85,
            reasoning="Keyword-matched payment entry",
            needs_review=False,
        )

    return None


def categorize_all(
    transactions: list[dict],
    progress_callback: Optional[callable] = None,
) -> list[CategorizedTransaction]:
    """
    Categorize all transactions using a hybrid model:
    1. Fast-path rule classification for standard transactions.
    2. LLM batch processing for ambiguous/unclassified transactions.
    """
    rule_results: list[CategorizedTransaction] = []
    llm_transactions: list[dict] = []

    for txn in transactions:
        matched = categorize_with_rules(txn)
        if matched:
            rule_results.append(matched)
        else:
            llm_transactions.append(txn)

    logger.info(
        f"Hybrid categorization: {len(rule_results)} rule-matched, "
        f"{len(llm_transactions)} sent to LLM"
    )

    if not llm_transactions:
        if progress_callback:
            progress_callback(1, 1, len(rule_results), 0)
        return rule_results

    batch_size = settings.llm_batch_size
    batches = [
        llm_transactions[i : i + batch_size]
        for i in range(0, len(llm_transactions), batch_size)
    ]
    total_batches = len(batches)
    llm_results: list[CategorizedTransaction] = []

    for idx, batch in enumerate(batches):
        try:
            results = categorize_batch(batch)
            llm_results.extend(results)
        except Exception as e:
            logger.error(f"LLM Batch {idx + 1}/{total_batches} failed: {e}")
            for txn in batch:
                llm_results.append(
                    CategorizedTransaction(
                        transaction_id=txn["transaction_id"],
                        category="Other/Uncategorized",
                        subcategory="Unclassified Transaction",
                        confidence=0.0,
                        reasoning=f"Batch processing failed: {str(e)[:100]}",
                        needs_review=True,
                    )
                )


    result_map = {r.transaction_id: r for r in (rule_results + llm_results)}
    final_results = [
        result_map.get(
            t["transaction_id"],
            CategorizedTransaction(
                transaction_id=t["transaction_id"],
                category="Other/Uncategorized",
                subcategory="Unclassified Transaction",
                confidence=0.0,
                reasoning="Missing result",
                needs_review=True,
            ),
        )
        for t in transactions
    ]

    return final_results


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
