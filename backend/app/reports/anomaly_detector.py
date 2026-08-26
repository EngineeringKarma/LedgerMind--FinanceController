from collections import defaultdict
from app.models.schemas import Anomaly, AnomalySeverity


def detect_anomalies(
    transactions: list[dict],
    categorized: list[dict],
    rolling_window: int = 3,
) -> list[Anomaly]:
    """
    Detect anomalies using deterministic statistical rules.
    Rules:
    1. Category total > 1.5x its rolling monthly average = spike
    2. Single transaction > 3x the category average = outlier
    3. Unusual fee-to-revenue ratio in any month
    """
    cat_lookup = {c["transaction_id"]: c for c in categorized}
    anomalies = []

    # Rule 1: Monthly category spikes
    monthly_cat_totals = _monthly_category_totals(transactions, cat_lookup)
    anomalies.extend(_detect_monthly_spikes(monthly_cat_totals))

    # Rule 2: Transaction outliers
    anomalies.extend(_detect_transaction_outliers(transactions, cat_lookup))

    # Rule 3: Fee ratio anomalies
    anomalies.extend(_detect_fee_ratio_anomalies(transactions, cat_lookup))

    return anomalies


def _monthly_category_totals(
    transactions: list[dict], cat_lookup: dict
) -> dict[str, dict[str, float]]:
    """Build {month: {category: total_amount}} structure."""
    monthly: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for txn in transactions:
        txn_id = txn["transaction_id"]
        amount = abs(txn.get("amount", 0))
        date_str = txn.get("date", "")
        cat_info = cat_lookup.get(txn_id, {})
        category = cat_info.get("category", "Other/Uncategorized")

        try:
            month = date_str[:7]
        except (IndexError, TypeError):
            continue

        monthly[month][category] += amount

    return monthly


def _detect_monthly_spikes(monthly_data: dict) -> list[Anomaly]:
    """Flag when a category's monthly total > 1.5x its rolling average."""
    anomalies = []
    months = sorted(monthly_data.keys())

    if len(months) < 2:
        return anomalies

    # Collect all categories
    all_cats = set()
    for month_data in monthly_data.values():
        all_cats.update(month_data.keys())

    for cat in all_cats:
        values = [(m, monthly_data[m].get(cat, 0)) for m in months]

        for i in range(1, len(values)):
            prev_values = [v for _, v in values[:i]]
            if not prev_values:
                continue
            avg = sum(prev_values) / len(prev_values)
            current_month, current_val = values[i]

            if avg > 0 and current_val > avg * 1.5:
                ratio = current_val / avg
                severity = AnomalySeverity.HIGH if ratio > 2.5 else AnomalySeverity.MEDIUM if ratio > 2.0 else AnomalySeverity.LOW
                anomalies.append(
                    Anomaly(
                        type="category_spike",
                        description=(
                            f"{cat} total in {current_month} was ₹{current_val:,.0f}, "
                            f"{ratio:.1f}x the rolling average of ₹{avg:,.0f}"
                        ),
                        severity=severity,
                    )
                )

    return anomalies


def _detect_transaction_outliers(
    transactions: list[dict], cat_lookup: dict
) -> list[Anomaly]:
    """Flag individual transactions > 3x their category average."""
    anomalies = []
    cat_totals: dict[str, list[float]] = defaultdict(list)

    for txn in transactions:
        txn_id = txn["transaction_id"]
        amount = abs(txn.get("amount", 0))
        cat_info = cat_lookup.get(txn_id, {})
        category = cat_info.get("category", "Other/Uncategorized")
        cat_totals[category].append(amount)

    cat_avgs = {cat: sum(vals) / len(vals) if vals else 0 for cat, vals in cat_totals.items()}

    for txn in transactions:
        txn_id = txn["transaction_id"]
        amount = abs(txn.get("amount", 0))
        cat_info = cat_lookup.get(txn_id, {})
        category = cat_info.get("category", "Other/Uncategorized")
        avg = cat_avgs.get(category, 0)

        if avg > 0 and amount > avg * 3:
            anomalies.append(
                Anomaly(
                    type="transaction_outlier",
                    description=(
                        f"Transaction {txn_id} (₹{amount:,.0f}) is "
                        f"{amount / avg:.1f}x the average {category} transaction (₹{avg:,.0f})"
                    ),
                    severity=AnomalySeverity.MEDIUM,
                )
            )

    return anomalies


def _detect_fee_ratio_anomalies(
    transactions: list[dict], cat_lookup: dict
) -> list[Anomaly]:
    """Flag months where fees exceed 15% of revenue (unusual fee burden)."""
    anomalies = []
    monthly_rev = defaultdict(float)
    monthly_fees = defaultdict(float)

    for txn in transactions:
        txn_id = txn["transaction_id"]
        amount = txn.get("amount", 0)
        date_str = txn.get("date", "")
        cat_info = cat_lookup.get(txn_id, {})
        category = cat_info.get("category", "Other/Uncategorized")

        try:
            month = date_str[:7]
        except (IndexError, TypeError):
            continue

        if category == "Revenue":
            monthly_rev[month] += amount
        elif category in ("Gateway Fees", "Payouts"):
            monthly_fees[month] += abs(amount)

    for month in sorted(set(monthly_rev.keys()) | set(monthly_fees.keys())):
        rev = monthly_rev.get(month, 0)
        fees = monthly_fees.get(month, 0)

        if rev > 0 and fees > 0:
            ratio = fees / rev
            if ratio > 0.15:
                anomalies.append(
                    Anomaly(
                        type="fee_ratio_high",
                        description=(
                            f"Fees in {month} were {ratio:.1%} of revenue "
                            f"(₹{fees:,.0f} fees vs ₹{rev:,.0f} revenue)"
                        ),
                        severity=AnomalySeverity.HIGH if ratio > 0.25 else AnomalySeverity.MEDIUM,
                    )
                )

    return anomalies
