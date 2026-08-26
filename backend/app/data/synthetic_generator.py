import csv
import random
import os
from datetime import date, timedelta

random.seed(42)

# Merchant names and banks used by Razorpay ecosystem
MERCHANTS = [
    "Flipkart Online Services Pvt Ltd",
    "Zomato Ltd",
    "Swiggy Instamart",
    "Amazon Seller Services",
    "Ola Cabs Private Limited",
    "Urban Company India Pvt Ltd",
    "BookMyShow Events Pvt Ltd",
    "MakeMyTrip India Pvt Ltd",
    "PhonePe Private Limited",
    "Paytm Payments Bank",
    "HDFC Bank Ltd",
    "ICICI Bank Limited",
    "Axis Bank Limited",
    "Kotak Mahindra Bank",
    "State Bank of India",
    "Razorpay Software Private Ltd",
    "Stripe India Pvt Ltd",
    "CC Avenue Payment Gateway",
    "PayU India Pvt Ltd",
    "RazorpayX Banking Partner",
]

# Realistic Razorpay-style transaction descriptions by type
DESCRIPTIONS = {
    "payment": [
        "Payment received for order #{ref}",
        "Customer payment - Invoice #{ref}",
        "Online payment via UPI - Ref #{ref}",
        "Credit card payment processed - Ref #{ref}",
        "Netbanking transfer - Ref #{ref}",
        "Payment for subscription renewal #{ref}",
        "EMI payment received - Ref #{ref}",
        "Wallet payment processed - Ref #{ref}",
        "Payment received via QR code - #{ref}",
        "International payment processed - Ref #{ref}",
    ],
    "refund": [
        "Refund initiated for order #{ref}",
        "Full refund processed - Transaction #{ref}",
        "Partial refund for item return #{ref}",
        "Refund to original payment method #{ref}",
        "Customer dispute resolved - refund issued #{ref}",
        "Adjustment - Ref #{ref}",  # Ambiguous: could be refund or chargeback
        "Reversal for duplicate charge #{ref}",
        "Goodwill credit issued #{ref}",
    ],
    "payout": [
        "Payout to merchant bank account",
        "Settlement transfer - Batch #{ref}",
        "T+1 settlement processed",
        "Instant payout to HDFC Bank ****4521",
        "Weekly settlement - Ref #{ref}",
        "Payout to ICICI Bank ****7832",
        "Bulk payout processed - Ref #{ref}",
        "Express payout to Axis Bank ****1298",
    ],
    "fee": [
        "MDR charges for UPI transaction",
        "Platform fee - Monthly billing",
        "Transaction fee - 2% of amount",
        "Settlement fee applied",
        "Gateway convenience fee #{ref}",
        "Processing fee for international txn",
        "Chargeback processing fee #{ref}",
        "Refund processing fee",
    ],
    "chargeback": [
        "Chargeback received - Case #{ref}",
        "Chargeback dispute - Merchant notified",
        "Representment filed - Case #{ref}",
        "Chargeback won - Funds reversed #{ref}",
        "Chargeback lost - Debit note raised #{ref}",
        "Adjustment - Ref #{ref}",  # Same as refund - ambiguous!
        "Unauthorized transaction dispute #{ref}",
        "Cardholder dispute resolved #{ref}",
    ],
    "tax": [
        "TDS deducted at source - 2%",
        "GST collected on platform fees",
        "TCS on international transactions",
        "TDS u/s 194J - Professional fees",
        "GST remittance for billing period",
        "TDS certificate generated - Form 16A",
    ],
}

