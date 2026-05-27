import asyncio
import sys
sys.path.insert(0, '.')

from app.database import engine
from sqlalchemy import text, select, func
from sqlalchemy.orm import column_property
from app.models import Author, PaperAuthor

# We monkey patch for testing:
Author.papers_count = column_property(
    select(func.count(PaperAuthor.paper_id))
    .where(PaperAuthor.author_id == Author.id)
    .correlate_except(PaperAuthor)
    .scalar_subquery()
)

async def run():
    async with engine.connect() as conn:
        res = await conn.execute(select(Author.full_name, Author.papers_count).limit(5))
        for r in res.fetchall():
            print(f"Author: {r[0]}, Papers: {r[1]}")

asyncio.run(run())
