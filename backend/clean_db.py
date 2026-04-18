import asyncio
from app.database import SessionLocal
from sqlalchemy import text

async def clean():
    async with SessionLocal() as session:
        # Show counts before
        papers_before = (await session.execute(text("SELECT count(*) FROM papers"))).scalar()
        authors_before = (await session.execute(text("SELECT count(*) FROM authors"))).scalar()
        print(f"Before: Papers={papers_before}, Authors={authors_before}")

        # Delete all papers (associations cascade)
        await session.execute(text("DELETE FROM paper_authors"))
        await session.execute(text("DELETE FROM papers"))
        await session.execute(text("DELETE FROM authors"))
        await session.commit()

        papers_after = (await session.execute(text("SELECT count(*) FROM papers"))).scalar()
        authors_after = (await session.execute(text("SELECT count(*) FROM authors"))).scalar()
        print(f"After: Papers={papers_after}, Authors={authors_after}")
        print("Database cleaned. Ready for fresh sync.")

if __name__ == "__main__":
    asyncio.run(clean())
