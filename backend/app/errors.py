from fastapi import HTTPException


class LedgerMindError(HTTPException):
    """Base exception for LedgerMind with structured error responses."""
    def __init__(self, detail: str, status_code: int = 500):
        super().__init__(status_code=status_code, detail=detail)
        self.detail = detail


class AuthenticationError(LedgerMindError):
    def __init__(self, detail: str = "Invalid or missing authentication"):
        super().__init__(detail=detail, status_code=401)


class AuthorizationError(LedgerMindError):
    def __init__(self, detail: str = "You do not have permission to access this resource"):
        super().__init__(detail=detail, status_code=403)


class SessionNotFoundError(LedgerMindError):
    def __init__(self, session_id: str = ""):
        msg = f"Session '{session_id}' not found" if session_id else "Session not found"
        super().__init__(detail=msg, status_code=404)


class LLMServiceError(LedgerMindError):
    def __init__(self, detail: str = "LLM service temporarily unavailable"):
        super().__init__(detail=detail, status_code=502)


class CSVParseError(LedgerMindError):
    def __init__(self, detail: str = "Failed to parse CSV file"):
        super().__init__(detail=detail, status_code=422)


class JobConflictError(LedgerMindError):
    def __init__(self, detail: str = "A job is already in progress for this session"):
        super().__init__(detail=detail, status_code=409)
