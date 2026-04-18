import asyncio
from app.database import SessionLocal
from app.models import Paper, Author, PaperAuthor
from sqlalchemy import select, func

async def analyze():
    async with SessionLocal() as db:
        # Total papers
        total_papers = await db.scalar(select(func.count(Paper.id)))
        
        # Papers with at least one Karunya author (is_faculty=True)
        papers_with_karunya = await db.scalar(
            select(func.count(func.distinct(PaperAuthor.paper_id)))
            .join(Author, Author.id == PaperAuthor.author_id)
            .where(Author.is_faculty == True)
        )
        
        # Papers with NO Karunya author (is_faculty=False for all authors)
        papers_without_karunya = total_papers - papers_with_karunya
        
        print(f"=== PAPER ANALYSIS ===")
        print(f"Total papers in DB: {total_papers}")
        print(f"Papers with at least 1 Karunya author: {papers_with_karunya}")
        print(f"Papers with NO Karunya author: {papers_without_karunya}")
        
        # Sample 5 papers that have NO Karunya author
        karunya_paper_ids = select(func.distinct(PaperAuthor.paper_id)).join(Author, Author.id == PaperAuthor.author_id).where(Author.is_faculty == True)
        
        orphan_papers = await db.execute(
            select(Paper)
            .where(Paper.id.not_in(karunya_paper_ids))
            .limit(5)
        )
        orphans = orphan_papers.scalars().all()
        
        print(f"\n=== SAMPLE PAPERS WITH NO KARUNYA AUTHOR ===")
        for p in orphans:
            print(f"  [{p.scopus_id}] {p.title[:60]}")
            # Get their authors
            auth_res = await db.execute(
                select(Author).join(PaperAuthor, Author.id == PaperAuthor.author_id)
                .where(PaperAuthor.paper_id == p.id)
            )
            authors = auth_res.scalars().all()
            for a in authors:
                print(f"    - {a.full_name} | is_faculty={a.is_faculty}")

if __name__ == "__main__":
    asyncio.run(analyze())
