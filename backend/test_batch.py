import asyncio
import httpx
from app.config import settings

async def test_batch_size(size):
    api_key = settings.SCOPUS_API_KEY
    url = "https://api.elsevier.com/content/search/scopus"
    params = {
        "query": f"AF-ID({settings.SCOPUS_AFFILIATION_ID})",
        "apiKey": api_key,
        "count": size
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            results = data.get("search-results", {}).get("entry", [])
            print(f"Requested {size}, got {len(results)}")
        else:
            print(f"Error {response.status_code}: {response.text}")

async def main():
    await test_batch_size(100)
    await test_batch_size(200)

if __name__ == "__main__":
    asyncio.run(main())
