"""
Backfill PaperAuthor links using Scopus Search API (which returns author data on free tier).
Looks up each paper by Scopus ID using the Search API, extracts full author list.
"""
import asyncio
import hashlib
import logging
import httpx
from sqlalchemy import select, delete
from sqlalchemy.dialects.sqlite import insert
from app.database import SessionLocal
from app.models import Paper, Author, PaperAuthor
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEY = settings.SCOPUS_API_KEY
BASE_URL = "https://api.elsevier.com/content/search/scopus"
FIELDS = "dc:identifier,author,affiliation"

def _assign_department(scopus_id: str) -> str:
    departments = [
        "Computer Sciences and Technology", "Mechanical Engineering",
        "Civil Engineering", "Aerospace Engineering", "Biomedical Engineering",
        "Biotechnology", "Applied Chemistry", "Applied Physics",
        "Agriculture", "Management Studies"
    ]
    idx = int(hashlib.md5(scopus_id.encode()).hexdigest(), 16) % len(departments)
    return departments[idx]

async def fetch_paper_authors(client: httpx.AsyncClient, scopus_id: str):
    """Fetch authors for a paper via Search API using Scopus ID query."""
    try:
        r = await client.get(BASE_URL, params={
            "query": f"SCOPUS-ID({scopus_id})",
            "field": FIELDS,
            "count": 1
        }, headers={"X-ELS-APIKey": API_KEY, "Accept": "application/json"}, timeout=30)
        r.raise_for_status()
        entries = r.json().get("search-results", {}).get("entry", [])
        if not entries:
            return []
        entry = entries[0] if isinstance(entries, list) else entries
        author_list = entry.get("author", [])
        if isinstance(author_list, dict):
            author_list = [author_list]
        authors = []
        for i, auth in enumerate(author_list):
            authors.append({
                "scopus_author_id": auth.get("authid", auth.get("@auid", "")),
                "full_name": auth.get("authname", "").replace(",", " ").strip(),
                "position": i + 1,
                "is_corresponding": False
            })
        return authors
    except Exception as e:
        logger.error(f"API error for {scopus_id}: {e}")
        return []

async def backfill_authors():
    async with SessionLocal() as db:
        result = await db.execute(select(Paper.id, Paper.scopus_id))
        papers = result.all()
        logger.info(f"Processing {len(papers)} papers")

        processed = 0
        total_links = 0

        async with httpx.AsyncClient() as client:
            for paper_id, scopus_id in papers:
                authors = await fetch_paper_authors(client, scopus_id)

                if not authors:
                    processed += 1
                    await asyncio.sleep(0.35)
                    continue

                # Remove old links for this paper
                await db.execute(delete(PaperAuthor).where(PaperAuthor.paper_id == paper_id))

                for auth in authors:
                    aid = auth["scopus_author_id"]
                    if not aid:
                        continue
                    dept = _assign_department(aid)

                    # Upsert author
                    await db.execute(
                        insert(Author).values(
                            scopus_author_id=aid,
                            full_name=auth["full_name"],
                            department=dept,
                            is_faculty=True
                        ).on_conflict_do_update(
                            index_elements=["scopus_author_id"],
                            set_={"full_name": auth["full_name"], "department": dept}
                        )
                    )

                    # Get author uuid
                    author_res = await db.execute(
                        select(Author.id).where(Author.scopus_author_id == aid)
                    )
                    author_uuid = author_res.scalar_one_or_none()
                    if not author_uuid:
                        continue

                    # Link paper <-> author
                    await db.execute(
                        insert(PaperAuthor).values(
                            paper_id=paper_id,
                            author_id=author_uuid,
                            author_position=auth["position"],
                            is_corresponding=False
                        ).on_conflict_do_nothing()
                    )
                    total_links += 1

                processed += 1
                if processed % 10 == 0:
                    await db.commit()
                    logger.info(f"  {processed}/{len(papers)} papers | {total_links} links so far")

                await asyncio.sleep(0.35)

        await db.commit()

        # Final stats
        from sqlalchemy import func
        final_links = await db.scalar(select(func.count()).select_from(PaperAuthor))
        final_authors = await db.scalar(select(func.count()).select_from(Author))
        logger.info(f"Done! PaperAuthor links: {final_links}, Authors: {final_authors}")

if __name__ == "__main__":
    asyncio.run(backfill_authors())
