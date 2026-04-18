from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, asc
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..models import Paper, Author, PaperAuthor
from ..schemas.paper import PaperListResponse, PaperDetail, PaperSummary

router = APIRouter()

@router.get("/", response_model=PaperListResponse)
async def get_papers(
    q: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    author_id: Optional[UUID] = Query(None),
    department: Optional[str] = Query(None),
    is_open_access: Optional[bool] = Query(None),
    collaboration: Optional[str] = Query("all", enum=["all", "internal", "collaborative"]),
    sort: str = Query("year_desc", enum=["citations_desc", "citations_asc", "year_desc", "year_asc"]),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    # Base query: only papers that have at least one verified Karunya author
    karunya_paper_ids = (
        select(PaperAuthor.paper_id)
        .join(Author, Author.id == PaperAuthor.author_id)
        .where(Author.is_faculty == True)
        .distinct()
        .scalar_subquery()
    )
    query = select(Paper).where(Paper.id.in_(karunya_paper_ids))
    
    # Collaboration logic
    if collaboration == "internal":
        # Papers where absolutely NO external authors exist
        external_paper_ids = (
            select(PaperAuthor.paper_id)
            .join(Author, Author.id == PaperAuthor.author_id)
            .where(Author.is_faculty == False)
            .distinct()
            .scalar_subquery()
        )
        query = query.where(~Paper.id.in_(external_paper_ids))
    elif collaboration == "collaborative":
        # Papers where AT LEAST ONE external author exists
        external_paper_ids = (
            select(PaperAuthor.paper_id)
            .join(Author, Author.id == PaperAuthor.author_id)
            .where(Author.is_faculty == False)
            .distinct()
            .scalar_subquery()
        )
        query = query.where(Paper.id.in_(external_paper_ids))
    
    # Simple search for SQLite compatibility
    if q:
        search_term = f"%{q}%"
        query = query.where(
            or_(
                Paper.title.ilike(search_term),
                Paper.abstract.ilike(search_term)
            )
        )
        
    # Filters
    if year_from:
        query = query.where(Paper.year >= year_from)
    if year_to:
        query = query.where(Paper.year <= year_to)
    if is_open_access is not None:
        query = query.where(Paper.is_open_access == is_open_access)
    if author_id:
        query = query.join(PaperAuthor).where(PaperAuthor.author_id == author_id)
    if department:
        query = query.join(PaperAuthor).join(Author).where(Author.department == department)
        
    # Total count (before pagination)
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Sorting
    sort_map = {
        "citations_desc": desc(Paper.citation_count),
        "citations_asc": asc(Paper.citation_count),
        "year_desc": desc(Paper.year),
        "year_asc": asc(Paper.year)
    }
    query = query.order_by(sort_map.get(sort, desc(Paper.year)))
    
    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    result = await db.execute(query)
    papers = result.scalars().all()
    
    return {
        "results": papers,
        "total": total or 0,
        "page": page,
        "per_page": per_page
    }

@router.get("/{paper_id}", response_model=PaperDetail)
async def get_paper(paper_id: UUID, db: AsyncSession = Depends(get_db)):
    # Fetch paper with authors
    query = select(Paper).where(Paper.id == paper_id)
    result = await db.execute(query)
    paper = result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Get authors manually because relationship might need ordering or specific fields
    author_query = (
        select(Author)
        .join(PaperAuthor)
        .where(PaperAuthor.paper_id == paper_id)
        .order_by(PaperAuthor.author_position)
    )
    authors_result = await db.execute(author_query)
    authors = authors_result.scalars().all()
    
    # PaperDetail requires 'authors' field
    # We can handle this by adding authors to the paper object dynamically or using a custom mapping
    paper.authors_list = authors # Pydantic will pick this up if mapped
    
    return paper # Note: PaperDetail expects 'authors'. We might need to map manualy
