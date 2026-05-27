import asyncio
from app.database import SessionLocal
from sqlalchemy import text

async def check():
    async with SessionLocal() as session:
        papers = (await session.execute(text("SELECT count(*) FROM papers"))).scalar()
        authors = (await session.execute(text("SELECT count(*) FROM authors"))).scalar()
        associations = (await session.execute(text("SELECT count(*) FROM paper_authors"))).scalar()
        print(f"Papers: {papers}")
        print(f"Authors: {authors}")
        print(f"Associations: {associations}")

if __name__ == "__main__":
    asyncio.run(check())
