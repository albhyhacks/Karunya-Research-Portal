import asyncio
from app.database import SessionLocal
from app.models import SyncLog, Paper
from sqlalchemy import select, func

async def check_sync_logs():
    async with SessionLocal() as session:
        # Check current paper count
        paper_count = await session.scalar(select(func.count(Paper.id)))
        print(f"Current total papers: {paper_count}")
        
        # Check sync logs
        stmt = select(SyncLog).order_by(SyncLog.started_at.desc()).limit(10)
        result = await session.execute(stmt)
        logs = result.scalars().all()
        
        print("\nSync Logs:")
        for log in logs:
            print(f"ID: {log.id}, Mode: {log.mode}, Status: {log.status}, Added: {log.papers_added}, Started: {log.started_at}, Error: {log.error_message}")

if __name__ == "__main__":
    asyncio.run(check_sync_logs())
