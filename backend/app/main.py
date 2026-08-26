import os
import logging
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.errors import LedgerMindError
from app.routes.upload import router as upload_router
from app.routes.categorize import router as categorize_router
from app.routes.reports import router as reports_router
from app.routes.sessions import router as sessions_router
from app.routes.auth import router as auth_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ledgermind")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    logger.info("LedgerMind started")
    yield
    logger.info("LedgerMind shutting down")


app = FastAPI(
    title="LedgerMind",
    description="AI Finance Controller — auto-categorize transactions and generate reports",
    version="0.3.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request ID Middleware ──────────────────────────────────────────────────────

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add a unique request ID to every request for log correlation."""
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ── Global Exception Handlers ─────────────────────────────────────────────────

@app.exception_handler(LedgerMindError)
async def ledgermind_error_handler(request: Request, exc: LedgerMindError):
    """Handle all custom LedgerMind errors with structured JSON responses."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.warning(
        f"[{request_id}] {exc.status_code}: {exc.detail} | "
        f"{request.method} {request.url.path}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_type": type(exc).__name__,
            "request_id": request_id,
        },
    )


@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    """Catch-all handler for unhandled exceptions."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.exception(f"[{request_id}] Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_type": "InternalServerError",
            "request_id": request_id,
        },
    )


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(categorize_router)
app.include_router(reports_router)
app.include_router(sessions_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ledgermind", "version": "0.3.0"}
