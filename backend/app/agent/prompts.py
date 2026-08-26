SYSTEM_PROMPT = """You are a senior finance controller's AI assistant specializing in payment gateway settlement reconciliation. Your job is to categorize each transaction into a specific financial category and subcategory.

## Category Taxonomy

| Category | Subcategories |
|----------|---------------|
| Revenue | Subscription Revenue, Service Revenue, Product Sales, Affiliate Revenue |
| Refunds | Full Refund, Partial Refund, Goodwill Credit, Processing Fee Refund |
| Gateway Fees | Payment Processing Fee (MDR), Platform Fee, Settlement Fee, Chargeback Fee, Refund Processing Fee |
| Payouts | Merchant Payout, Bulk Settlement, Instant Payout, T+1 Settlement |
| Tax (GST/TDS) | GST Collected, TDS Deducted, TCS Collected, GST Remittance, TDS Certificate |
| Chargebacks | Chargeback Received, Chargeback Won, Chargeback Lost, Representment, Dispute Resolution |
| Settlements | Settlement Adjustment, Reconciliation Entry, Batch Settlement, Correction Entry |
| Other/Uncategorized | Unclassified Transaction, Manual Review Required, Ambiguous Entry |

## Classification Rules

1. **Be specific.** Choose the most precise subcategory. "Payment Processing Fee (MDR)" is better than just "Gateway Fees".
2. **Consider context.** Look at the transaction type, amount, description, and counterparty together.
3. **Handle ambiguity.** If a description like "Adjustment - Ref #3391" could be multiple things, use the transaction type hint but note uncertainty in your reasoning.
4. **Confidence scoring.** Rate your confidence from 0.0 to 1.0:
   - 0.9-1.0: Clear, unambiguous transaction with strong keyword matches
   - 0.7-0.89: Likely correct based on context clues
   - 0.5-0.69: Somewhat ambiguous, reasonable interpretation
   - 0.0-0.49: Highly ambiguous, needs human review
5. **Flag for review.** Set needs_review=true when confidence < 0.7 or when the description is deliberately vague.

## Output Format

Return a JSON object with a "transactions" array containing the categorized transactions. Each object must have exactly these fields:
{
  "transaction_id": "string",
  "category": "string (from taxonomy)",
  "subcategory": "string (from taxonomy)",
  "confidence": float (0.0-1.0),
  "reasoning": "string (1 sentence explaining your classification)",
  "needs_review": bool
}"""

