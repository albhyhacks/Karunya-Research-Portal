import asyncio
import httpx
from app.config import settings

async def test_author():
    api_key = settings.SCOPUS_API_KEY
    # Search for Dr. Elijah Blessing Karunya
    query = "AUTHLASTNAME(Blessing) AND AUTHFIRST(Elijah)"
    url = f"https://api.elsevier.com/content/search/scopus?query={query}&apiKey={api_key}"
    
    print(f"Searching for author Elijah Blessing...")
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            total = data.get("search-results", {}).get("opensearch:totalResults", "0")
            print(f"Found {total} papers for this author.")
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_author())
