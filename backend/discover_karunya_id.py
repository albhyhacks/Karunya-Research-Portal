import asyncio
import httpx
from app.config import settings

async def discover_id():
    api_key = settings.SCOPUS_API_KEY
    # Search for Karunya in affiliation name
    url = f"https://api.elsevier.com/content/search/affiliation?query=affil(Karunya)&apiKey={api_key}"
    
    print(f"Discovering Karunya Affiliation ID...")
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            data = response.json()
            results = data.get("search-results", {}).get("entry", [])
            print(f"\nFound {len(results)} potential affiliations:")
            for entry in results:
                name = entry.get("affilname")
                city = entry.get("affiliation-city")
                afid = entry.get("dc:identifier", "").replace("AFFILIATION_ID:", "")
                print(f"- {name} ({city}) -> ID: {afid}")
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(discover_id())
