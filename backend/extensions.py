"""
Extensions — Database engine, session management, JWT utilities, and FastAPI dependencies.
Replaces Flask-SQLAlchemy and Flask-JWT-Extended with plain SQLAlchemy + python-jose.
"""

from datetime import datetime, timedelta, timezone
from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings

# ---------------------------------------------------------------------------
# SQLAlchemy setup
# ---------------------------------------------------------------------------

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Session:
    """Get a standalone DB session (for use outside of request context, e.g. agents).
    Caller is responsible for closing the session."""
    return SessionLocal()


# ---------------------------------------------------------------------------
# JWT utilities
# ---------------------------------------------------------------------------

security = HTTPBearer(auto_error=False)


def create_access_token(identity: str) -> str:
    """Create a JWT access token for the given user identity (user ID as string)."""
    expire = datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_ACCESS_TOKEN_EXPIRE_SECONDS)
    payload = {
        "sub": str(identity),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    """Decode a JWT token and return the user identity (sub claim), or None."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# FastAPI auth dependencies
# ---------------------------------------------------------------------------

def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> int:
    """FastAPI dependency: extract and validate the current user ID from JWT.
    Raises 401 if token is missing or invalid."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return int(user_id)


def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[int]:
    """FastAPI dependency: extract user ID from JWT if present, otherwise return None.
    Does NOT raise 401 — useful for endpoints with optional auth."""
    if credentials is None:
        return None
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        return None
    return int(user_id)
