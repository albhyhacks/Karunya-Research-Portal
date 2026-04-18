from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class AuthorBase(BaseModel):
    full_name: str
    orcid: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    h_index: int = 0
    citation_count: int = 0
    papers_count: int = 0
    is_faculty: bool = True

class AuthorSummary(AuthorBase):
    id: UUID
    scopus_author_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class PaperSummaryBasic(BaseModel):
    id: UUID
    title: str
    year: Optional[int] = None
    journal_name: Optional[str] = None
    citation_count: int = 0
    model_config = ConfigDict(from_attributes=True)

class AuthorDetail(AuthorSummary):
    created_at: datetime
    recent_papers: List[PaperSummaryBasic] = []

class AuthorListResponse(BaseModel):
    results: List[AuthorSummary]
    total: int
    page: int
    per_page: int
