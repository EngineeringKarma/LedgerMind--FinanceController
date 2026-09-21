#!/usr/bin/env python3
"""
LedgerMind Synthetic Data Generator

Generates realistic Razorpay-style settlement CSVs and matching bank statement
CSVs with configurable fault injection for testing reconciliation logic.

Usage:
    python scripts/gen_synthetic.py --count 200 --seed 42 --faults all
    python scripts/gen_synthetic.py --count 50 --seed 123 --fault missing-bank-credit
    python scripts/gen_synthetic.py --count 100 --faults none --out-dir scripts/synthetic

Output:
    - settlements.csv: Razorpay-style settlement rows
    - bank_statement.csv: Matching bank statement rows
    - ground_truth.json: Injected faults for test assertions
"""

import argparse
import csv
import json
import os
import random
import hashlib
from dataclasses import dataclass, field, asdict
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


# ── Constants ────────────────────────────────────────────────────────────────

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

BANKS = [
    "HDFC Bank Ltd",
    "ICICI Bank Limited",
    "Axis Bank Limited",
    "Kotak Mahindra Bank",
    "State Bank of India",
    "Paytm Payments Bank",
]

PAYMENT_DESCRIPTIONS = [
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
]

FEE_DESCRIPTIONS = [
    "MDR charges for UPI transaction",
    "Platform fee - Monthly billing",
    "Transaction fee - 2% of amount",
    "Settlement fee applied",
    "Gateway convenience fee #{ref}",
    "Processing fee for international txn",
    "Chargeback processing fee #{ref}",
    "Refund processing fee",
]

REFUND_DESCRIPTIONS = [
    "Refund initiated for order #{ref}",
    "Full refund processed - Transaction #{ref}",
    "Partial refund for item return #{ref}",
    "Refund to original payment method #{ref}",
    "Customer dispute resolved - refund issued #{ref}",
    "Adjustment - Ref #{ref}",
    "Reversal for duplicate charge #{ref}",
    "Goodwill credit issued #{ref}",
]

CHARGEBACK_DESCRIPTIONS = [
    "Chargeback received - Case #{ref}",
    "Chargeback dispute - Merchant notified",
    "Representment filed - Case #{ref}",
    "Chargeback won - Funds reversed #{ref}",
    "Chargeback lost - Debit note raised #{ref}",
    "Unauthorized transaction dispute #{ref}",
    "Cardholder dispute resolved #{ref}",
]

PAYOUT_DESCRIPTIONS = [
    "Payout to merchant bank account",
    "Settlement transfer - Batch #{ref}",
    "T+1 settlement processed",
    "Instant payout to {bank} ****{digits}",
    "Weekly settlement - Ref #{ref}",
    "Payout to {bank} ****{digits}",
    "Bulk payout processed - Ref #{ref}",
    "Express payout to {bank} ****{digits}",
]

# Default illustrative fee parameters (NOT Razorpay's real rates)
DEFAULT_FEE_RULES = {
    "upi": {"bps": 0, "flat_paise": 200, "min_paise": 100, "max_paise": 5000},
    "card": {"bps": 200, "flat_paise": 0, "min_paise": 500, "max_paise": 50000},
    "netbanking": {"bps": 150, "flat_paise": 0, "min_paise": 300, "max_paise": 30000},
    "wallet": {"bps": 180, "flat_paise": 0, "min_paise": 400, "max_paise": 40000},
    "emi": {"bps": 250, "flat_paise": 0, "min_paise": 600, "max_paise": 50000},
    "international": {"bps": 350, "flat_paise": 0, "min_paise": 1000, "max_paise": 80000},
}

PAYMENT_METHODS = list(DEFAULT_FEE_RULES.keys())
GST_RATE = Decimal("0.18")  # 18% on fees
TDS_RATE = Decimal("0.02")  # 2% TDS (illustrative)


# ── Helpers ──────────────────────────────────────────────────────────────────

