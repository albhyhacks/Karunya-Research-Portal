import asyncio
from app.database import SessionLocal
from app.models import Author
from sqlalchemy import select, func

async def count_authors():
    async with SessionLocal() as db:
        count = await db.scalar(select(func.count(Author.id)))
        print(f"Total Authors: {count}")

if __name__ == "__main__":
    asyncio.run(count_authors())
