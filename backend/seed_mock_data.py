import asyncio
import uuid
from datetime import datetime
from app.database import SessionLocal, engine
from app.models import Paper, Author, PaperAuthor, SyncLog
from sqlalchemy import text

async def seed_data():
    async with SessionLocal() as session:
        # 1. Create a mock sync log
        sync_log = SyncLog(
            id=uuid.uuid4(),
            status="success",
            mode="full",
            papers_added=2,
            papers_updated=0,
            authors_created=1,
            completed_at=datetime.now()
        )
        session.add(sync_log)

        # 2. Create a mock Author
        author = Author(
            id=uuid.uuid4(),
            scopus_author_id="57204561200",
            full_name="Dr. Jane Smith",
            department="Computer Science",
            designation="Professor",
            h_index=25,
            citation_count=1200,
            is_faculty=True
        )
        session.add(author)
        await session.flush() # Get the author ID

        # 3. Create mock Papers
        paper1 = Paper(
            id=uuid.uuid4(),
            scopus_id="85100000001",
            title="Advancements in Artificial Intelligence for Healthcare",
            abstract="This paper explores the latest trends in AI applications within the healthcare sector...",
            year=2024,
            doi="10.1016/j.aihealth.2024.01",
            is_open_access=True,
            citation_count=10,
            journal_name="Journal of AI in Medicine",
            keywords=["AI", "Healthcare", "Machine Learning"]
        )
        
        paper2 = Paper(
            id=uuid.uuid4(),
            scopus_id="85100000002",
            title="Scalable Blockchain Solutions for Supply Chain Management",
            abstract="A comprehensive analysis of blockchain scalability in the context of global supply chains...",
            year=2023,
            doi="10.1109/blockchain.2023.05",
            is_open_access=False,
            citation_count=5,
            journal_name="IEEE Transactions on Blockchain",
            keywords=["Blockchain", "Supply Chain", "Distributed Systems"]
        )
        
        session.add_all([paper1, paper2])
        await session.flush()

        # 4. Associate Author with Papers
        assoc1 = PaperAuthor(
            paper_id=paper1.id,
            author_id=author.id,
            author_position=1,
            is_corresponding=True
        )
        assoc2 = PaperAuthor(
            paper_id=paper2.id,
            author_id=author.id,
            author_position=2,
            is_corresponding=False
        )
        session.add_all([assoc1, assoc2])

        await session.commit()
        print("Mock data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
