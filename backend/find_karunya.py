import asyncio
import httpx
from app.config import settings

async def search_institution(name):
    api_key = settings.SCOPUS_API_KEY
    base_url = "https://api.elsevier.com/content/search/affiliation"
    params = {
        "query": f"AFFIL({name})",
        "apiKey": api_key,
        "count": 5
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(base_url, params=params)
        if response.status_code == 200:
            data = response.json()
            results = data.get("search-results", {}).get("entry", [])
            for entry in results:
                print(f"Name: {entry.get('affiliation-name')}, ID: {entry.get('dc:identifier', '').split(':')[-1]}, Papers: {entry.get('document-count')}")
        else:
            print(f"Error: {response.status_code} - {response.text}")

async def main():
    print("Searching for Karunya...")
    await search_institution("Karunya")

if __name__ == "__main__":
    asyncio.run(main())
