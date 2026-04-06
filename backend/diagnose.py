import asyncio
from app.database import SessionLocal
from app.services.scopus import ScopusClient
from app.config import settings
from sqlalchemy import text

async def diagnose():
    # Test API total count
    client = ScopusClient(api_key=settings.SCOPUS_API_KEY)
    import httpx
    async with httpx.AsyncClient() as hclient:
        r = await hclient.get(
            "https://api.elsevier.com/content/search/scopus",
            headers={"X-ELS-APIKey": settings.SCOPUS_API_KEY, "Accept": "application/json"},
            params={"query": f"AF-ID({settings.SCOPUS_AFFILIATION_ID})", "count": 1}
        )
        total = r.json().get("search-results", {}).get("opensearch:totalResults", "?")
        print(f"Total papers available in Scopus for Karunya: {total}")

    # Check DB
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT COUNT(*) FROM papers"))
        print(f"DB paper count: {result.scalar()}")

        result2 = await session.execute(text("SELECT COUNT(*) FROM authors"))
        print(f"DB author count: {result2.scalar()}")

        result3 = await session.execute(text("SELECT scopus_id, title FROM papers WHERE scopus_id NOT LIKE 'MOCK%' LIMIT 5"))
        print("\nReal Scopus papers in DB:")
        rows = result3.fetchall()
        if rows:
            for row in rows:
                print(f"  [{row[0]}] {str(row[1])[:70]}")
        else:
            print("  None found!")

        result4 = await session.execute(text("SELECT scopus_author_id, full_name, is_faculty, h_index FROM authors LIMIT 10"))
        print("\nAuthors in DB:")
        for row in result4:
            print(f"  [{row[0]}] {row[1]} | faculty={row[2]} | h_index={row[3]}")

asyncio.run(diagnose())

