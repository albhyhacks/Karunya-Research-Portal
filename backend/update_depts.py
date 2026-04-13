import asyncio
import hashlib
from sqlalchemy import select, update
from app.database import SessionLocal
from app.models import Author

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

async def update_authors():
    async with SessionLocal() as db:
        result = await db.execute(select(Author))
        authors = result.scalars().all()
        for author in authors:
            if author.scopus_author_id:
                dept = _assign_department(author.scopus_author_id)
                await db.execute(
                    update(Author)
                    .where(Author.id == author.id)
                    .values(department=dept)
                )
        await db.commit()
        print(f"Updated {len(authors)} authors with departments.")

if __name__ == "__main__":
    asyncio.run(update_authors())
