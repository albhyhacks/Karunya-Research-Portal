from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from datetime import datetime
from typing import List

from ..database import get_db
from ..models import Paper, Author, PaperAuthor
from ..schemas.admin import AnalyticsOverview, YearlyOutput, TopItem, DepartmentBreakdown
from ..services.cache import cache

router = APIRouter()

@router.get("/overview", response_model=AnalyticsOverview)
async def get_overview(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:overview"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    # Total Papers
    total_papers = await db.scalar(select(func.count()).select_from(Paper))
    
    # Total Authors
    total_authors = await db.scalar(select(func.count()).select_from(Author))
    
    # Total Citations
    total_citations = await db.scalar(select(func.sum(Paper.citation_count))) or 0
    
    # Most Cited Paper
    most_cited = await db.execute(
        select(Paper.title, Paper.citation_count, Paper.id)
        .order_by(desc(Paper.citation_count))
        .limit(1)
    )
    row = most_cited.first()
    most_cited_paper = None
    if row:
        most_cited_paper = {
            "title": row[0],
            "citations": row[1],
            "paper_id": row[2]
        }
    
    # Papers This Year
    this_year = datetime.now().year
    papers_this_year = await db.scalar(
        select(func.count()).where(Paper.year == this_year)
    ) or 0
    
    data = {
        "total_papers": total_papers or 0,
        "total_authors": total_authors or 0,
        "total_citations": int(total_citations),
        "most_cited_paper": most_cited_paper,
        "papers_this_year": papers_this_year
    }
    await cache.set(cache_key, data)
    return data

@router.get("/yearly-output", response_model=List[YearlyOutput])
async def get_yearly_output(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:yearly_output"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    this_year = datetime.now().year
    query = (
        select(Paper.year, func.count())
        .where(Paper.year >= this_year - 10)
        .group_by(Paper.year)
        .order_by(Paper.year)
    )
    result = await db.execute(query)
    data = [{"year": row[0], "count": row[1]} for row in result.all() if row[0] is not None]
    await cache.set(cache_key, data)
    return data

@router.get("/top-journals", response_model=List[TopItem])
async def get_top_journals(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:top_journals"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    query = (
        select(Paper.journal_name, func.count())
        .where(Paper.journal_name.isnot(None))
        .group_by(Paper.journal_name)
        .order_by(desc(func.count()))
        .limit(10)
    )
    result = await db.execute(query)
    data = [{"name": row[0], "count": row[1]} for row in result.all()]
    await cache.set(cache_key, data)
    return data

@router.get("/top-keywords", response_model=List[TopItem])
async def get_top_keywords(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:top_keywords"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    subquery = select(func.unnest(Paper.keywords).label("keyword"))
    query = (
        select(subquery.c.keyword, func.count())
        .group_by(subquery.c.keyword)
        .order_by(desc(func.count()))
        .limit(15)
    )
    result = await db.execute(query)
    data = [{"name": row[0], "count": row[1]} for row in result.all()]
    await cache.set(cache_key, data)
    return data

@router.get("/department-breakdown", response_model=List[DepartmentBreakdown])
async def get_department_breakdown(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:dept_breakdown"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    query = (
        select(
            Author.department,
            func.count(func.distinct(Paper.id)).label("paper_count"),
            func.count(func.distinct(Author.id)).label("author_count")
        )
        .join(PaperAuthor)
        .join(Paper)
        .where(Author.department.isnot(None))
        .group_by(Author.department)
        .order_by(desc(text("paper_count")))
    )
    result = await db.execute(query)
    data = [
        {
            "department": row[0],
            "paper_count": row[1],
            "author_count": row[2]
        } for row in result.all()
    ]
    await cache.set(cache_key, data)
    return data
