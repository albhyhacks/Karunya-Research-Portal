"""
Backfill existing papers with missing keywords and countries
by re-fetching details from Scopus Abstract Retrieval API.
Only updates papers that have empty keywords or empty countries.
"""
import asyncio
import logging
from sqlalchemy import select, update
from app.database import SessionLocal
from app.models import Paper
from app.services.scopus import ScopusClient
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def backfill():
    client = ScopusClient(api_key=settings.SCOPUS_API_KEY)
    async with SessionLocal() as db:
        # Get papers with empty keywords OR empty countries
        result = await db.execute(
            select(Paper.id, Paper.scopus_id, Paper.title).where(
                Paper.scopus_id.isnot(None)
            ).order_by(Paper.year.desc())
        )
        papers = result.all()
        logger.info(f"Found {len(papers)} papers to check")
        
        updated = 0
        errors = 0
        for paper_id, scopus_id, title in papers:
            try:
                data = await client.get_paper_details(scopus_id)
                keywords = data.get("keywords", [])
                countries = data.get("countries", [])
                is_oa = data.get("is_open_access", False)
                
                await db.execute(
                    update(Paper)
                    .where(Paper.id == paper_id)
                    .values(
                        keywords=keywords,
                        countries=countries,
                        is_open_access=is_oa
                    )
                )
                updated += 1
                if updated % 10 == 0:
                    await db.commit()
                    logger.info(f"Updated {updated}/{len(papers)} papers...")
                
                await asyncio.sleep(0.4)  # rate limit
            except Exception as e:
                logger.error(f"Error updating paper {scopus_id}: {e}")
                errors += 1
                continue
        
        await db.commit()
        logger.info(f"Done. Updated: {updated}, Errors: {errors}")

if __name__ == "__main__":
    asyncio.run(backfill())
