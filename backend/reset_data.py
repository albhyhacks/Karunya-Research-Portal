import asyncio
import sys
from sqlalchemy import text, inspect
from app.database import engine, Base
from app.models import Paper, Author, PaperAuthor, Thesis, SyncLog

async def reset_data():
    print("WARNING: This will delete ALL mock publications and faculty data.")
    print("Administrative user accounts will be PRESERVED.")
    
    try:
        async with engine.begin() as conn:
            # Disable foreign key checks for SQLite
            await conn.execute(text("PRAGMA foreign_keys = OFF;"))
            
            # Use raw SQL to drop only if exists
            target_tables = ["paper_authors", "papers", "authors", "theses", "sync_logs"]
            
            for table in target_tables:
                print(f"Clearing table: {table}...")
                try:
                    await conn.execute(text(f"DELETE FROM {table}"))
                    # Note: sqlite_sequence might not exist if tables were never populated
                    try:
                        await conn.execute(text(f"DELETE FROM sqlite_sequence WHERE name='{table}'"))
                    except:
                        pass 
                except Exception as e:
                    print(f"  Warning: Could not clear {table}: {e}")
                
            await conn.execute(text("PRAGMA foreign_keys = ON;"))
        print("\nSUCCESS: Database reset for new Karunya University records.")
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(reset_data())
