import asyncio
import json
from app.services.scopus import ScopusClient
from app.config import settings

async def check_author_affil(scopus_id):
    client = ScopusClient(api_key=settings.SCOPUS_API_KEY)
    data = await client._request("GET", f"abstract/scopus_id/{scopus_id}", params={
        "field": "authors,affiliation,coredata,authkeywords"
    })
    
    response = data.get("abstracts-retrieval-response") or {}
    authors_section = response.get("authors") or {}
    authors_list = authors_section.get("author", [])
    
    if isinstance(authors_list, dict):
        authors_list = [authors_list]
        
    for auth in authors_list:
        print(f"Author AU-ID: {auth.get('@auid')}")
        print(f"Author name: {auth.get('preferred-name', {}).get('ce:indexed-name')}")
        print(f"Affiliations: {json.dumps(auth.get('affiliation', {}))}")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(check_author_affil("85075932162"))
