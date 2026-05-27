"""
Augment PaperAuthor links: For each paper, add 2-4 co-authors from
the existing author pool, assigned to different departments, to simulate
realistic multi-author cross-departmental collaboration patterns.
Uses deterministic seeding based on paper Scopus ID so results are reproducible.
"""
import asyncio
import random
import logging
from sqlalchemy import select, func
from sqlalchemy.dialects.sqlite import insert
from app.database import SessionLocal
from app.models import Paper, Author, PaperAuthor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def augment_coauthors():
    async with SessionLocal() as db:
        # Load all papers
        papers = (await db.execute(select(Paper.id, Paper.scopus_id))).all()
        # Load all authors grouped by department
        authors = (await db.execute(select(Author.id, Author.scopus_author_id, Author.department))).all()
        
        # Build dept -> [author_ids] map
        dept_authors = {}
        for a_id, _, dept in authors:
            if dept:
                dept_authors.setdefault(dept, []).append(a_id)
        
        dept_list = list(dept_authors.keys())
        if len(dept_list) < 2:
            logger.warning("Not enough departments to create cross-dept links")
            return
        
        total_added = 0
        for paper_id, scopus_id in papers:
            # Deterministic random per paper
            rng = random.Random(hash(scopus_id) % (2**32))
            
            # Get current first author for this paper
            first_author_res = await db.execute(
                select(PaperAuthor.author_id).where(
                    PaperAuthor.paper_id == paper_id,
                    PaperAuthor.author_position == 1
                )
            )
            first_author_id = first_author_res.scalar_one_or_none()
            
            # Pick first author's department
            if first_author_id:
                author_dept_res = await db.execute(
                    select(Author.department).where(Author.id == first_author_id)
                )
                first_dept = author_dept_res.scalar_one_or_none()
            else:
                first_dept = rng.choice(dept_list)
            
            # Pick 1-3 additional departments different from first author's
            other_depts = [d for d in dept_list if d != first_dept]
            n_coauthors = rng.randint(1, min(3, len(other_depts)))
            coauthor_depts = rng.sample(other_depts, n_coauthors)
            
            for pos, dept in enumerate(coauthor_depts, start=2):
                pool = dept_authors.get(dept, [])
                if not pool:
                    continue
                author_id = rng.choice(pool)
                
                # Skip if this author is already linked to this paper
                await db.execute(
                    insert(PaperAuthor).values(
                        paper_id=paper_id,
                        author_id=author_id,
                        author_position=pos,
                        is_corresponding=False
                    ).on_conflict_do_nothing()
                )
                total_added += 1
        
        await db.commit()
        
        # Final stats
        final_links = await db.scalar(select(func.count()).select_from(PaperAuthor))
        logger.info(f"Augmented {total_added} co-author links. Total PaperAuthor links: {final_links}")

if __name__ == "__main__":
    asyncio.run(augment_coauthors())
