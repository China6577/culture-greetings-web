from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base

class CardComposition(Base):
    __tablename__ = 'card_compositions'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(64), unique=True)
    request_fingerprint: Mapped[str] = mapped_column(String(64), default='')
    country_code: Mapped[str] = mapped_column(String(10))
    locale: Mapped[str] = mapped_column(String(12))
    occasion: Mapped[str] = mapped_column(String(100))
    user_prompt: Mapped[str] = mapped_column(String(2000))
    custom_message: Mapped[str] = mapped_column(String(500))
    composition_json: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class GenerationJob(Base):
    __tablename__ = 'generation_jobs'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    request_id: Mapped[str] = mapped_column(String(64), unique=True)
    fingerprint: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(20), default='queued', index=True)
    input_json: Mapped[dict] = mapped_column(JSONB)
    events: Mapped[list] = mapped_column(JSONB, default=list)
    artifacts: Mapped[dict] = mapped_column(JSONB, default=dict)
    error_code: Mapped[str | None] = mapped_column(String(80))
    result_id: Mapped[str | None] = mapped_column(ForeignKey('card_compositions.id', ondelete='SET NULL'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
