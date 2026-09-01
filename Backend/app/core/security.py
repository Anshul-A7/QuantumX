import hashlib
import hmac
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# =========================================================
# PASSWORD HASHING (BCRYPT)
# =========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """Safely hashes passwords using bcrypt."""
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    password_hash: str,
) -> bool:
    """Verifies a plain password against its bcrypt hash."""
    return pwd_context.verify(
        plain_password,
        password_hash,
    )


# =========================================================
# CRYPTOGRAPHIC HELPERS & TOKEN HASHING
# =========================================================

def hash_token(token: str) -> str:
    """Generates a SHA-256 hex digest for storing session/refresh tokens securely in DB."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_secure_token(length: int = 48) -> str:
    """Generates a cryptographically secure URL-safe random string."""
    return secrets.token_urlsafe(length)


def generate_otp(length: int = 6) -> str:
    """Generates a cryptographically secure numeric OTP."""
    digits = string.digits
    return "".join(secrets.choice(digits) for _ in range(length))


# =========================================================
# ACCESS TOKEN (SHORT-LIVED JWT)
# =========================================================

def create_access_token(
    subject: str,
    expires_minutes: int | None = None,
    session_id: str | None = None,
) -> str:
    """Creates a signed short-lived JWT access token."""
    exp_mins = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=exp_mins)

    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": expire,
        "jti": secrets.token_hex(16),
    }

    if session_id:
        payload["sid"] = session_id

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


# =========================================================
# REFRESH TOKEN (SLIDING 7-DAY JWT & DB-TRACKED SESSION)
# =========================================================

def create_refresh_token(
    subject: str,
    session_id: str,
    expires_days: int | None = None,
) -> str:
    """Creates a signed refresh token tied to a database session."""
    exp_days = expires_days or settings.REFRESH_TOKEN_EXPIRE_DAYS
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=exp_days)

    payload: dict[str, Any] = {
        "sub": str(subject),
        "sid": session_id,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": expire,
        "jti": secrets.token_hex(16),
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


# =========================================================
# DECODE TOKENS WITH STRICT CLAIMS VALIDATION
# =========================================================

def decode_token(token: str) -> dict[str, Any]:
    """Decodes and validates signature and expiration of any JWT."""
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require_exp": True, "require_sub": True},
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """Decodes an access token and strictly verifies its type and subject."""
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise JWTError("Invalid access token type")

    if not payload.get("sub"):
        raise JWTError("Invalid access token subject")

    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    """Decodes a refresh token and strictly verifies its type, subject, and session ID."""
    payload = decode_token(token)

    if payload.get("type") != "refresh":
        raise JWTError("Invalid refresh token type")

    if not payload.get("sub"):
        raise JWTError("Invalid refresh token subject")

    if not payload.get("sid"):
        raise JWTError("Invalid refresh token session reference")

    return payload