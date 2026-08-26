import pytest
from app.reports.aggregator import (
    compute_pnl_with_amounts,
    compute_category_breakdown,
    compute_monthly_trend,
)
from app.reports.anomaly_detector import detect_anomalies


# ─── Test Data ───────────────────────────────────────────────────────────────

SAMPLE_TRANSACTIONS = [
    {"transaction_id": "txn_001", "date": "2026-07-01", "type": "payment", "amount": 10000.0, "description": "Payment", "counterparty": "Flipkart", "status": "settled"},
    {"transaction_id": "txn_002", "date": "2026-07-05", "type": "payment", "amount": 15000.0, "description": "Payment", "counterparty": "Zomato", "status": "settled"},
    {"transaction_id": "txn_003", "date": "2026-07-10", "type": "fee", "amount": -200.0, "description": "MDR", "counterparty": "Razorpay", "status": "settled"},
    {"transaction_id": "txn_004", "date": "2026-07-12", "type": "refund", "amount": -3000.0, "description": "Refund", "counterparty": "Flipkart", "status": "settled"},
    {"transaction_id": "txn_005", "date": "2026-07-15", "type": "tax", "amount": -500.0, "description": "TDS", "counterparty": "ICICI", "status": "settled"},
    {"transaction_id": "txn_006", "date": "2026-07-20", "type": "chargeback", "amount": -1500.0, "description": "Chargeback", "counterparty": "Amazon", "status": "pending"},
    {"transaction_id": "txn_007", "date": "2026-06-01", "type": "payment", "amount": 8000.0, "description": "Payment", "counterparty": "Swiggy", "status": "settled"},
    {"transaction_id": "txn_008", "date": "2026-06-15", "type": "fee", "amount": -150.0, "description": "MDR", "counterparty": "Razorpay", "status": "settled"},
]

SAMPLE_CATEGORIZED = [
    {"transaction_id": "txn_001", "category": "Revenue", "subcategory": "Product Sales", "confidence": 0.9, "reasoning": "test", "needs_review": False},
    {"transaction_id": "txn_002", "category": "Revenue", "subcategory": "Product Sales", "confidence": 0.9, "reasoning": "test", "needs_review": False},
    {"transaction_id": "txn_003", "category": "Gateway Fees", "subcategory": "Payment Processing Fee (MDR)", "confidence": 0.95, "reasoning": "test", "needs_review": False},
    {"transaction_id": "txn_004", "category": "Refunds", "subcategory": "Full Refund", "confidence": 0.92, "reasoning": "test", "needs_review": False},
    {"transaction_id": "txn_005", "category": "Tax (GST/TDS)", "subcategory": "TDS Deducted", "confidence": 0.97, "reasoning": "test", "needs_review": False},
    {"transaction_id": "txn_006", "category": "Chargebacks", "subcategory": "Chargeback Received", "confidence": 0.94, "reasoning": "test", "needs_review": False},
    {"transaction_id": "txn_007", "category": "Revenue", "subcategory": "Service Revenue", "confidence": 0.88, "reasoning": "test", "needs_review": False},
    {"transaction_id": "txn_008", "category": "Gateway Fees", "subcategory": "Payment Processing Fee (MDR)", "confidence": 0.95, "reasoning": "test", "needs_review": False},
]


# ─── P&L Tests ───────────────────────────────────────────────────────────────

class TestPnLSummary:
    def test_revenue_calculation(self):
        pnl = compute_pnl_with_amounts(SAMPLE_TRANSACTIONS, SAMPLE_CATEGORIZED)
        # txn_001: 10000, txn_002: 15000, txn_007: 8000 = 33000
        assert pnl.revenue == 33000.0

    def test_fees_calculation(self):
        pnl = compute_pnl_with_amounts(SAMPLE_TRANSACTIONS, SAMPLE_CATEGORIZED)
        # txn_003: -200, txn_008: -150 = -350
        assert pnl.fees == -350.0

    def test_refunds_calculation(self):
        pnl = compute_pnl_with_amounts(SAMPLE_TRANSACTIONS, SAMPLE_CATEGORIZED)
        assert pnl.refunds == -3000.0

    def test_net_calculation(self):
        pnl = compute_pnl_with_amounts(SAMPLE_TRANSACTIONS, SAMPLE_CATEGORIZED)
        expected = 33000 + (-350) + (-3000) + (-500) + (-1500)
        assert pnl.net == expected


# ─── Category Breakdown Tests ────────────────────────────────────────────────

class TestCategoryBreakdown:
    def test_breakdown_count(self):
        breakdown = compute_category_breakdown(SAMPLE_TRANSACTIONS, SAMPLE_CATEGORIZED)
        assert len(breakdown) == 5  # Revenue, Gateway Fees, Refunds, Tax, Chargebacks

    def test_revenue_breakdown(self):
        breakdown = compute_category_breakdown(SAMPLE_TRANSACTIONS, SAMPLE_CATEGORIZED)
        revenue = next(b for b in breakdown if b.category == "Revenue")
        assert revenue.count == 3
        assert revenue.total == 33000.0

    def test_sorted_by_total_desc(self):
        breakdown = compute_category_breakdown(SAMPLE_TRANSACTIONS, SAMPLE_CATEGORIZED)
        totals = [b.total for b in breakdown]
        assert totals == sorted(totals, reverse=True)


# ─── Monthly Trend Tests ─────────────────────────────────────────────────────

