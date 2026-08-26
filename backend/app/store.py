from app.models.schemas import Report

# In-memory session storage
sessions: dict[str, list[dict]] = {}
categorized_sessions: dict[str, list[dict]] = {}
reports: dict[str, Report] = {}
