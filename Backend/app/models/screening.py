from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Screening(Base):
    __tablename__ = "screenings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    patient_id: Mapped[str] = mapped_column(String(128), nullable=False)
    disease_type: Mapped[str] = mapped_column(String(64), nullable=False)
    quantum_prediction: Mapped[str] = mapped_column(String(64), nullable=False)
    quantum_confidence: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    classical_prediction: Mapped[str] = mapped_column(String(64), nullable=False)
    classical_confidence: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(32), nullable=False)
    top_driver: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quantum_execution_time_ms: Mapped[int] = mapped_column(Integer, default=16)
    classical_execution_time_ms: Mapped[int] = mapped_column(Integer, default=3)
    input_features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    gate_attributions: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    clinical_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