class TestMonthlyTrend:
    def test_trend_periods(self):
        trend = compute_monthly_trend(SAMPLE_TRANSACTIONS, SAMPLE_CATEGORIZED)
        months = [t.month for t in trend]
        assert "2026-06" in months
        assert "2026-07" in months

    def test_july_revenue(self):
        trend = compute_monthly_trend(SAMPLE_TRANSACTIONS, SAMPLE_CATEGORIZED)
        july = next(t for t in trend if t.month == "2026-07")
        # txn_001: 10000 + txn_002: 15000 = 25000
        assert july.revenue == 25000.0


# ─── Anomaly Detection Tests ────────────────────────────────────────────────

class TestAnomalyDetector:
    def test_detects_spike(self):
        # Create data with a clear spike
        txns = [
            {"transaction_id": "t1", "date": "2026-05-01", "type": "fee", "amount": -100, "description": "fee", "counterparty": "R", "status": "settled"},
            {"transaction_id": "t2", "date": "2026-06-01", "type": "fee", "amount": -100, "description": "fee", "counterparty": "R", "status": "settled"},
            {"transaction_id": "t3", "date": "2026-07-01", "type": "fee", "amount": -500, "description": "fee", "counterparty": "R", "status": "settled"},
        ]
        cats = [
            {"transaction_id": "t1", "category": "Gateway Fees", "subcategory": "Fee", "confidence": 0.9, "reasoning": "", "needs_review": False},
            {"transaction_id": "t2", "category": "Gateway Fees", "subcategory": "Fee", "confidence": 0.9, "reasoning": "", "needs_review": False},
            {"transaction_id": "t3", "category": "Gateway Fees", "subcategory": "Fee", "confidence": 0.9, "reasoning": "", "needs_review": False},
        ]
        anomalies = detect_anomalies(txns, cats)
        assert any(a.type == "category_spike" for a in anomalies)

    def test_no_anomalies_on_steady_data(self):
        # Use truly steady data — same revenue across months
        txns = [
            {"transaction_id": "t1", "date": "2026-05-01", "type": "payment", "amount": 10000, "description": "p", "counterparty": "A", "status": "settled"},
            {"transaction_id": "t2", "date": "2026-06-01", "type": "payment", "amount": 10000, "description": "p", "counterparty": "A", "status": "settled"},
            {"transaction_id": "t3", "date": "2026-07-01", "type": "payment", "amount": 10500, "description": "p", "counterparty": "A", "status": "settled"},
        ]
        cats = [
            {"transaction_id": "t1", "category": "Revenue", "subcategory": "Sales", "confidence": 0.9, "reasoning": "", "needs_review": False},
            {"transaction_id": "t2", "category": "Revenue", "subcategory": "Sales", "confidence": 0.9, "reasoning": "", "needs_review": False},
            {"transaction_id": "t3", "category": "Revenue", "subcategory": "Sales", "confidence": 0.9, "reasoning": "", "needs_review": False},
        ]
        anomalies = detect_anomalies(txns, cats)
        spikes = [a for a in anomalies if a.type == "category_spike"]
        assert len(spikes) == 0

    def test_outlier_detection(self):
        # More small transactions so the outlier stands out against a stable average
        txns = [
            {"transaction_id": "t1", "date": "2026-07-01", "type": "payment", "amount": 100, "description": "p", "counterparty": "A", "status": "settled"},
            {"transaction_id": "t2", "date": "2026-07-02", "type": "payment", "amount": 110, "description": "p", "counterparty": "A", "status": "settled"},
            {"transaction_id": "t3", "date": "2026-07-03", "type": "payment", "amount": 105, "description": "p", "counterparty": "A", "status": "settled"},
            {"transaction_id": "t4", "date": "2026-07-04", "type": "payment", "amount": 115, "description": "p", "counterparty": "A", "status": "settled"},
            {"transaction_id": "t5", "date": "2026-07-05", "type": "payment", "amount": 5000, "description": "p", "counterparty": "A", "status": "settled"},
        ]
        cats = [
            {"transaction_id": "t1", "category": "Revenue", "subcategory": "Sales", "confidence": 0.9, "reasoning": "", "needs_review": False},
            {"transaction_id": "t2", "category": "Revenue", "subcategory": "Sales", "confidence": 0.9, "reasoning": "", "needs_review": False},
            {"transaction_id": "t3", "category": "Revenue", "subcategory": "Sales", "confidence": 0.9, "reasoning": "", "needs_review": False},
            {"transaction_id": "t4", "category": "Revenue", "subcategory": "Sales", "confidence": 0.9, "reasoning": "", "needs_review": False},
            {"transaction_id": "t5", "category": "Revenue", "subcategory": "Sales", "confidence": 0.9, "reasoning": "", "needs_review": False},
        ]
        anomalies = detect_anomalies(txns, cats)
        assert any(a.type == "transaction_outlier" for a in anomalies)


# ─── Data Generator Tests ────────────────────────────────────────────────────

class TestDataGenerator:
    def test_generates_correct_count(self):
        from app.data.synthetic_generator import generate_transactions
        txns = generate_transactions(50)
        assert len(txns) == 50

    def test_has_required_fields(self):
        from app.data.synthetic_generator import generate_transactions
        txns = generate_transactions(10)
        required = {"transaction_id", "date", "type", "amount", "description", "counterparty", "status"}
        for txn in txns:
            assert required.issubset(set(txn.keys()))

    def test_dates_are_sorted(self):
        from app.data.synthetic_generator import generate_transactions
        txns = generate_transactions(100)
        dates = [t["date"] for t in txns]
        assert dates == sorted(dates)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
