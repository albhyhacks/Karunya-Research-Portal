import asyncio
from app.database import SessionLocal
from app.models import Paper
from sqlalchemy import select, func

async def inspect():
    async with SessionLocal() as db:
        # Total papers
        total = await db.scalar(select(func.count(Paper.id)))
        
        # Papers with (No title)
        no_title = await db.scalar(select(func.count(Paper.id)).where(Paper.title == "(No title)"))
        
        # Newest 5 papers with actual info
        result = await db.execute(
            select(Paper).where(Paper.title != "(No title)").order_by(Paper.updated_at.desc()).limit(5)
        )
        recent_fixed = result.scalars().all()
        
        print(f"Total Papers in DB: {total}")
        print(f"Papers awaiting fix (No title): {no_title}")
        print(f"Recently updated papers:")
        for p in recent_fixed:
            print(f"  [{p.scopus_id}] {p.title[:50]}... | Citations: {p.citation_count}")

if __name__ == "__main__":
    asyncio.run(inspect())
