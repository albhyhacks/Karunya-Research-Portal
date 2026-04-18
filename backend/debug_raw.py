import asyncio
import json
from app.services.scopus import ScopusClient
from app.config import settings

async def debug_raw_abstract(scopus_id):
    client = ScopusClient(api_key=settings.SCOPUS_API_KEY)
    print(f"Fetching raw abstract for {scopus_id}...")
    
    # Request without fields to see default structure
    data = await client._request("GET", f"abstract/scopus_id/{scopus_id}")
    
    print("\n--- FULL RESPONSE (PREVIEW) ---")
    print(json.dumps(data, indent=2)[:2000] + "...")
    
    response = data.get("abstracts-retrieval-response", {})
    item = response.get("item", {})
    bibrecord = item.get("bibrecord", {})
    head = bibrecord.get("head", {})
    
    print("\n--- BIBRECORD/HEAD KEYS ---")
    print(json.dumps(list(head.keys()), indent=2))

if __name__ == "__main__":
    import sys
    sid = sys.argv[1] if len(sys.argv) > 1 else "85075932162"
    asyncio.run(debug_raw_abstract(sid))
