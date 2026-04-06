import asyncio
import httpx
from app.config import settings

async def test_search():
    api_key = settings.SCOPUS_API_KEY
    # Search for a specific paper title known to be from Karunya
    query = "TITLE(Design of a 10 kW Grid-Tie Solar PV System for Karunya University)"
    url = f"https://api.elsevier.com/content/search/scopus?query={query}&apiKey={api_key}"
    
    print(f"Searching for specific Karunya paper...")
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            total = data.get("search-results", {}).get("opensearch:totalResults", "0")
            print(f"Found {total} matching papers.")
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_search())
