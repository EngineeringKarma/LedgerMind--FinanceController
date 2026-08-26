import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.upload import router as upload_router
from app.routes.categorize import router as categorize_router
from app.routes.reports import router as reports_router

app = FastAPI(
    title="LedgerMind",
    description="AI Finance Controller — auto-categorize transactions and generate reports",
    version="0.1.0",
)

origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(categorize_router)
app.include_router(reports_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ledgermind"}
