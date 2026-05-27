import asyncio
import json
from app.services.scopus import ScopusClient
from app.config import settings

async def debug_api_response(scopus_id):
    client = ScopusClient(api_key=settings.SCOPUS_API_KEY)
    print(f"Fetching details for {scopus_id}...")
    
    # Raw request to see actual structure
    data = await client._request("GET", f"abstract/scopus_id/{scopus_id}", params={
        "field": "authors,affiliation,coredata,authkeywords"
    })
    
    print("\n--- RAW RESPONSE KEYS ---")
    print(json.dumps(list(data.keys()), indent=2))
    
    response = data.get("abstracts-retrieval-response", {})
    print("\n--- abstracts-retrieval-response KEYS ---")
    print(json.dumps(list(response.keys()), indent=2))
    
    coredata = response.get("coredata", {})
    print("\n--- coredata CONTENT ---")
    print(json.dumps(coredata, indent=2))
    
    # Test normalization
    normalized = await client.get_paper_details(scopus_id)
    print("\n--- NORMALIZED RESULT ---")
    print(json.dumps(normalized, indent=2))

if __name__ == "__main__":
    import sys
    sid = sys.argv[1] if len(sys.argv) > 1 else "85075932162"
    asyncio.run(debug_api_response(sid))
