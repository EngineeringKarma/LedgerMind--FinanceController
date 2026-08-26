import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
import aiosqlite

from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.database import get_db, create_user, get_user_by_email
from app.errors import AuthenticationError

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="Password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: str


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Register a new user account."""
    existing = await get_user_by_email(db, req.email)
    if existing:
        raise AuthenticationError("Email already registered")

    user_id = str(uuid.uuid4())[:12]
    password_hash = hash_password(req.password)
    await create_user(db, user_id, req.email, password_hash)

    token = create_access_token(user_id, req.email)
    return TokenResponse(access_token=token, user_id=user_id, email=req.email)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Login with email and password."""
    user = await get_user_by_email(db, req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise AuthenticationError("Invalid email or password")

    token = create_access_token(user["id"], user["email"])
    return TokenResponse(access_token=token, user_id=user["id"], email=user["email"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info."""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        created_at=current_user["created_at"],
    )
