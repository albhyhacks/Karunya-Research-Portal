from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

# Analytics Schemas
class AnalyticsOverview(BaseModel):
    total_papers: int
    total_authors: int
    total_citations: int
    most_cited_paper: Optional[dict] = None # {title, citations, paper_id}
    papers_this_year: int

class YearlyOutput(BaseModel):
    year: int
    count: int

class TopItem(BaseModel):
    name: str # journal_name or keyword
    count: int

class DepartmentBreakdown(BaseModel):
    department: str
    paper_count: int
    author_count: int

# Admin Schemas
class SyncStatus(BaseModel):
    last_sync_at: Optional[datetime]
    papers_added: int
    papers_updated: int
    authors_created: int
    status: str # success, error, running
    error_message: Optional[str]

class AdminStats(BaseModel):
    papers: int
    authors: int
    theses: int

class ThesisRead(BaseModel):
    id: UUID
    title: str
    abstract: Optional[str]
    year: Optional[int]
    author_name: str
    supervisor_name: Optional[str]
    department: Optional[str]
    degree_type: Optional[str]
    file_url: Optional[str]
    created_at: datetime
