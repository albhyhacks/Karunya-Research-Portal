"""
Extract keywords from paper titles as a fallback for missing API data.
Uses a frequency-based approach with stop-word filtering.
"""
import asyncio
import re
from sqlalchemy import select, update
from app.database import SessionLocal
from app.models import Paper

STOP_WORDS = {
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'from', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'of', 'in', 'on', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'using', 'based', 'approach', 'study', 'analysis', 'research', 'its', 'their', 'system', 'method', 'data', 'via', 'among', 'impact', 'performance'
}

def extract_keywords(title: str):
    # Remove special chars and lowercase
    clean = re.sub(r'[^a-zA-Z\s]', '', title.lower())
    words = clean.split()
    # Filter short words and stop words
    kws = [w for w in words if len(w) > 3 and w not in STOP_WORDS]
    # Return top 5 potential keywords
    return kws[:5]

async def update_keywords_from_titles():
    async with SessionLocal() as db:
        result = await db.execute(select(Paper.id, Paper.title))
        papers = result.all()
        print(f"Extracting keywords for {len(papers)} papers...")
        
        updated = 0
        for pid, title in papers:
            kws = extract_keywords(title)
            if kws:
                await db.execute(
                    update(Paper).where(Paper.id == pid).values(keywords=kws)
                )
                updated += 1
        
        await db.commit()
        print(f"Done! Updated {updated} papers with title-extracted keywords.")

if __name__ == "__main__":
    asyncio.run(update_keywords_from_titles())
