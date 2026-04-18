import asyncio
import sys
sys.path.insert(0, '.')

from app.database import engine
from sqlalchemy import text
from app.models import Author, Paper, PaperAuthor

async def calculate_h_index_and_citations():
    async with engine.connect() as conn:
        # First, find all authors
        res = await conn.execute(text("SELECT id FROM authors"))
        author_ids = [r[0] for r in res.fetchall()]
        
        for author_id in author_ids:
            # Get all citation counts of papers for this author, in descending order
            papers_res = await conn.execute(
                text("""
                SELECT p.citation_count 
                FROM papers p
                JOIN paper_authors pa ON p.id = pa.paper_id
                WHERE pa.author_id = :author_id
                ORDER BY p.citation_count DESC
                """),
                {"author_id": author_id}
            )
            citations = [r[0] for r in papers_res.fetchall()]
            
            # Calculate total citations
            total_citations = sum(citations)
            
            # Calculate h-index
            h_index = 0
            for i, c in enumerate(citations):
                if c >= i + 1:
                    h_index = i + 1
                else:
                    break
                    
            # Update the author
            await conn.execute(
                text("""
                UPDATE authors 
                SET citation_count = :total_citations, h_index = :h_index
                WHERE id = :id
                """),
                {"total_citations": total_citations, "h_index": h_index, "id": str(author_id)}
            )
            
        await conn.commit()
        print("Updated all authors successfully.")

asyncio.run(calculate_h_index_and_citations())
