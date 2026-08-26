from datetime import date
from enum import Enum
from pydantic import BaseModel, Field


class TransactionType(str, Enum):
    PAYMENT = "payment"
    REFUND = "refund"
    PAYOUT = "payout"
    FEE = "fee"
    CHARGEBACK = "chargeback"
    TAX = "tax"


class TransactionStatus(str, Enum):
    SETTLED = "settled"
    PENDING = "pending"
    FAILED = "failed"


class Transaction(BaseModel):
    transaction_id: str
    date: date
    type: TransactionType
    amount: float
    description: str
    counterparty: str
    status: TransactionStatus


class CategorizedTransaction(BaseModel):
    transaction_id: str
    category: str
    subcategory: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    needs_review: bool
    # Original transaction fields for display in the transaction table
    date: str | None = None
    amount: float | None = None
    type: str | None = None
    description: str | None = None
    counterparty: str | None = None
    status: str | None = None


class PnLSummary(BaseModel):
    revenue: float = 0.0
    fees: float = 0.0
    refunds: float = 0.0
    tax: float = 0.0
    chargebacks: float = 0.0
    net: float = 0.0


class CategoryBreakdown(BaseModel):
    category: str
    total: float
    count: int


class MonthlyTrend(BaseModel):
    month: str
    revenue: float
    fees: float
    refunds: float
    tax: float = 0.0
    chargebacks: float = 0.0
    net: float


class AnomalySeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Anomaly(BaseModel):
    type: str
    description: str
    severity: AnomalySeverity


class Report(BaseModel):
    period: str
    pnl_summary: PnLSummary
    category_breakdown: list[CategoryBreakdown]
    monthly_trend: list[MonthlyTrend]
    anomalies: list[Anomaly]


class UploadResponse(BaseModel):
    session_id: str
    transaction_count: int


class CategorizeResponse(BaseModel):
    session_id: str
    categorized_count: int
    needs_review_count: int
    results: list[CategorizedTransaction]
