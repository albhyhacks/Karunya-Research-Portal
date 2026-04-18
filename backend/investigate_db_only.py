import asyncio
from app.database import SessionLocal
from app.models import Paper, Author, PaperAuthor
from sqlalchemy import select

async def investigate_db(scopus_id):
    async with SessionLocal() as db:
        result = await db.execute(select(Paper).where(Paper.scopus_id == scopus_id))
        paper = result.scalar_one_or_none()
        if paper:
            print(f"== PAPER IN DB ==")
            print(f"  Scopus ID: {paper.scopus_id}")
            print(f"  Title: {paper.title}")
            print(f"  Year: {paper.year}")
            print(f"  Journal: {paper.journal_name}")
            print(f"  Citations: {paper.citation_count}")
            print(f"  Countries: {paper.countries}")
            
            pa_result = await db.execute(
                select(Author).join(PaperAuthor, Author.id == PaperAuthor.author_id)
                .where(PaperAuthor.paper_id == paper.id)
            )
            authors = pa_result.scalars().all()
            print(f"  Authors ({len(authors)}):")
            for a in authors:
                print(f"    - [{a.scopus_author_id}] {a.full_name} | is_faculty={a.is_faculty}")
        else:
            print(f"Paper {scopus_id} NOT in database.")

if __name__ == "__main__":
    asyncio.run(investigate_db("105001593997"))
