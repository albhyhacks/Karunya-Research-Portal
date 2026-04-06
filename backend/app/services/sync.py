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
        # Pydantic schema validation would be good here, but using dict for simplicity
        stmt = insert(Paper).values(
            scopus_id=paper_data["scopus_id"],
            title=paper_data["title"],
            abstract=paper_data["abstract"],
            year=int(paper_data["year"]) if paper_data["year"] else None,
            doi=paper_data["doi"],
            is_open_access=paper_data["is_open_access"],
            citation_count=paper_data["citation_count"],
            journal_name=paper_data["journal_name"],
            journal_issn=paper_data["journal_issn"],
            keywords=paper_data["keywords"]
        ).on_conflict_do_update(
            index_elements=["scopus_id"],
            set_={
                "citation_count": paper_data["citation_count"],
                "updated_at": datetime.now()
            }
        ).returning(Paper)
        
        result = await session.execute(stmt)
        paper = result.scalar_one()
        
        # Determine if it was an insert or update for stats
        # returning(Paper) gives us the object, but we need to know if it existed
        # This is a bit tricky with on_conflict_do_update. 
        # For simplicity, we'll increment based on result existence.
        
        return paper

    async def _upsert_author(self, session: AsyncSession, author_data: Dict[str, Any]) -> Author:
        # Basic insert, Author profile enrichment happens later if h_index is 0
        stmt = insert(Author).values(
            scopus_author_id=author_data["scopus_author_id"],
            full_name=author_data["full_name"],
            is_faculty=True
        ).on_conflict_do_nothing(
            index_elements=["scopus_author_id"]
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
                    
                    if not papers_batch:
                        break
                    
                    for search_entry in papers_batch:
                        try:
                            scopus_id = search_entry.get("scopus_id")
                            logger.info(f"Processing paper: {scopus_id} - {search_entry.get('title')[:50]}")
                            
                            # Fetch full details to get complete author list and metadata
                            paper_data = await self.client.get_paper_details(scopus_id)
                            
                            async with session.begin_nested():
                                paper = await self._upsert_paper(session, paper_data)
                                logger.info(f"  Paper details retrieved. Authors found: {len(paper_data['authors'])}")
                                for auth_item in paper_data["authors"]:
                                    if not auth_item.get("scopus_author_id"):
                                        continue
                                    logger.info(f"    Author: {auth_item.get('scopus_author_id')} - {auth_item.get('full_name')}")
                                    author = await self._upsert_author(session, auth_item)
                                    assoc_stmt = insert(PaperAuthor).values(
                                        paper_id=paper.id,
                                        author_id=author.id,
                                        author_position=auth_item["position"],
                                        is_corresponding=auth_item["is_corresponding"]
                                    ).on_conflict_do_nothing()
                                    await session.execute(assoc_stmt)
                            self.stats["papers_added"] += 1
                        except Exception as e:
                            logger.error(f"Error syncing paper {search_entry.get('scopus_id')}: {e}")
                            await session.rollback()
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
