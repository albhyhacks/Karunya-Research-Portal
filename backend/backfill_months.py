import asyncio
import sys
import os

from app.database import SessionLocal
from app.models import Paper
from sqlalchemy import select, update
from app.services.scopus import ScopusClient
from app.config import settings

async def main():
    client = ScopusClient(api_key=settings.SCOPUS_API_KEY)
    
    async with SessionLocal() as session:
        # Fetch papers without a month
        result = await session.execute(select(Paper).where(Paper.month.is_(None)))
        papers = result.scalars().all()
        
        print(f"Found {len(papers)} papers without a month. Starting backfill...")
        
        # Batch by 25
        batch_size = 25
        for i in range(0, len(papers), batch_size):
            batch = papers[i:i+batch_size]
            scopus_ids = [p.scopus_id for p in batch if p.scopus_id]
            
            if not scopus_ids:
                continue
                
            query = " OR ".join([f"SCOPUS-ID({sid})" for sid in scopus_ids])
            print(f"Processing batch {i//batch_size + 1}/{(len(papers) + batch_size - 1)//batch_size}...")
            
            try:
                # Use search API which is faster and allows OR
                data = await client._request("GET", "search/scopus", params={
                    "query": query,
                    "count": batch_size,
                    "field": "dc:identifier,prism:coverDate,pub-date"
                })
                
                entries = data.get("search-results", {}).get("entry", [])
                if isinstance(entries, dict):
                    entries = [entries]
                    
                update_count = 0
                for entry in entries:
                    sid = entry.get("dc:identifier", "").replace("SCOPUS_ID:", "")
                    cover_date = entry.get("prism:coverDate", entry.get("pub-date", ""))
                    
                    month = None
                    if cover_date and len(cover_date) >= 7:
                        try:
                            month = int(cover_date[5:7])
                        except ValueError:
                            pass
                            
                    if month is not None and sid:
                        await session.execute(
                            update(Paper).where(Paper.scopus_id == sid).values(month=month)
                        )
                        update_count += 1
                        
                await session.commit()
                print(f"  Updated {update_count} papers in this batch.")
            except Exception as e:
                print(f"Error processing batch: {e}")
                
            await asyncio.sleep(0.35)

    print("Backfill completed.")

if __name__ == "__main__":
    asyncio.run(main())