def rupees_to_paise(amount_rupees: Decimal) -> int:
    """Convert rupee Decimal to integer paise. Rounds half-up."""
    return int((amount_rupees * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def paise_to_rupees(paise: int) -> Decimal:
    """Convert integer paise to rupee Decimal."""
    return Decimal(str(paise)) / Decimal("100")


def _ref(rng: random.Random) -> int:
    return rng.randint(1000, 9999)


def _digits(rng: random.Random) -> str:
    return f"{rng.randint(1000, 9999)}"


def _bank(rng: random.Random) -> str:
    return rng.choice(BANKS)


# ── Data Classes ─────────────────────────────────────────────────────────────

@dataclass
class SettlementRow:
    transaction_id: str
    date: str
    type: str
    amount: Decimal
    description: str
    counterparty: str
    status: str
    settlement_id: str
    utr: str


@dataclass
class BankRow:
    txn_date: str
    narration: str
    utr: str
    credit_paise: int
    debit_paise: int
    balance_paise: int


@dataclass
class Fault:
    type: str
    settlement_id: str | None
    transaction_id: str | None
    detail: str


@dataclass
class GroundTruth:
    seed: int
    fault_types_injected: list[str]
    faults: list[Fault]
    settlement_count: int
    total_row_count: int
    total_settlement_paise: int


# ── Generator ────────────────────────────────────────────────────────────────

class SettlementGenerator:
    """Generates realistic Razorpay settlement batches with optional fault injection."""

    def __init__(self, seed: int = 42, fee_rules: dict | None = None):
        self.seed = seed
        self.rng = random.Random(seed)
        self.fee_rules = fee_rules or DEFAULT_FEE_RULES
        self._txn_counter = 0
        self._settlement_counter = 0
        self._utr_counter = 0

    def _next_txn_id(self) -> str:
        self._txn_counter += 1
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        suffix = "".join(self.rng.choices(chars, k=8))
        return f"txn_{suffix}"

    def _next_settlement_id(self) -> str:
        self._settlement_counter += 1
        return f"SETT{self._settlement_counter:04d}"

    def _next_utr(self) -> str:
        self._utr_counter += 1
        return f"UTR{self._utr_counter:010d}"

    def _pick_payment_method(self) -> str:
        weights = [35, 25, 15, 10, 10, 5]
        return self.rng.choices(PAYMENT_METHODS, weights=weights, k=1)[0]

    def _calc_fee(self, amount_paise: int, method: str) -> int:
        """Calculate fee in paise for a given payment amount and method."""
        rules = self.fee_rules.get(method, self.fee_rules["card"])
        bps_amount = (Decimal(str(amount_paise)) * Decimal(str(rules["bps"])) / Decimal("10000"))
        fee_paise = bps_amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        fee_paise = max(fee_paise, Decimal(str(rules["min_paise"])))
        fee_paise = min(fee_paise, Decimal(str(rules["max_paise"])))
        return int(fee_paise + Decimal(str(rules["flat_paise"])))

    def _calc_gst(self, fee_paise: int) -> int:
        """Calculate GST (18%) on fee in paise."""
        return int((Decimal(str(fee_paise)) * GST_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    def _calc_tds(self, amount_paise: int) -> int:
        """Calculate TDS (2%) on payout amount in paise."""
        return int((Decimal(str(amount_paise)) * TDS_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    def _make_payment(self, date: str, counterparty: str, settlement_id: str, utr: str,
                      amount_rupees: Decimal | None = None) -> SettlementRow:
        if amount_rupees is None:
            amount_rupees = Decimal(str(round(self.rng.uniform(150, 45000), 2)))
        desc = self.rng.choice(PAYMENT_DESCRIPTIONS).format(ref=_ref(self.rng))
        method = self._pick_payment_method()
        status = self.rng.choices(["settled", "pending", "failed"], weights=[75, 15, 10], k=1)[0]
        return SettlementRow(
            transaction_id=self._next_txn_id(),
            date=date,
            type="payment",
            amount=amount_rupees,
            description=f"{desc} [{method}]",
            counterparty=counterparty,
            status=status,
            settlement_id=settlement_id,
            utr=utr,
        )

    def _make_refund(self, date: str, counterparty: str, settlement_id: str, utr: str,
                     amount_rupees: Decimal | None = None) -> SettlementRow:
        if amount_rupees is None:
            amount_rupees = Decimal(str(-round(self.rng.uniform(100, 35000), 2)))
        elif amount_rupees > 0:
            amount_rupees = -amount_rupees
        desc = self.rng.choice(REFUND_DESCRIPTIONS).format(ref=_ref(self.rng))
        status = self.rng.choices(["settled", "pending", "failed"], weights=[80, 15, 5], k=1)[0]
        return SettlementRow(
            transaction_id=self._next_txn_id(),
            date=date,
            type="refund",
            amount=amount_rupees,
            description=desc,
            counterparty=counterparty,
            status=status,
            settlement_id=settlement_id,
            utr=utr,
        )

    def _make_fee(self, date: str, counterparty: str, settlement_id: str, utr: str,
                  amount_paise: int | None = None) -> SettlementRow:
        if amount_paise is None:
            amount_paise = -int(Decimal(str(round(self.rng.uniform(200, 8000), 2))) * 100)
        desc = self.rng.choice(FEE_DESCRIPTIONS).format(ref=_ref(self.rng))
        return SettlementRow(
            transaction_id=self._next_txn_id(),
            date=date,
            type="fee",
            amount=paise_to_rupees(amount_paise),
            description=desc,
            counterparty=counterparty,
            status="settled",
            settlement_id=settlement_id,
            utr=utr,
        )

    def _make_chargeback(self, date: str, counterparty: str, settlement_id: str, utr: str) -> SettlementRow:
        amount = Decimal(str(-round(self.rng.uniform(200, 25000), 2)))
        desc = self.rng.choice(CHARGEBACK_DESCRIPTIONS).format(ref=_ref(self.rng))
        status = self.rng.choices(["settled", "pending"], weights=[70, 30], k=1)[0]
        return SettlementRow(
            transaction_id=self._next_txn_id(),
            date=date,
            type="chargeback",
            amount=amount,
            description=desc,
            counterparty=counterparty,
            status=status,
            settlement_id=settlement_id,
            utr=utr,
        )

    def _make_tax(self, date: str, counterparty: str, settlement_id: str, utr: str,
                  base_amount_paise: int | None = None, tax_type: str = "gst") -> SettlementRow:
        if tax_type == "gst":
            if base_amount_paise is None:
                base_amount_paise = int(Decimal(str(round(self.rng.uniform(500, 50000), 2))) * 100)
            tax_paise = self._calc_gst(abs(base_amount_paise))
            amount = paise_to_rupees(-tax_paise)
            desc = "GST collected on platform fees"
        elif tax_type == "tds":
            if base_amount_paise is None:
                base_amount_paise = int(Decimal(str(round(self.rng.uniform(50000, 500000), 2))) * 100)
            tax_paise = self._calc_tds(abs(base_amount_paise))
            amount = paise_to_rupees(-tax_paise)
            desc = self.rng.choice([
                "TDS deducted at source - 2%",
                "TDS u/s 194J - Professional fees",
                "TDS certificate generated - Form 16A",
            ])
        else:
            amount = Decimal(str(-round(self.rng.uniform(50, 5000), 2)))
            desc = "Tax adjustment"
        status = self.rng.choices(["settled", "pending"], weights=[80, 20], k=1)[0]
        return SettlementRow(
            transaction_id=self._next_txn_id(),
            date=date,
            type="tax",
            amount=amount,
            description=desc,
            counterparty=counterparty,
            status=status,
            settlement_id=settlement_id,
            utr=utr,
        )

    def _make_payout(self, date: str, counterparty: str) -> SettlementRow:
        amount = Decimal(str(-round(self.rng.uniform(5000, 200000), 2)))
        bank = _bank(self.rng)
        desc = self.rng.choice(PAYOUT_DESCRIPTIONS).format(
            ref=_ref(self.rng), bank=bank, digits=_digits(self.rng)
        )
        utr = self._next_utr()
        status = self.rng.choices(["settled", "pending", "failed"], weights=[75, 15, 10], k=1)[0]
        return SettlementRow(
            transaction_id=self._next_txn_id(),
            date=date,
            type="payout",
            amount=amount,
            description=desc,
            counterparty=counterparty,
            status=status,
            settlement_id=f"POUT{self._settlement_counter:04d}",
            utr=utr,
        )

    def _make_settlement_bank_row(self, settlement: dict, balance: int) -> BankRow:
        """Create one bank credit row for a settlement's net amount."""
        net_paise = settlement["net_paise"]
        return BankRow(
            txn_date=settlement["date"],
            narration=f"Razorpay Settlement UTR: {settlement['utr']}",
            utr=settlement["utr"],
            credit_paise=net_paise,
            debit_paise=0,
            balance_paise=balance + net_paise,
        )

    def _make_payout_bank_row(self, payout: SettlementRow, balance: int) -> BankRow:
        """Create one bank debit row for a payout."""
        debit_paise = rupees_to_paise(-payout.amount)
        return BankRow(
            txn_date=payout.date,
            narration=f"Razorpay Payout UTR: {payout.utr}",
            utr=payout.utr,
            credit_paise=0,
            debit_paise=debit_paise,
            balance_paise=balance - debit_paise,
        )

    def _generate_batch(self, batch_size: int, start_date_ordinal: int, end_date_ordinal: int) -> tuple[list[SettlementRow], list[dict]]:
        """Generate a batch of settlement rows and settlement summaries."""
        settlements_data = []
        all_rows = []

        # Determine number of settlements in this batch (3-8 rows per settlement)
        num_settlements = max(1, batch_size // self.rng.randint(4, 7))

        for _ in range(num_settlements):
            settlement_id = self._next_settlement_id()
            utr = self._next_utr()
            day_offset = self.rng.randint(0, end_date_ordinal - start_date_ordinal)
            date = f"2026-{1 + day_offset // 30:02d}-{1 + day_offset % 28 + 1:02d}"
            counterparty = self.rng.choice(MERCHANTS[:10])

            # Number of rows in this settlement (payments + fees + refunds)
            num_payments = self.rng.randint(1, 4)
            num_fees = self.rng.randint(1, max(1, num_payments))
            num_refunds = 1 if self.rng.random() < 0.3 else 0
            has_tax = self.rng.random() < 0.4

            settlement_rows = []

            # Generate payments
            payment_amounts_paise = []
            for _ in range(num_payments):
                amt_rupees = Decimal(str(round(self.rng.uniform(150, 45000), 2)))
                row = self._make_payment(date, counterparty, settlement_id, utr, amt_rupees)
                settlement_rows.append(row)
                payment_amounts_paise.append(rupees_to_paise(amt_rupees))

            # Generate fees (one per payment, matching the fee calculation)
            for amt_paise in payment_amounts_paise:
                method = self._pick_payment_method()
                fee_paise = self._calc_fee(amt_paise, method)
                row = self._make_fee(date, counterparty, settlement_id, utr, -fee_paise)
                settlement_rows.append(row)

            # Generate refunds (if any)
            for _ in range(num_refunds):
                refund_rupees = Decimal(str(-round(self.rng.uniform(100, 35000), 2)))
                row = self._make_refund(date, counterparty, settlement_id, utr, refund_rupees)
                settlement_rows.append(row)

            # Generate tax (GST on total fees)
            if has_tax:
                total_fees_paise = sum(abs(r.amount) for r in settlement_rows if r.type == "fee")
                total_fees_int = rupees_to_paise(total_fees_paise)
                row = self._make_tax(date, counterparty, settlement_id, utr, total_fees_int, "gst")
                settlement_rows.append(row)

            # Compute net credit (payments + refunds, both with sign)
            net_paise = sum(rupees_to_paise(r.amount) for r in settlement_rows
                           if r.type in ("payment", "refund"))

            all_rows.extend(settlement_rows)
            settlements_data.append({
                "settlement_id": settlement_id,
                "utr": utr,
                "date": date,
                "net_paise": net_paise,
                "rows": settlement_rows,
            })

        return all_rows, settlements_data

    def _inject_fault(self, all_rows: list[SettlementRow], settlements: list[dict],
                      fault_type: str) -> Fault | None:
        """Inject a specific fault into the data. Returns the Fault description."""
        if not settlements:
            return None

        if fault_type == "missing_bank_credit":
            # Pick a settlement, we'll skip its bank row later
            s = self.rng.choice(settlements)
            return Fault(
                type="missing_bank_credit",
                settlement_id=s["settlement_id"],
                transaction_id=None,
                detail=f"No bank credit row for settlement {s['settlement_id']} (UTR: {s['utr']})",
            )

        elif fault_type == "short_paid":
            s = self.rng.choice(settlements)
            short_by = self.rng.randint(1000, 50000)  # paise
            return Fault(
                type="short_paid",
                settlement_id=s["settlement_id"],
                transaction_id=None,
                detail=f"Settlement {s['settlement_id']} bank credit short by {short_by} paise "
                       f"(expected {s['net_paise']}, received {s['net_paise'] - short_by})",
                # The actual shortening happens in bank row generation
                # We store the adjustment here so tests can verify
            )

        elif fault_type == "duplicate_payment_id":
            # Find a payment row and duplicate its ID in another settlement
            payments = [r for r in all_rows if r.type == "payment"]
            if not payments:
                return None
            src = self.rng.choice(payments)
            # Create a duplicate in a different settlement
            other_settlements = [s for s in settlements if s["settlement_id"] != src.settlement_id]
            if not other_settlements:
                return None
            dst = self.rng.choice(other_settlements)
            dup = SettlementRow(
                transaction_id=src.transaction_id,  # Same ID!
                date=dst["date"],
                type="payment",
                amount=Decimal(str(round(self.rng.uniform(100, 5000), 2))),
                description=f"Duplicate of {src.transaction_id}",
                counterparty=self.rng.choice(MERCHANTS[:10]),
                status="settled",
                settlement_id=dst["settlement_id"],
                utr=dst["utr"],
            )
            all_rows.append(dup)
            return Fault(
                type="duplicate_payment_id",
                settlement_id=dst["settlement_id"],
                transaction_id=src.transaction_id,
                detail=f"Payment {src.transaction_id} appears in both {src.settlement_id} and {dst['settlement_id']}",
            )

        elif fault_type == "refund_without_payment":
            # Create a refund with no matching original payment
            s = self.rng.choice(settlements)
            refund = self._make_refund(
                s["date"],
                self.rng.choice(MERCHANTS[:10]),
                s["settlement_id"],
                s["utr"],
                Decimal(str(-round(self.rng.uniform(1000, 20000), 2))),
            )
            all_rows.append(refund)
            return Fault(
                type="refund_without_payment",
                settlement_id=s["settlement_id"],
                transaction_id=refund.transaction_id,
                detail=f"Refund {refund.transaction_id} has no matching original payment in any settlement",
            )

        elif fault_type == "captured_not_settled":
            # Create a payment with status settled but no bank row
            s = self.rng.choice(settlements)
            row = SettlementRow(
                transaction_id=self._next_txn_id(),
                date=s["date"],
                type="payment",
                amount=Decimal(str(round(self.rng.uniform(5000, 30000), 2))),
                description="Captured payment not yet settled",
                counterparty=self.rng.choice(MERCHANTS[:10]),
                status="settled",
                settlement_id=f"CAPT{self._settlement_counter:04d}",
                utr="",
            )
            all_rows.append(row)
            return Fault(
                type="captured_not_settled",
                settlement_id=row.settlement_id,
                transaction_id=row.transaction_id,
                detail=f"Payment {row.transaction_id} is marked settled but has no bank settlement credit",
            )

        elif fault_type == "wrong_fee":
            # Find a fee row and adjust its amount
            fees = [r for r in all_rows if r.type == "fee"]
            if not fees:
                return None
            fee = self.rng.choice(fees)
            original = fee.amount
            # Increase fee by 10-50% (simulate wrong MDR)
            multiplier = Decimal(str(round(self.rng.uniform(1.10, 1.50), 2)))
            fee.amount = original * multiplier  # More negative = higher fee
            return Fault(
                type="wrong_fee",
                settlement_id=fee.settlement_id,
                transaction_id=fee.transaction_id,
                detail=f"Fee {fee.transaction_id} adjusted from {original} to {fee.amount} "
                       f"(simulating wrong MDR rate)",
            )

        elif fault_type == "wrong_gst":
            # Find a tax row (GST) and adjust its amount
            taxes = [r for r in all_rows if r.type == "tax" and "GST" in r.description]
            if not taxes:
                return None
            tax = self.rng.choice(taxes)
            original = tax.amount
            # GST should be 18% of fees; set it to 24% (wrong)
            tax.amount = original * Decimal("1.33")  # ~33% too high
            return Fault(
                type="wrong_gst",
                settlement_id=tax.settlement_id,
                transaction_id=tax.transaction_id,
                detail=f"GST {tax.transaction_id} adjusted from {original} to {tax.amount} "
                       f"(simulating wrong GST rate, should be 18% of fees)",
            )

        return None

    def generate(
        self,
        count: int = 200,
        faults: list[str] | None = None,
        fault_count: int = 1,
    ) -> tuple[list[SettlementRow], list[BankRow], GroundTruth]:
        """
        Generate settlement data, bank statement, and ground truth.

        Args:
            count: Approximate number of settlement rows to generate.
            faults: List of fault type names to inject, or None for no faults.
            fault_count: Number of each fault type to inject.

        Returns:
            (settlement_rows, bank_rows, ground_truth)
        """
        # Generate date range
        from datetime import date
        start = date(2026, 1, 1)
        end = date(2026, 7, 31)
        start_ord = start.toordinal()
        end_ord = end.toordinal()

        # Generate settlements one at a time until we have enough rows
        settlements_data = []
        all_rows = []
        while len(all_rows) < count:
            batch_rows, batch_settlements = self._generate_batch(
                min(10, count - len(all_rows)), start_ord, end_ord
            )
            all_rows.extend(batch_rows)
            settlements_data.extend(batch_settlements)

        # Trim to requested count: keep only complete settlements that fit
        if len(all_rows) > count:
            # Find the last settlement boundary that keeps us at or under count
            cutoff_idx = count
            while cutoff_idx > 0 and all_rows[cutoff_idx - 1].settlement_id == all_rows[min(cutoff_idx, len(all_rows) - 1)].settlement_id:
                cutoff_idx -= 1
            # If we backed up to 0, just take the first `count` rows
            if cutoff_idx == 0:
                cutoff_idx = count
            all_rows = all_rows[:cutoff_idx]
            kept_ids = {r.settlement_id for r in all_rows}
            settlements_data = [s for s in settlements_data if s["settlement_id"] in kept_ids]

        # Sort by date then type
        all_rows.sort(key=lambda r: (r.date, r.type))

        # Build bank statement rows (normal, before fault injection)
        balance = 1_000_000_00  # Starting balance: 10,00,000.00 in paise
        bank_rows: list[BankRow] = []
        settlements_with_bank_rows = set()

        for s in settlements_data:
            # Check if this settlement has any rows in the final data
            has_rows = any(r.settlement_id == s["settlement_id"] for r in all_rows)
            if not has_rows:
                continue

            # Create bank credit row for this settlement
            bank_row = self._make_settlement_bank_row(s, balance)
            balance = bank_row.balance_paise
            bank_rows.append(bank_row)
            settlements_with_bank_rows.add(s["settlement_id"])

        # Add bank rows for payouts
        for row in all_rows:
            if row.type == "payout" and row.utr:
                bank_row = self._make_payout_bank_row(row, balance)
                balance = bank_row.balance_paise
                bank_rows.append(bank_row)

        # Inject faults
        injected_faults: list[Fault] = []
        fault_types_injected: list[str] = []
        missing_bank_settlements = set()
        short_paid_settlements = {}

        if faults and "all" in faults:
            faults = sorted(DEFAULTFaults)

        if faults:
            for fault_type in faults:
                for _ in range(fault_count):
                    fault = self._inject_fault(all_rows, settlements_data, fault_type)
                    if fault:
                        injected_faults.append(fault)
                        fault_types_injected.append(fault_type)

                        if fault_type == "missing_bank_credit" and fault.settlement_id:
                            missing_bank_settlements.add(fault.settlement_id)
                        elif fault_type == "short_paid" and fault.settlement_id:
                            # Parse the short amount from detail
                            short_by = self.rng.randint(1000, 50000)
                            short_paid_settlements[fault.settlement_id] = short_by

        # Remove bank rows for missing_bank_credit faults
        missing_utrs = set()
        for f in injected_faults:
            if f.type == "missing_bank_credit" and f.settlement_id:
                for s in settlements_data:
                    if s["settlement_id"] == f.settlement_id:
                        missing_utrs.add(s["utr"])
        bank_rows = [br for br in bank_rows if br.utr not in missing_utrs]

        # Short-paid: adjust bank credit amounts
        for f in injected_faults:
            if f.type == "short_paid" and f.settlement_id:
                short_by = short_paid_settlements.get(f.settlement_id, 0)
                for s in settlements_data:
                    if s["settlement_id"] == f.settlement_id:
                        for br in bank_rows:
                            if br.utr == s["utr"] and br.credit_paise > 0:
                                br.credit_paise -= short_by
                                br.balance_paise -= short_by

        # Sort bank rows by date
        bank_rows.sort(key=lambda r: r.txn_date)

        # Build ground truth
        total_settlement_paise = sum(
            sum(rupees_to_paise(r.amount) for r in all_rows if r.settlement_id == s["settlement_id"]
                and r.type in ("payment", "refund"))
            for s in settlements_data
        )

        ground_truth = GroundTruth(
            seed=self.seed,
            fault_types_injected=sorted(set(fault_types_injected)),
            faults=injected_faults,
            settlement_count=len(settlements_data),
            total_row_count=len(all_rows),
            total_settlement_paise=total_settlement_paise,
        )

        return all_rows, bank_rows, ground_truth


# ── Default fault types (for --faults all) ──────────────────────────────────

DEFAULTFaults = {
    "missing_bank_credit",
    "short_paid",
    "duplicate_payment_id",
    "refund_without_payment",
    "captured_not_settled",
    "wrong_fee",
    "wrong_gst",
}


# ── CSV Writers ──────────────────────────────────────────────────────────────

SETTLEMENT_FIELDS = [
    "transaction_id", "date", "type", "amount", "description",
    "counterparty", "status", "settlement_id", "utr",
]

BANK_FIELDS = [
    "txn_date", "narration", "utr", "credit_paise", "debit_paise", "balance_paise",
]


def write_settlements_csv(rows: list[SettlementRow], path: str) -> str:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=SETTLEMENT_FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "transaction_id": row.transaction_id,
                "date": row.date,
                "type": row.type,
                "amount": str(row.amount),
                "description": row.description,
                "counterparty": row.counterparty,
                "status": row.status,
                "settlement_id": row.settlement_id,
                "utr": row.utr,
            })
    return path


def write_bank_csv(rows: list[BankRow], path: str) -> str:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=BANK_FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "txn_date": row.txn_date,
                "narration": row.narration,
                "utr": row.utr,
                "credit_paise": row.credit_paise,
                "debit_paise": row.debit_paise,
                "balance_paise": row.balance_paise,
            })
    return path


def write_ground_truth(gt: GroundTruth, path: str) -> str:
    data = {
        "seed": gt.seed,
        "fault_types_injected": gt.fault_types_injected,
        "settlement_count": gt.settlement_count,
        "total_row_count": gt.total_row_count,
        "total_settlement_paise": gt.total_settlement_paise,
        "faults": [
            {
                "type": f.type,
                "settlement_id": f.settlement_id,
                "transaction_id": f.transaction_id,
                "detail": f.detail,
            }
            for f in gt.faults
        ],
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return path


# ── CLI ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic Razorpay settlement data with fault injection"
    )
    parser.add_argument("--count", type=int, default=200,
                        help="Number of settlement rows to generate (default: 200)")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for reproducibility (default: 42)")
    parser.add_argument("--faults", nargs="+", default=None,
                        choices=list(DEFAULTFaults) + ["all", "none"],
                        help="Fault types to inject (default: none). Use 'all' for all faults.")
    parser.add_argument("--fault-count", type=int, default=1,
                        help="Number of each fault type to inject (default: 1)")
    parser.add_argument("--out-dir", type=str, default="scripts/synthetic",
                        help="Output directory (default: scripts/synthetic)")
    args = parser.parse_args()

    # Resolve faults
    faults = args.faults
    if faults and "none" in faults:
        faults = None
    elif faults and "all" in faults:
        faults = list(DEFAULTFaults)

    # Generate
    gen = SettlementGenerator(seed=args.seed)
    settlement_rows, bank_rows, ground_truth = gen.generate(
        count=args.count,
        faults=faults,
        fault_count=args.fault_count,
    )

    # Write output
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    settlements_path = write_settlements_csv(settlement_rows, str(out_dir / "settlements.csv"))
    bank_path = write_bank_csv(bank_rows, str(out_dir / "bank_statement.csv"))
    gt_path = write_ground_truth(ground_truth, str(out_dir / "ground_truth.json"))

    # Summary
    print(f"Generated {len(settlement_rows)} settlement rows -> {settlements_path}")
    print(f"Generated {len(bank_rows)} bank statement rows -> {bank_path}")
    print(f"Ground truth -> {gt_path}")
    print(f"Seed: {args.seed}")

    if ground_truth.fault_types_injected:
        print(f"\nFaults injected ({len(ground_truth.faults)} total):")
        for ft in ground_truth.fault_types_injected:
            count = sum(1 for f in ground_truth.faults if f.type == ft)
            print(f"  {ft}: {count}")
    else:
        print("\nNo faults injected.")

    # Type distribution
    from collections import Counter
    type_counts = Counter(r.type for r in settlement_rows)
    print(f"\nTransaction type distribution:")
    for t, c in sorted(type_counts.items()):
        print(f"  {t}: {c}")


if __name__ == "__main__":
    main()
