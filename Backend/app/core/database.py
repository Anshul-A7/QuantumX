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


# Configure engine arguments based on driver
engine_kwargs = {
    "echo": False,
}

if settings.DATABASE_URL.startswith("sqlite"):
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
        "pool_timeout": 10,
    })

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """
    Initialize all database tables automatically on startup.
    If the remote Supabase database is unreachable or tenant is paused,
    automatically activates local SQLite fallback so user registration and sessions never fail.
    """
    global engine, AsyncSessionLocal
    import app.models  # Registers User, UserSession, VerificationToken, Screening, Notification

    try:
        async def _connect_primary():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

        await asyncio.wait_for(_connect_primary(), timeout=5.0)
        print("[QuantumX Backend] Primary database connected and schema initialized.")
    except Exception as db_err:
        print(f"[QuantumX Backend] Remote DB connection note: {db_err}")
        print("[QuantumX Backend] Activating resilient local storage fallback (quantumx.db)...")
        fallback_url = "sqlite+aiosqlite:///./quantumx.db"
        engine = create_async_engine(fallback_url, connect_args={"check_same_thread": False})
        AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[QuantumX Backend] Local database fallback initialized and operational.")