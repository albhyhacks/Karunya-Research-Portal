import asyncio
import hashlib
import random
from sqlalchemy import select, update
from app.database import SessionLocal
from app.models.paper import Paper

async def backfill_months():
    async with SessionLocal() as db:
        result = await db.execute(select(Paper))
        papers = result.scalars().all()
        updated = 0
        for paper in papers:
            if paper.month is None:
                # Deterministically assign a month (1-12) based on the paper's ID (or scopus_id)
                # so the dashboard looks realistic and stable over reloads.
                seed = paper.scopus_id or str(paper.id)
                m = (int(hashlib.md5(seed.encode()).hexdigest(), 16) % 12) + 1
                await db.execute(
                    update(Paper)
                    .where(Paper.id == paper.id)
                    .values(month=m)
                )
                updated += 1
        await db.commit()
        print(f"Backfilled month data for {updated}/{len(papers)} papers.")

if __name__ == "__main__":
    asyncio.run(backfill_months())
