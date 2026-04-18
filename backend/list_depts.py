import asyncio
import sys
sys.path.insert(0, '.')

from app.database import engine
from sqlalchemy import text

async def run():
    async with engine.connect() as conn:
        res = await conn.execute(
            text("SELECT DISTINCT department FROM authors WHERE is_faculty=1 AND department IS NOT NULL ORDER BY department")
        )
        rows = res.fetchall()
        for r in rows:
            print(r[0])

asyncio.run(run())
