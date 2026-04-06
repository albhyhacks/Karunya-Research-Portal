from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class AuthorInfo(BaseModel):
    id: UUID
    full_name: str
    department: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class PaperAuthorSchema(BaseModel):
    scopus_author_id: str
    full_name: str
    author_position: int
    is_corresponding: bool
    
    model_config = ConfigDict(from_attributes=True)

class PaperBase(BaseModel):
    title: str
    abstract: Optional[str] = None
    year: Optional[int] = None
    doi: Optional[str] = None
    is_open_access: bool = False
    citation_count: int = 0
    journal_name: Optional[str] = None
    journal_issn: Optional[str] = None
    keywords: Optional[List[str]] = None

class PaperSummary(PaperBase):
    id: UUID
    scopus_id: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PaperDetail(PaperSummary):
    authors: List[AuthorInfo]
    updated_at: datetime

class PaperListResponse(BaseModel):
    results: List[PaperSummary]
    total: int
    page: int
    per_page: int