FEW_SHOT_EXAMPLES = [
    {
        "input": {
            "transaction_id": "txn_AbCdEfGh",
            "date": "2026-03-15",
            "type": "fee",
            "amount": -142.50,
            "description": "MDR charges for UPI transaction",
            "counterparty": "Razorpay Software Private Ltd",
            "status": "settled",
        },
        "output": {
            "transaction_id": "txn_AbCdEfGh",
            "category": "Gateway Fees",
            "subcategory": "Payment Processing Fee (MDR)",
            "confidence": 0.95,
            "reasoning": "Description explicitly mentions 'MDR' which is the Merchant Discount Rate — a standard payment processing fee.",
            "needs_review": False,
        },
    },
    {
        "input": {
            "transaction_id": "txn_XyZ12345",
            "date": "2026-04-22",
            "type": "refund",
            "amount": -8500.00,
            "description": "Refund initiated for order #4421",
            "counterparty": "Flipkart Online Services Pvt Ltd",
            "status": "settled",
        },
        "output": {
            "transaction_id": "txn_XyZ12345",
            "category": "Refunds",
            "subcategory": "Full Refund",
            "confidence": 0.92,
            "reasoning": "Transaction type is 'refund' with a large negative amount and 'Refund initiated' in the description — clear full refund.",
            "needs_review": False,
        },
    },
    {
        "input": {
            "transaction_id": "txn_amb12345",
            "date": "2026-05-10",
            "type": "payment",
            "amount": 12500.00,
            "description": "Adjustment - Ref #3391",
            "counterparty": "Zomato Ltd",
            "status": "settled",
        },
        "output": {
            "transaction_id": "txn_amb12345",
            "category": "Revenue",
            "subcategory": "Service Revenue",
            "confidence": 0.55,
            "reasoning": "Transaction type is 'payment' with positive amount, suggesting revenue — but 'Adjustment - Ref' is ambiguous and could indicate a correction. Flagging for review.",
            "needs_review": True,
        },
    },
    {
        "input": {
            "transaction_id": "txn_PqRsTuVw",
            "date": "2026-06-01",
            "type": "payout",
            "amount": -185000.00,
            "description": "Payout to merchant bank account",
            "counterparty": "HDFC Bank Ltd",
            "status": "settled",
        },
        "output": {
            "transaction_id": "txn_PqRsTuVw",
            "category": "Payouts",
            "subcategory": "Merchant Payout",
            "confidence": 0.96,
            "reasoning": "Type is 'payout', large negative amount, and description confirms merchant bank account transfer — standard settlement payout.",
            "needs_review": False,
        },
    },
    {
        "input": {
            "transaction_id": "txn_ChBk9999",
            "date": "2026-03-28",
            "type": "chargeback",
            "amount": -3200.00,
            "description": "Chargeback received - Case #7712",
            "counterparty": "Amazon Seller Services",
            "status": "pending",
        },
        "output": {
            "transaction_id": "txn_ChBk9999",
            "category": "Chargebacks",
            "subcategory": "Chargeback Received",
            "confidence": 0.94,
            "reasoning": "Type is 'chargeback' and description explicitly says 'Chargeback received' with a case number — clear chargeback initiation.",
            "needs_review": False,
        },
    },
    {
        "input": {
            "transaction_id": "txn_Tax12345",
            "date": "2026-04-15",
            "type": "tax",
            "amount": -2840.00,
            "description": "TDS deducted at source - 2%",
            "counterparty": "ICICI Bank Limited",
            "status": "settled",
        },
        "output": {
            "transaction_id": "txn_Tax12345",
            "category": "Tax (GST/TDS)",
            "subcategory": "TDS Deducted",
            "confidence": 0.97,
            "reasoning": "Type is 'tax', description explicitly states 'TDS deducted at source' — standard TDS deduction.",
            "needs_review": False,
        },
    },
    {
        "input": {
            "transaction_id": "txn_Amb45678",
            "date": "2026-05-20",
            "type": "refund",
            "amount": -4500.00,
            "description": "Adjustment - Ref #3391",
            "counterparty": "Swiggy Instamart",
            "status": "settled",
        },
        "output": {
            "transaction_id": "txn_Amb45678",
            "category": "Settlements",
            "subcategory": "Settlement Adjustment",
            "confidence": 0.58,
            "reasoning": "Type says 'refund' but 'Adjustment - Ref' with an ambiguous reference could be a settlement correction. The description is deliberately vague — flagging for human review.",
            "needs_review": True,
        },
    },
    {
        "input": {
            "transaction_id": "txn_Revers12",
            "date": "2026-06-12",
            "type": "refund",
            "amount": -7800.00,
            "description": "Transaction reversal #1199",
            "counterparty": "PhonePe Private Limited",
            "status": "settled",
        },
        "output": {
            "transaction_id": "txn_Revers12",
            "category": "Refunds",
            "subcategory": "Full Refund",
            "confidence": 0.72,
            "reasoning": "Type is 'refund' with 'Transaction reversal' — likely a full refund reversal, but could also indicate a chargeback reversal. Moderate confidence.",
            "needs_review": False,
        },
    },
]


def build_user_message(transactions: list[dict]) -> str:
    """Build the user message containing a batch of transactions to categorize."""
    import json

    return (
        "Categorize the following transactions. "
        "Return a JSON object with a 'transactions' array containing exactly one categorized object per input transaction.\n\n"
        + json.dumps(transactions, indent=2)
    )


def build_messages(transactions: list[dict]) -> list[dict]:
    """Build the full message list for the Groq API call."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add few-shot examples
    for ex in FEW_SHOT_EXAMPLES:
        messages.append({"role": "user", "content": build_user_message([ex["input"]])})
        import json

        messages.append({"role": "assistant", "content": json.dumps({"transactions": [ex["output"]]}, indent=2)})

    # Add the actual batch
    messages.append({"role": "user", "content": build_user_message(transactions)})

    return messages
