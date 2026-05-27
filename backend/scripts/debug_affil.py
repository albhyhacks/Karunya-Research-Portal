import asyncio
import json
from app.services.scopus import ScopusClient
from app.config import settings

async def debug_author_affil():
    client = ScopusClient(api_key=settings.SCOPUS_API_KEY)
    # Use one of the scopus IDs from the previously fetched papers
    scopus_id = "85140483257" 
    try:
        data = await client._request("GET", f"abstract/scopus_id/{scopus_id}")
        with open('paper_detail_debug.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print("Detailed paper data saved to paper_detail_debug.json")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_author_affil())
