import asyncio
import httpx
from app.config import settings

async def test_scopus():
    api_key = settings.SCOPUS_API_KEY
    af_id = "60025709"
    url = f"https://api.elsevier.com/content/search/scopus?query=AF-ID({af_id})&apiKey={api_key}&count=1"
    
    print(f"Testing Scopus API with ID {af_id}...")
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            data = response.json()
            entry = data.get("search-results", {}).get("entry", [{}])[0]
            print(f"Paper Title: {entry.get('dc:title')}")
            print(f"First Author: {entry.get('dc:creator')}")
            affil = entry.get('affiliation', [{}])
            print("Affiliations found in this paper:")
            for a in affil:
                print(f"- {a.get('affilname')} (ID: {a.get('afid')})")
            
            # Check if our target ID is even in the list
            ids = [a.get('afid') for a in affil]
            if af_id in ids:
                print(f"\nCONFIRMED: ID {af_id} is associated with this paper.")
            else:
                print(f"\nWARNING: ID {af_id} NOT found in first paper's affiliations. Found: {ids}")
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_scopus())
