from collections import defaultdict

from app.models.schemas import (
    CategoryBreakdown,
    MonthlyTrend,
    PnLSummary,
)


def _build_cat_lookup(categorized: list[dict]) -> dict[str, dict]:
    """Build a lookup dict by transaction_id from categorized results."""
    return {c["transaction_id"]: c for c in categorized}


def classify_uncategorized(txn: dict, category: str) -> str:
    """
    Smart fallback for uncategorized transactions.
    Returns one of: "revenue", "fees", "refunds", "tax", "chargebacks".
    """
    txn_type = txn.get("type", "payment").strip().lower()
    amount = txn.get("amount", 0)
    desc = txn.get("description", "").lower()

    if txn_type != "payment":
        if txn_type in ("fee", "payout"):
            return "fees"
        elif txn_type == "refund":
            return "refunds"
        elif txn_type == "tax":
            return "tax"
        elif txn_type == "chargeback":
            return "chargebacks"
        return "revenue"

    if amount < 0:
        if "refund" in desc or "reversal" in desc:
            return "refunds"
        elif "tax" in desc or "tds" in desc or "gst" in desc:
            return "tax"
        elif "chargeback" in desc or "dispute" in desc:
            return "chargebacks"
        return "fees"

    return "revenue"


def compute_pnl_with_amounts(transactions: list[dict], categorized: list[dict]) -> PnLSummary:
    """Compute P&L summary by joining original amounts with categorized data."""
    cat_lookup = _build_cat_lookup(categorized)

    revenue = 0.0
    fees = 0.0
    refunds = 0.0
    tax = 0.0
    chargebacks = 0.0

    for txn in transactions:
        txn_id = txn["transaction_id"]
        amount = txn.get("amount", 0)
        cat_info = cat_lookup.get(txn_id, {})
        category = cat_info.get("category", "Other/Uncategorized")

        if category == "Revenue":
            revenue += amount
        elif category == "Gateway Fees":
            fees += amount
        elif category == "Refunds":
            refunds += amount
        elif category == "Tax (GST/TDS)":
            tax += amount
        elif category == "Chargebacks":
            chargebacks += amount
        elif category == "Payouts":
            fees += amount
        elif category == "Settlements":
            revenue += amount
        elif category == "Other/Uncategorized":
            bucket = classify_uncategorized(txn, category)
            if bucket == "revenue":
                revenue += amount
            elif bucket == "fees":
                fees += amount
            elif bucket == "refunds":
                refunds += amount
            elif bucket == "tax":
                tax += amount
            elif bucket == "chargebacks":
                chargebacks += amount

    net = revenue + refunds + fees + tax + chargebacks

    return PnLSummary(
        revenue=round(revenue, 2),
        fees=round(fees, 2),
        refunds=round(refunds, 2),
        tax=round(tax, 2),
        chargebacks=round(chargebacks, 2),
        net=round(net, 2),
    )


def compute_category_breakdown(transactions: list[dict], categorized: list[dict]) -> list[CategoryBreakdown]:
    """Compute category-wise totals and counts."""
    cat_lookup = _build_cat_lookup(categorized)
    breakdown: dict[str, dict] = defaultdict(lambda: {"total": 0.0, "count": 0})

    for txn in transactions:
        txn_id = txn["transaction_id"]
        amount = abs(txn.get("amount", 0))
        cat_info = cat_lookup.get(txn_id, {})
        category = cat_info.get("category", "Other/Uncategorized")

        breakdown[category]["total"] += amount
        breakdown[category]["count"] += 1

    result = []
    for cat, data in sorted(breakdown.items(), key=lambda x: -x[1]["total"]):
        result.append(
            CategoryBreakdown(
                category=cat,
                total=round(data["total"], 2),
                count=data["count"],
            )
        )

    return result


def compute_monthly_trend(transactions: list[dict], categorized: list[dict]) -> list[MonthlyTrend]:
    """Compute month-over-month revenue, fees, refunds, tax, chargebacks, and net."""
    cat_lookup = _build_cat_lookup(categorized)
    monthly: dict[str, dict] = defaultdict(
        lambda: {"revenue": 0.0, "fees": 0.0, "refunds": 0.0, "tax": 0.0, "chargebacks": 0.0}
    )

    for txn in transactions:
        txn_id = txn["transaction_id"]
        amount = txn.get("amount", 0)
        date_str = txn.get("date", "")
        cat_info = cat_lookup.get(txn_id, {})
        category = cat_info.get("category", "Other/Uncategorized")

        # Extract month key (YYYY-MM)
        try:
            month_key = date_str[:7]
        except (IndexError, TypeError):
            continue

        if category == "Revenue" or category == "Settlements":
            monthly[month_key]["revenue"] += amount
        elif category in ("Gateway Fees", "Payouts"):
            monthly[month_key]["fees"] += amount
        elif category == "Refunds":
            monthly[month_key]["refunds"] += amount
        elif category == "Tax (GST/TDS)":
            monthly[month_key]["tax"] += amount
        elif category == "Chargebacks":
            monthly[month_key]["chargebacks"] += amount
        elif category == "Other/Uncategorized":
            bucket = classify_uncategorized(txn, category)
            if bucket == "revenue":
                monthly[month_key]["revenue"] += amount
            elif bucket == "fees":
                monthly[month_key]["fees"] += amount
            elif bucket == "refunds":
                monthly[month_key]["refunds"] += amount
            elif bucket == "tax":
                monthly[month_key]["tax"] += amount
            elif bucket == "chargebacks":
                monthly[month_key]["chargebacks"] += amount

    result = []
    for month in sorted(monthly.keys()):
        data = monthly[month]
        net = data["revenue"] + data["refunds"] + data["fees"] + data["tax"] + data["chargebacks"]
        result.append(
            MonthlyTrend(
                month=month,
                revenue=round(data["revenue"], 2),
                fees=round(data["fees"], 2),
                refunds=round(data["refunds"], 2),
                tax=round(data["tax"], 2),
                chargebacks=round(data["chargebacks"], 2),
                net=round(net, 2),
            )
        )

    return result
