import asyncio
import json
from app.services.scopus import ScopusClient
from app.config import settings
from app.database import SessionLocal
from app.models import Paper, Author, PaperAuthor
from sqlalchemy import select

async def investigate(scopus_id):
    # 1. Check the paper in the DB
    async with SessionLocal() as db:
        result = await db.execute(select(Paper).where(Paper.scopus_id == scopus_id))
        paper = result.scalar_one_or_none()
        if paper:
            print(f"== PAPER IN DB ==")
            print(f"  Title: {paper.title}")
            print(f"  Year: {paper.year}")
            print(f"  Journal: {paper.journal_name}")
            
            # Get authors for this paper
            pa_result = await db.execute(
                select(Author).join(PaperAuthor, Author.id == PaperAuthor.author_id)
                .where(PaperAuthor.paper_id == paper.id)
            )
            authors = pa_result.scalars().all()
            print(f"  Authors ({len(authors)}):")
            for a in authors:
                print(f"    - [{a.scopus_author_id}] {a.full_name} | is_faculty={a.is_faculty}")
        else:
            print(f"Paper {scopus_id} NOT in database.")

    # 2. Fetch raw API data for this paper
    print("\n== SCOPUS API RESPONSE ==")
    client = ScopusClient(api_key=settings.SCOPUS_API_KEY)
    data = await client._request("GET", f"abstract/scopus_id/{scopus_id}", params={
        "field": "authors,affiliation,coredata"
    })
    
    response = data.get("abstracts-retrieval-response") or {}
    coredata = response.get("coredata") or {}
    
    # Check affiliations
    top_affils = response.get("affiliation", [])
    if isinstance(top_affils, dict):
        top_affils = [top_affils]
    
    print(f"  Title from API: {coredata.get('dc:title', 'N/A')}")
    print(f"  Year from API: {coredata.get('prism:coverDate', 'N/A')}")
    print(f"\n  Paper-level Affiliations:")
    for aff in (top_affils or []):
        print(f"    - ID={aff.get('@id')} | Name={aff.get('affilname', 'N/A')} | Country={aff.get('affiliation-country', 'N/A')}")
    
    # Check individual author affiliations
    authors_section = response.get("authors") or {}
    authors_list = authors_section.get("author", [])
    if isinstance(authors_list, dict):
        authors_list = [authors_list]
    
    karunya_id = settings.SCOPUS_AFFILIATION_ID
    print(f"\n  Author Affiliations (Karunya ID = {karunya_id}):")
    for auth in authors_list:
        affils = auth.get("affiliation", [])
        if isinstance(affils, dict):
            affils = [affils]
        aff_ids = [a.get("@id") for a in affils]
        is_karunya = karunya_id in aff_ids
        pref = auth.get("preferred-name", {})
        name = pref.get("ce:indexed-name", "Unknown")
        print(f"    - {name} | Affil IDs={aff_ids} | is_karunya={is_karunya}")

if __name__ == "__main__":
    # Paper from screenshot: Internal ID 105001593997
    asyncio.run(investigate("105001593997"))
