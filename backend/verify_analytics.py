import asyncio
from app.routers.analytics import get_overview
from app.database import SessionLocal

async def test():
    async with SessionLocal() as db:
        data = await get_overview(db)
        print(f"OVERVIEW TOTAL PAPERS: {data['total_papers']}")
        print(f"OVERVIEW TOTAL AUTHORS: {data['total_authors']}")
        print(f"MOST CITED: {data['most_cited_paper']['title'] if data['most_cited_paper'] else 'None'}")

if __name__ == "__main__":
    asyncio.run(test())
