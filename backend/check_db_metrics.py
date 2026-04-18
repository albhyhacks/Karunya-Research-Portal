import asyncio
import sys
sys.path.insert(0, '.')

from app.database import engine
from sqlalchemy import text

async def run():
    async with engine.connect() as conn:
        res = await conn.execute(text('SELECT full_name, h_index, citation_count FROM authors LIMIT 5'))
        rows = res.fetchall()
        for r in rows:
            print(f"Author: {r[0]}, h-index: {r[1]}, citations: {r[2]}")

asyncio.run(run())
