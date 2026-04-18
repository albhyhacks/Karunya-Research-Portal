import asyncio
from app.database import engine, Base
from app.models.paper import Paper, Author, PaperAuthor
from app.models.thesis import Thesis
from app.models.admin import SyncLog
from app.services.sync import SyncService

async def init_db():
    print("Initializing SQLite database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("Running initial sync (this will take a few seconds)...")
    # sync_service = SyncService()
    # await sync_service.run_full_sync()
    print("Database initialization complete.")

if __name__ == "__main__":
    asyncio.run(init_db())
