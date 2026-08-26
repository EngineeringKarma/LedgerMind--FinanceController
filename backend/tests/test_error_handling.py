import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.errors import (
    LedgerMindError,
    AuthenticationError,
    AuthorizationError,
    SessionNotFoundError,
    LLMServiceError,
    CSVParseError,
    JobConflictError,
)


# ── Minimal test app to exercise exception handlers ──────────────────────────

error_app = FastAPI()


@error_app.get("/raise/auth-error")
async def raise_auth_error():
    raise AuthenticationError("Bad credentials")


@error_app.get("/raise/authz-error")
async def raise_authz_error():
    raise AuthorizationError("Forbidden")


@error_app.get("/raise/session-not-found")
async def raise_session_not_found():
    raise SessionNotFoundError("sess_123")


@error_app.get("/raise/llm-error")
async def raise_llm_error():
    raise LLMServiceError("Groq API down")


@error_app.get("/raise/csv-error")
async def raise_csv_error():
    raise CSVParseError("Invalid columns")


@error_app.get("/raise/job-conflict")
async def raise_job_conflict():
    raise JobConflictError("Job already running")


@error_app.get("/raise/unhandled")
async def raise_unhandled():
    raise RuntimeError("Something broke")


@error_app.get("/raise/generic-ledger")
async def raise_generic_ledger():
    raise LedgerMindError("Custom error", status_code=418)


# Register the LedgerMind error handler on the test app
from app.main import ledgermind_error_handler, global_error_handler

error_app.exception_handler(LedgerMindError)(ledgermind_error_handler)
error_app.exception_handler(Exception)(global_error_handler)


client = TestClient(error_app, raise_server_exceptions=False)


# ── Tests ────────────────────────────────────────────────────────────────────


class TestErrorMapping:
    def test_auth_error_401(self):
        resp = client.get("/raise/auth-error")
        assert resp.status_code == 401
        body = resp.json()
        assert body["detail"] == "Bad credentials"
        assert body["error_type"] == "AuthenticationError"
        assert "request_id" in body

    def test_authz_error_403(self):
        resp = client.get("/raise/authz-error")
        assert resp.status_code == 403
        assert resp.json()["error_type"] == "AuthorizationError"

    def test_session_not_found_404(self):
        resp = client.get("/raise/session-not-found")
        assert resp.status_code == 404
        assert "sess_123" in resp.json()["detail"]

    def test_llm_error_502(self):
        resp = client.get("/raise/llm-error")
        assert resp.status_code == 502
        assert resp.json()["error_type"] == "LLMServiceError"

    def test_csv_error_422(self):
        resp = client.get("/raise/csv-error")
        assert resp.status_code == 422
        assert resp.json()["error_type"] == "CSVParseError"

    def test_job_conflict_409(self):
        resp = client.get("/raise/job-conflict")
        assert resp.status_code == 409
        assert resp.json()["error_type"] == "JobConflictError"

    def test_unhandled_error_500(self):
        resp = client.get("/raise/unhandled")
        assert resp.status_code == 500
        assert resp.json()["error_type"] == "InternalServerError"

    def test_generic_ledger_error(self):
        resp = client.get("/raise/generic-ledger")
        assert resp.status_code == 418
        assert resp.json()["detail"] == "Custom error"


class TestErrorShape:
    def test_response_body_shape(self):
        resp = client.get("/raise/auth-error")
        body = resp.json()
        assert set(body.keys()) == {"detail", "error_type", "request_id"}
