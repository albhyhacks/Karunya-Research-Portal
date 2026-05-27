import asyncio
from sqlalchemy import select, func, text
from app.database import SessionLocal
from app.models import Paper, Author, PaperAuthor

async def diagnose():
    async with SessionLocal() as db:
        # Paper counts
        total = await db.scalar(select(func.count()).select_from(Paper))
        print(f"Total papers: {total}")

        # Check document_type distribution
        from sqlalchemy import distinct
        dtypes = await db.execute(select(Paper.document_type, func.count()).group_by(Paper.document_type))
        print("\nDocument types:")
        for dt, cnt in dtypes.all():
            print(f"  '{dt}' -> {cnt}")

        # Check open access
        oa = await db.scalar(select(func.count()).where(Paper.is_open_access == True))
        print(f"\nOpen access papers: {oa}")
        
        # Check citation_count=0
        zc = await db.scalar(select(func.count()).where(Paper.citation_count == 0))
        print(f"Zero citation papers: {zc}")

        # Check keywords
        kw_sample = await db.execute(select(Paper.year, Paper.keywords).where(Paper.keywords.isnot(None)).limit(5))
        print("\nSample keyword rows:")
        for yr, kws in kw_sample.all():
            print(f"  year={yr}, kws={kws}")

        # Check countries
        cntry_sample = await db.execute(select(Paper.year, Paper.countries).where(Paper.countries.isnot(None)).limit(5))
        print("\nSample country rows:")
        for yr, c in cntry_sample.all():
            print(f"  year={yr}, countries={c}")
        
        # Check author departments
        dept_q = await db.execute(select(Author.department, func.count()).group_by(Author.department).order_by(func.count().desc()).limit(15))
        print("\nAuthor departments:")
        for dept, cnt in dept_q.all():
            print(f"  '{dept}' -> {cnt}")

        # Check PaperAuthor links
        pa_total = await db.scalar(select(func.count()).select_from(PaperAuthor))
        print(f"\nTotal PaperAuthor links: {pa_total}")
        
        # Check cross-department papers
        cross = await db.execute(text("""
            SELECT pa.paper_id, COUNT(DISTINCT a.department) as dept_count
            FROM paper_authors pa
            JOIN authors a ON a.id = pa.author_id
            WHERE a.department IS NOT NULL
            GROUP BY pa.paper_id
            HAVING dept_count > 1
            LIMIT 5
        """))
        rows = cross.all()
        print(f"\nPapers with >1 department: {len(rows)}")

        # Years for declining topics
        yr_kw = await db.execute(select(Paper.year, func.count()).where(Paper.keywords.isnot(None)).group_by(Paper.year).order_by(Paper.year))
        print("\nPapers with keywords per year:")
        for yr, cnt in yr_kw.all():
            print(f"  {yr}: {cnt}")

if __name__ == "__main__":
    asyncio.run(diagnose())
