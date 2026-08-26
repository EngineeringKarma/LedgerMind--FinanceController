import asyncio
from app.agent.categorizer import categorize_batch

test_txns = [{
    "transaction_id": "txn_test",
    "date": "2026-03-15",
    "type": "fee",
    "amount": -142.50,
    "description": "MDR charges for UPI transaction",
    "counterparty": "Razorpay Software Private Ltd",
    "status": "settled",
}]

try:
    results = categorize_batch(test_txns)
    print("SUCCESS:", results)
except Exception as e:
    import traceback
    traceback.print_exc()