# Ambiguous descriptions designed to test LLM reasoning
AMBIGUOUS_DESCRIPTIONS = [
    ("Adjustment - Ref #3391", "payment", "refund"),  # Could be refund or chargeback adjustment
    ("Reversal - Batch #887", "refund", "payout"),  # Could be refund reversal or payout reversal
    ("Credit note issued - #4421", "payment", "refund"),  # Could be a credit (payment) or refund
    ("Debit adjustment #9912", "fee", "chargeback"),  # Could be a fee deduction or chargeback debit
    ("Settlement correction - Ref #5567", "payout", "refund"),  # Could be payout correction or refund
    ("Ref #2233 - Disputed amount", "chargeback", "refund"),  # Ambiguous dispute resolution
    ("Adjustment applied - Inv #7712", "fee", "payment"),  # Could be fee adjustment or payment
    ("Ref #8844 - Status updated", "payment", "refund"),  # Completely vague
    ("Transaction reversal #1199", "refund", "chargeback"),  # Could be either
    ("Credit adjustment #6654", "payment", "refund"),  # Credit could mean payment or refund
]


def generate_transaction_id(index: int) -> str:
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    suffix = "".join(random.choices(chars, k=8))
    return f"txn_{suffix}"


def generate_transactions(count: int = 200) -> list[dict]:
    transactions = []
    start_date = date(2026, 1, 1)
    end_date = date(2026, 7, 31)
    date_range = (end_date - start_date).days

    # Distribution weights (payments dominate, fees are frequent, etc.)
    type_weights = {
        "payment": 0.40,
        "refund": 0.12,
        "payout": 0.15,
        "fee": 0.18,
        "chargeback": 0.08,
        "tax": 0.07,
    }
    types = list(type_weights.keys())
    weights = list(type_weights.values())

    # Inject ambiguous transactions at known positions
    ambiguous_positions = random.sample(range(0, count), min(len(AMBIGUOUS_DESCRIPTIONS), 10))

    for i in range(count):
        txn_date = start_date + timedelta(days=random.randint(0, date_range))

        if i in ambiguous_positions:
            amb_idx = ambiguous_positions.index(i)
            desc, likely_type, _ = AMBIGUOUS_DESCRIPTIONS[amb_idx]
            txn_type = random.choice([likely_type, "payment", "refund", "chargeback"])
            counterparty = random.choice(MERCHANTS[:10])
        else:
            txn_type = random.choices(types, weights=weights, k=1)[0]
            desc_template = random.choice(DESCRIPTIONS[txn_type])
            ref = random.randint(1000, 9999)
            desc = desc_template.format(ref=ref)
            counterparty = random.choice(MERCHANTS)

        # Amount ranges by type
        if txn_type == "payment":
            amount = round(random.uniform(150, 45000), 2)
        elif txn_type == "refund":
            amount = -round(random.uniform(100, 35000), 2)
        elif txn_type == "payout":
            amount = -round(random.uniform(5000, 200000), 2)
        elif txn_type == "fee":
            amount = -round(random.uniform(2, 800), 2)
        elif txn_type == "chargeback":
            amount = -round(random.uniform(200, 25000), 2)
        elif txn_type == "tax":
            amount = -round(random.uniform(50, 5000), 2)
        else:
            amount = round(random.uniform(100, 10000), 2)

        status_weights = {"settled": 0.75, "pending": 0.15, "failed": 0.10}
        status = random.choices(
            list(status_weights.keys()),
            weights=list(status_weights.values()),
            k=1,
        )[0]

        transactions.append(
            {
                "transaction_id": generate_transaction_id(i),
                "date": txn_date.isoformat(),
                "type": txn_type,
                "amount": amount,
                "description": desc,
                "counterparty": counterparty,
                "status": status,
            }
        )

    transactions.sort(key=lambda x: x["date"])
    return transactions


def write_csv(transactions: list[dict], filepath: str) -> str:
    fieldnames = [
        "transaction_id",
        "date",
        "type",
        "amount",
        "description",
        "counterparty",
        "status",
    ]
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(transactions)
    return filepath


if __name__ == "__main__":
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    output_path = os.path.join(data_dir, "sample_settlements.csv")

    transactions = generate_transactions(200)
    write_csv(transactions, output_path)
    print(f"Generated {len(transactions)} transactions -> {output_path}")

    # Print summary
    from collections import Counter
    type_counts = Counter(t["type"] for t in transactions)
    print("\nTransaction type distribution:")
    for t, c in sorted(type_counts.items()):
        print(f"  {t}: {c}")
