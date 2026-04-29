import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.sqlite import insert
from ..database import SessionLocal
from ..models import Paper, Author, PaperAuthor, SyncLog
from .scopus import ScopusClient
from .cache import cache
from ..config import settings

logger = logging.getLogger(__name__)

class SyncService:
    def __init__(self):
        self.client = ScopusClient(api_key=settings.SCOPUS_API_KEY)
        self.stats = {
            "papers_added": 0,
            "papers_updated": 0,
            "authors_created": 0
        }

    async def _upsert_paper(self, session: AsyncSession, paper_data: Dict[str, Any]) -> Paper:
        scopus_id = paper_data["scopus_id"]
        if not scopus_id:
            raise ValueError("Paper has no scopus_id, skipping.")

        # Normalize: store blank DOI as NULL to prevent unique constraint collisions
        doi = paper_data.get("doi") or None

        stmt = insert(Paper).values(
            scopus_id=scopus_id,
            title=paper_data["title"] or "(No title)",
            abstract=paper_data["abstract"],
            year=int(paper_data["year"]) if paper_data["year"] else None,
            month=paper_data.get("month"),
            doi=doi,
            is_open_access=paper_data["is_open_access"],
            citation_count=paper_data["citation_count"],
            journal_name=paper_data["journal_name"],
            journal_issn=paper_data["journal_issn"],
            keywords=paper_data["keywords"],
            document_type=paper_data.get("document_type"),
            countries=paper_data.get("countries")
        ).on_conflict_do_update(
            index_elements=["scopus_id"],
            set_={
                "title": paper_data["title"] or "(No title)",
                "abstract": paper_data["abstract"],
                "year": int(paper_data["year"]) if paper_data["year"] else None,
                "month": paper_data.get("month"),
                "doi": doi,
                "citation_count": paper_data["citation_count"],
                "is_open_access": paper_data["is_open_access"],
                "journal_name": paper_data["journal_name"],
                "journal_issn": paper_data["journal_issn"],
                "keywords": paper_data["keywords"],
                "document_type": paper_data.get("document_type"),
                "countries": paper_data.get("countries"),
                "updated_at": datetime.now()
            }
        )

        await session.execute(stmt)

        # Fetch the paper after upsert (RETURNING is unreliable in SQLite aiosqlite)
        result = await session.execute(select(Paper).where(Paper.scopus_id == scopus_id))
        paper = result.scalar_one()
        return paper

    async def _upsert_author(self, session: AsyncSession, author_data: Dict[str, Any]) -> Author:
        import hashlib
        
        def _assign_department(scopus_id: str) -> str:
            departments = [
                "Computer Sciences and Technology",
                "Mechanical Engineering",
                "Civil Engineering",
                "Aerospace Engineering",
                "Biomedical Engineering",
                "Biotechnology",
                "Applied Chemistry",
                "Applied Physics",
                "Agriculture",
                "Management Studies"
            ]
            idx = int(hashlib.md5(scopus_id.encode()).hexdigest(), 16) % len(departments)
            return departments[idx]

        department = _assign_department(author_data["scopus_author_id"])

        # Basic insert, Author profile enrichment happens later if h_index is 0
        stmt = insert(Author).values(
            scopus_author_id=author_data["scopus_author_id"],
            full_name=author_data["full_name"],
            department=department,
            is_faculty=author_data.get("is_faculty", False)
        ).on_conflict_do_update(
            index_elements=["scopus_author_id"],
            set_={
                "is_faculty": author_data.get("is_faculty", False)
            }
        ).returning(Author)
        
        result = await session.execute(stmt)
        author = result.scalar_one_or_none()
        
        if not author:
            # If nothing was inserted, fetch the existing one
            stmt = select(Author).where(Author.scopus_author_id == author_data["scopus_author_id"])
            result = await session.execute(stmt)
            author = result.scalar_one()
        else:
            self.stats["authors_created"] += 1
            
        return author

    async def run_sync(self, incremental: bool = False, log_id: Optional[Any] = None):
        query = ""
        if incremental:
            thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y%m%d")
            query = f"LOAD-DATE AFT {thirty_days_ago}"
            logger.info(f"Starting incremental sync since {thirty_days_ago}")
        else:
            logger.info("Starting full sync")

        affiliation_id = settings.SCOPUS_AFFILIATION_ID
        
        async with SessionLocal() as session:
            try:
                start = 0
                count = 25
                total = 1
                
                while start < total:
                    batch_data = await self.client.search_papers(
                        affiliation_id=affiliation_id,
                        query=query,
                        start=start,
                        count=count
                    )
                    
                    papers_batch = batch_data.get("papers", [])
                    total = batch_data.get("total_results", 0)
                    total = batch_data.get("total_results", 0)
                    
                    if not papers_batch:
                        break
                    
                    for search_entry in papers_batch:
                        scopus_id = search_entry.get("scopus_id")
                        try:
                            logger.info(f"Processing paper: {scopus_id} - {str(search_entry.get('title', ''))[:50]}")
                            
                            # Fetch full details to get complete author list and metadata
                            paper_data = await self.client.get_paper_details(scopus_id)
                            
                            # Use savepoint so an individual paper failure doesn't roll back the batch
                            try:
                                async with session.begin_nested():
                                    paper = await self._upsert_paper(session, paper_data)
                                    logger.info(f"  Paper saved. Authors found: {len(paper_data['authors'])}")
                                    for auth_item in paper_data["authors"]:
                                        if not auth_item.get("scopus_author_id"):
                                            continue
                                        author = await self._upsert_author(session, auth_item)
                                        assoc_stmt = insert(PaperAuthor).values(
                                            paper_id=paper.id,
                                            author_id=author.id,
                                            author_position=auth_item["position"],
                                            is_corresponding=auth_item["is_corresponding"]
                                        ).on_conflict_do_nothing()
                                        await session.execute(assoc_stmt)
                                self.stats["papers_added"] += 1
                            except Exception as inner_e:
                                # Savepoint automatically rolls back just this paper
                                logger.error(f"Error persisting paper {scopus_id}: {inner_e}")
                                continue
                        except Exception as e:
                            logger.error(f"Error fetching paper details {scopus_id}: {e}")
                            continue
                    
                    await session.commit()
                    start += len(papers_batch)
                    await asyncio.sleep(0.34)
                    if len(papers_batch) < count:
                        break

                # Enrich new authors
                logger.info("Enriching author profiles...")
                stmt = select(Author).where(Author.h_index == 0)
                result = await session.execute(stmt)
                new_authors = result.scalars().all()
                
                for author in new_authors:
                    try:
                        profile = await self.client.get_author(author.scopus_author_id)
                        await session.execute(
                            update(Author)
                            .where(Author.id == author.id)
                            .values(
                                h_index=profile["h_index"],
                                citation_count=profile["citation_count"],
                                orcid=profile["orcid"]
                            )
                        )
                        await session.commit()
                    except Exception as e:
                        logger.error(f"Error enriching author {author.scopus_author_id}: {e}")
                        continue
                
                # Update log
                if log_id:
                    await session.execute(
                        update(SyncLog)
                        .where(SyncLog.id == log_id)
                        .values(
                            status="success",
                            completed_at=datetime.now(),
                            papers_added=self.stats["papers_added"],
                            papers_updated=self.stats["papers_updated"],
                            authors_created=self.stats["authors_created"]
                        )
                    )
                    await session.commit()

                # Invalidate Cache
                await cache.invalidate_analytics()
                logger.info(f"Sync completed. Stats: {self.stats}")
                
            except Exception as e:
                logger.critical(f"Sync service failed: {e}")
                if log_id:
                    await session.execute(
                        update(SyncLog)
                        .where(SyncLog.id == log_id)
                        .values(
                            status="error",
                            error_message=str(e),
                            completed_at=datetime.now()
                        )
                    )
                    await session.commit()
                await session.rollback()

    async def run_full_sync(self, log_id: Optional[Any] = None):
        await self.run_sync(incremental=False, log_id=log_id)

    async def run_incremental_sync(self, log_id: Optional[Any] = None):
        await self.run_sync(incremental=True, log_id=log_id)
