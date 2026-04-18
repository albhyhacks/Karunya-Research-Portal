import asyncio
from app.database import SessionLocal
from app.models import Paper, Author, PaperAuthor
from sqlalchemy import select, delete, func

async def delete_orphan_papers():
    async with SessionLocal() as db:
        # Find paper IDs that have at least one Karunya author
        karunya_paper_ids_q = (
            select(PaperAuthor.paper_id)
            .join(Author, Author.id == PaperAuthor.author_id)
            .where(Author.is_faculty == True)
            .distinct()
        )
        result = await db.execute(karunya_paper_ids_q)
        karunya_ids = {row[0] for row in result.all()}
        print(f"Papers WITH Karunya author: {len(karunya_ids)}")

        # Find all paper IDs
        all_result = await db.execute(select(Paper.id))
        all_ids = {row[0] for row in all_result.all()}
        print(f"Total papers in DB: {len(all_ids)}")

        # Orphan paper IDs = those with NO Karunya author
        orphan_ids = all_ids - karunya_ids
        print(f"Orphan papers (no Karunya author) to delete: {len(orphan_ids)}")

        if not orphan_ids:
            print("No orphan papers found. Nothing to delete.")
            return
        
        # Delete paper_author associations first (FK constraint)
        del_assoc = await db.execute(
            delete(PaperAuthor).where(PaperAuthor.paper_id.in_(orphan_ids))
        )
        print(f"Deleted {del_assoc.rowcount} author associations.")

        # Delete the orphan papers
        del_papers = await db.execute(
            delete(Paper).where(Paper.id.in_(orphan_ids))
        )
        print(f"Deleted {del_papers.rowcount} orphan papers.")

        await db.commit()
        
        # Verify final count
        final_count = await db.scalar(select(func.count(Paper.id)))
        print(f"\nFinal paper count (Karunya only): {final_count}")

if __name__ == "__main__":
    asyncio.run(delete_orphan_papers())
