"""
Backfill keywords for papers using Scopus Search API (SCOPUS-ID query).
The search API returns authkeywords in default field set.
Also updates countries from affiliation data.
"""
import asyncio
import httpx
import logging
from sqlalchemy import select, update
from app.database import SessionLocal
from app.models import Paper
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "https://api.elsevier.com/content/search/scopus"
API_KEY = settings.SCOPUS_API_KEY
FIELDS = "dc:identifier,authkeywords,affiliation,openaccess"

async def backfill_kw():
    async with SessionLocal() as db:
        result = await db.execute(select(Paper.id, Paper.scopus_id))
        papers = result.all()
        logger.info(f"Processing {len(papers)} papers for keyword backfill")

        updated = 0
        async with httpx.AsyncClient(timeout=30) as client:
            for paper_id, scopus_id in papers:
                try:
                    r = await client.get(BASE_URL, params={
                        "query": f"SCOPUS-ID({scopus_id})",
                        "field": FIELDS,
                        "count": 1
                    }, headers={"X-ELS-APIKey": API_KEY, "Accept": "application/json"})
                    r.raise_for_status()
                    entries = r.json().get("search-results", {}).get("entry", [])
                    if not entries:
                        await asyncio.sleep(0.35)
                        continue
                    entry = entries[0] if isinstance(entries, list) else entries

                    # Keywords
                    kw_raw = entry.get("authkeywords", "") or ""
                    keywords = [k.strip() for k in kw_raw.split(" | ") if k.strip()] if kw_raw else []

                    # Countries from affiliation
                    affils = entry.get("affiliation", []) or []
                    if isinstance(affils, dict):
                        affils = [affils]
                    countries = list(set(
                        a.get("affiliation-country", "").strip()
                        for a in affils if a.get("affiliation-country")
                    ))

                    # Open access
                    oa = entry.get("openaccess", "0")
                    is_oa = str(oa) in ("1", "true", "True")
                    
                    await db.execute(
                        update(Paper).where(Paper.id == paper_id).values(
                            keywords=keywords,
                            countries=countries,
                            is_open_access=is_oa
                        )
                    )
                    updated += 1
                    if updated % 10 == 0:
                        await db.commit()
                        logger.info(f"Updated {updated}/{len(papers)}")

                except Exception as e:
                    logger.error(f"Error for {scopus_id}: {e}")
                finally:
                    await asyncio.sleep(0.35)

        await db.commit()
        logger.info(f"Done! Updated {updated} papers with keywords/countries")

if __name__ == "__main__":
    asyncio.run(backfill_kw())
