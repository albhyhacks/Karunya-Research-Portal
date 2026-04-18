import asyncio
import logging
import sys
from datetime import datetime
from typing import Set, List, Dict, Any

from app.database import SessionLocal
from app.models import Paper, Author, PaperAuthor
from app.services.sync import SyncService
from app.config import settings
from sqlalchemy import select

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

class FastSync:
    def __init__(self, concurrency: int = 10):
        self.sync_service = SyncService()
        self.semaphore = asyncio.Semaphore(concurrency)
        self.existing_ids: Set[str] = set()
        self.stats = {"added": 0, "skipped": 0, "errors": 0}

    async def initialize(self):
        """Fetch existing scopus_ids from DB to avoid re-fetching."""
        async with SessionLocal() as session:
            result = await session.execute(select(Paper.scopus_id))
            self.existing_ids = {row[0] for row in result.all() if row[0]}
        logger.info(f"Initialized with {len(self.existing_ids)} existing papers in database.")

    async def process_paper(self, search_entry: Dict[str, Any], session_factory):
        async with self.semaphore:
            scopus_id = search_entry.get("dc:identifier", "").replace("SCOPUS_ID:", "")
            
            # Temporary override: Process all papers to fix author is_faculty flags
            # if scopus_id in self.existing_ids:
            #     async with session_factory() as session:
            #         res = await session.execute(select(Paper.title).where(Paper.scopus_id == scopus_id))
            #         title = res.scalar()
            #         if title and title != "(No title)":
            #             self.stats["skipped"] += 1
            #             return

            try:
                # Fetch full details (abstract/full authors)
                detail_data = await self.sync_service.client.get_paper_details(scopus_id)
                
                # MERGE: Search data is primary for Title/Journal/Citations
                # Detail data is primary for Abstract/Authors
                search_paper_data = self.sync_service.client._normalize_paper(search_entry)
                
                # Combine them
                final_paper_data = {
                    **search_paper_data,
                    "abstract": detail_data.get("abstract") or search_paper_data.get("abstract", ""),
                    "keywords": detail_data.get("keywords") or search_paper_data.get("keywords", []),
                    "countries": detail_data.get("countries") or search_paper_data.get("countries", []),
                    "authors": detail_data.get("authors") or search_paper_data.get("authors", [])
                }
                
                async with session_factory() as session:
                    async with session.begin():
                        # Upsert paper
                        paper = await self.sync_service._upsert_paper(session, final_paper_data)
                        
                        # Upsert authors and associations
                        for auth_item in final_paper_data["authors"]:
                            if not auth_item.get("scopus_author_id"):
                                continue
                            author = await self.sync_service._upsert_author(session, auth_item)
                            from sqlalchemy.dialects.sqlite import insert
                            assoc_stmt = insert(PaperAuthor).values(
                                paper_id=paper.id,
                                author_id=author.id,
                                author_position=auth_item["position"],
                                is_corresponding=auth_item["is_corresponding"]
                            ).on_conflict_do_nothing()
                            await session.execute(assoc_stmt)
                
                self.stats["added"] += 1
                if self.stats["added"] % 20 == 0:
                    logger.info(f"Progress: Handled {self.stats['added']} papers, Skipped {self.stats['skipped']}, Errors {self.stats['errors']}")
            except Exception as e:
                logger.error(f"Error processing paper {scopus_id}: {e}")
                self.stats["errors"] += 1
            
            await asyncio.sleep(0.1)

    async def run(self):
        await self.initialize()
        
        affiliation_id = settings.SCOPUS_AFFILIATION_ID
        start = 0
        count = 200 # Optimized batch size
        total = 1
        
        logger.info(f"Starting optimized sync for affiliation {affiliation_id}")
        
        while start < total:
            try:
                # Use the client directly for search batches
                data = await self.sync_service.client._request("GET", "search/scopus", params={
                    "query": f"AF-ID({affiliation_id})",
                    "count": count,
                    "start": start,
                    "sort": "citedby-count",
                    "field": "dc:title,dc:identifier,prism:coverDate,prism:doi,citedby-count,prism:publicationName,prism:issn,authkeywords,author,subtype,openaccess,affiliation"
                })
                
                results = data.get("search-results", {})
                total = int(results.get("opensearch:totalResults", 0))
                entries = results.get("entry", [])
                
                if not entries:
                    break
                
                if isinstance(entries, dict):
                    entries = [entries]
                
                # Process this batch concurrently
                tasks = [self.process_paper(entry, SessionLocal) for entry in entries]
                await asyncio.gather(*tasks)
                
                start += len(entries)
                logger.info(f"Search Progress: {start}/{total} papers scanned.")
            except Exception as e:
                logger.error(f"Error in search batch at start={start}: {e}")
                await asyncio.sleep(5) # Back off on error
                start += count # Skip ahead to avoid infinite loop on bad batch

        logger.info(f"Fast Sync Completed. Added: {self.stats['added']}, Skipped: {self.stats['skipped']}, Errors: {self.stats['errors']}")

if __name__ == "__main__":
    fs = FastSync(concurrency=10)
    asyncio.run(fs.run())
