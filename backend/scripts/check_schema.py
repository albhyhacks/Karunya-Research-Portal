import asyncio
from app.database import engine
from sqlalchemy import text

async def check_schema():
    async with engine.connect() as conn:
        result = await conn.execute(text("PRAGMA table_info(papers)"))
        columns = [row[1] for row in result.fetchall()]
        print(f"Columns in 'papers' table: {columns}")

if __name__ == "__main__":
    asyncio.run(check_schema())
