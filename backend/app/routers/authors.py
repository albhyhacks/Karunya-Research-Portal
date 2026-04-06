from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from typing import Optional, List
from uuid import UUID

from ..database import get_db
from ..models import Author, Paper, PaperAuthor
from ..schemas.author import AuthorListResponse, AuthorDetail, AuthorSummary
from ..schemas.paper import PaperListResponse

router = APIRouter()

@router.get("/", response_model=AuthorListResponse)
async def get_authors(
    q: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    query = select(Author)
    
    if q:
        query = query.where(Author.full_name.ilike(f"%{q}%"))
    if department:
        query = query.where(Author.department == department)
        
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    query = query.order_by(desc(Author.citation_count))
    
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    result = await db.execute(query)
    authors = result.scalars().all()
    
    return {
        "results": authors,
        "total": total or 0,
        "page": page,
        "per_page": per_page
    }

@router.get("/{author_id}", response_model=AuthorDetail)
async def get_author(author_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(Author).where(Author.id == author_id)
    result = await db.execute(query)
    author = result.scalar_one_or_none()
    
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    
    # Get 10 most recent papers
    papers_query = (
        select(Paper)
        .join(PaperAuthor)
        .where(PaperAuthor.author_id == author_id)
        .order_by(desc(Paper.year), desc(Paper.created_at))
        .limit(10)
    )
    papers_result = await db.execute(papers_query)
    author.recent_papers = papers_result.scalars().all()
    
    return author

@router.get("/{author_id}/papers", response_model=PaperListResponse)
async def get_author_papers(
    author_id: UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Paper)
        .join(PaperAuthor)
        .where(PaperAuthor.author_id == author_id)
    )
    
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    query = query.order_by(desc(Paper.year))
    
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
