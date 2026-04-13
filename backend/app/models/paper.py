import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, 
    String, 
    Integer, 
    Boolean, 
    Text, 
    DateTime, 
    ForeignKey, 
    Table, 
    JSON,
    UUID
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from ..database import Base

class PaperAuthor(Base):
    __tablename__ = "paper_authors"
    
    paper_id = Column(UUID(as_uuid=True), ForeignKey("papers.id"), primary_key=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("authors.id"), primary_key=True)
    author_position = Column(Integer, nullable=False) # 1 = first author
    is_corresponding = Column(Boolean, default=False)

class Paper(Base):
    __tablename__ = "papers"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scopus_id: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    doi: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    is_open_access: Mapped[bool] = mapped_column(Boolean, default=False)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)
    journal_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    journal_issn: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    document_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    countries: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    keywords: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    authors: Mapped[List["Author"]] = relationship(
        secondary="paper_authors",
        back_populates="papers"
    )

class Author(Base):
    __tablename__ = "authors"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scopus_author_id: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    orcid: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    h_index: Mapped[int] = mapped_column(Integer, default=0)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)
    is_faculty: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    papers: Mapped[List["Paper"]] = relationship(
        secondary="paper_authors",
        back_populates="authors"
    )
