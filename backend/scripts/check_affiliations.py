import asyncio
import httpx
from app.config import settings

async def check_total(aff_id):
    api_key = settings.SCOPUS_API_KEY
    base_url = "https://api.elsevier.com/content/search/scopus"
    params = {
        "query": f"AF-ID({aff_id})",
        "apiKey": api_key,
        "count": 1
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(base_url, params=params)
        if response.status_code == 200:
            data = response.json()
            total = data.get("search-results", {}).get("opensearch:totalResults", "0")
            print(f"ID {aff_id}: {total} papers")
        else:
            print(f"Error for {aff_id}: {response.status_code} - {response.text}")

async def main():
    print("Checking totals...")
    await check_total("60100082")  # Current in .env
    await check_total("60025709")  # From README
    await check_total("60023403")  # Mentined in conversation history

if __name__ == "__main__":
    asyncio.run(main())
