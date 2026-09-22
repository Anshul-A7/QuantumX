import asyncio
import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def resolve_db_url() -> str:
    url = os.getenv("DATABASE_URL") or settings.DATABASE_URL
    # If using the defunct / paused Supabase tenant reference or empty, default to resilient local SQLite
    if not url or "vknujqpzwbxmfhdcgxpa" in url:
        return "sqlite+aiosqlite:///./quantumx.db"
    return url


ACTIVE_DB_URL = resolve_db_url()

# Configure engine arguments based on driver
engine_kwargs = {
    "echo": False,
}

if ACTIVE_DB_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["connect_args"] = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 20,
        "max_overflow": 20,
        "pool_recycle": 1800,
        "pool_timeout": 5,
    })

engine = create_async_engine(
    ACTIVE_DB_URL,
    **engine_kwargs,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Resilient SQLite fallback engine if primary connection ever drops
fallback_engine = create_async_engine(
    "sqlite+aiosqlite:///./quantumx.db",
    connect_args={"check_same_thread": False},
)
FallbackSessionLocal = async_sessionmaker(
    bind=fallback_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yields a database session with automatic fallback to local SQLite if primary drops."""
    try:
        async with AsyncSessionLocal() as session:
            yield session
    except Exception as exc:
        print(f"[QuantumX Database] Session error ({exc}), activating local session fallback...")
        async with FallbackSessionLocal() as session:
            yield session


async def init_db() -> None:
    """
    Initialize all database tables automatically on startup.
    Ensures both primary and fallback databases are always migrated and operational.
    """
    global engine, AsyncSessionLocal
    import app.models  # Registers User, UserSession, VerificationToken, Screening, Notification

    # Always ensure local fallback database schema is fully populated
    try:
        async with fallback_engine.begin() as fconn:
            await fconn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"[QuantumX Database] Fallback schema init note: {e}")

    try:
        async def _connect_primary():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

        await asyncio.wait_for(_connect_primary(), timeout=4.0)
        print(f"[QuantumX Backend] Database connected ({'SQLite' if ACTIVE_DB_URL.startswith('sqlite') else 'PostgreSQL'}) and schema initialized.")
    except Exception as db_err:
        print(f"[QuantumX Backend] Remote DB connection note: {db_err}")
        print("[QuantumX Backend] Activating resilient local storage fallback (quantumx.db)...")
        engine = fallback_engine
        AsyncSessionLocal = FallbackSessionLocal
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[QuantumX Backend] Local database fallback initialized and operational.")