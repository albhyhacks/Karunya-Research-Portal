import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, UUID, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from ..database import Base

class SyncLog(Base):
    __tablename__ = "sync_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(String, default="running") # running, success, error
    mode: Mapped[str] = mapped_column(String) # full, incremental
    papers_added: Mapped[int] = mapped_column(Integer, default=0)
    papers_updated: Mapped[int] = mapped_column(Integer, default=0)
    authors_created: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
