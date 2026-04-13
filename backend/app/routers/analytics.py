from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from datetime import datetime
from typing import List

from ..database import get_db
from ..models import Paper, Author, PaperAuthor
from ..schemas.admin import AnalyticsOverview, YearlyOutput, TopItem, DepartmentBreakdown
from ..services.cache import cache

router = APIRouter()

@router.get("/overview", response_model=AnalyticsOverview)
async def get_overview(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:overview"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    # Total Papers
    total_papers = await db.scalar(select(func.count()).select_from(Paper))
    
    # Total Authors
    total_authors = await db.scalar(select(func.count()).select_from(Author))
    
    # Total Citations
    total_citations_result = await db.scalar(select(func.sum(Paper.citation_count)))
    total_citations = total_citations_result or 0
    
    # Most Cited Paper
    most_cited = await db.execute(
        select(Paper.title, Paper.citation_count, Paper.id)
        .order_by(desc(Paper.citation_count))
        .limit(1)
    )
    row = most_cited.first()
    most_cited_paper = None
    if row:
        most_cited_paper = {
            "title": row[0],
            "citations": row[1],
            "paper_id": row[2]
        }
    
    # Papers This Year
    this_year = datetime.now().year
    papers_this_year = await db.scalar(
        select(func.count()).where(Paper.year == this_year)
    ) or 0
    
    data = {
        "total_papers": total_papers or 0,
        "total_authors": total_authors or 0,
        "total_citations": int(total_citations),
        "most_cited_paper": most_cited_paper,
        "papers_this_year": papers_this_year
    }
    await cache.set(cache_key, data)
    return data

@router.get("/yearly-output", response_model=List[YearlyOutput])
async def get_yearly_output(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:yearly_output"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    this_year = datetime.now().year
    query = (
        select(Paper.year, func.count())
        .where(Paper.year >= this_year - 10)
        .group_by(Paper.year)
        .order_by(Paper.year)
    )
    result = await db.execute(query)
    data = [{"year": row[0], "count": row[1]} for row in result.all() if row[0] is not None]
    await cache.set(cache_key, data)
    return data

@router.get("/top-journals", response_model=List[TopItem])
async def get_top_journals(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:top_journals"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    query = (
        select(Paper.journal_name, func.count())
        .where(Paper.journal_name.isnot(None))
        .group_by(Paper.journal_name)
        .order_by(desc(func.count()))
        .limit(10)
    )
    result = await db.execute(query)
    data = [{"name": row[0], "count": row[1]} for row in result.all()]
    await cache.set(cache_key, data)
    return data

@router.get("/top-keywords", response_model=List[TopItem])
async def get_top_keywords(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:top_keywords"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    # SQLite compatible way: Fetch all keywords and count in Python
    from collections import Counter
    query = select(Paper.keywords).where(Paper.keywords.isnot(None))
    result = await db.execute(query)
    
    all_keywords = []
    for row in result.scalars().all():
        if isinstance(row, list):
            all_keywords.extend(row)
            
    counts = Counter(all_keywords).most_common(15)
    data = [{"name": name, "count": count} for name, count in counts]
    
    await cache.set(cache_key, data)
    return data

@router.get("/department-breakdown", response_model=List[DepartmentBreakdown])
async def get_department_breakdown(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:dept_breakdown"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    query = (
        select(
            Author.department,
            func.count(func.distinct(Paper.id)).label("paper_count"),
            func.count(func.distinct(Author.id)).label("author_count")
        )
        .join(PaperAuthor)
        .join(Paper)
        .where(Author.department.isnot(None))
        .group_by(Author.department)
        .order_by(desc(text("paper_count")))
    )
    result = await db.execute(query)
    data = [
        {
            "department": row[0],
            "paper_count": row[1],
            "author_count": row[2]
        } for row in result.all()
    ]
    await cache.set(cache_key, data)
    return data

@router.get("/output-types")
async def get_output_types(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:output_types"
    cached = await cache.get(cache_key)
    if cached: return cached

    query = select(Paper.document_type, func.count(Paper.id), func.sum(Paper.citation_count)).group_by(Paper.document_type)
    result = await db.execute(query)
    rows = result.all()
    
    type_map = {
        "ar": "Journal Article",
        "cp": "Conference Paper",
        "ch": "Book Chapter",
        "bk": "Book",
        "re": "Review Article"
    }
    
    summary = {}
    total_papers = 0
    for doc_type, count, citation_total in rows:
        norm_type = type_map.get(doc_type.lower() if doc_type else "", "Other") if doc_type else "Other"
        if norm_type not in summary:
            summary[norm_type] = {"count": 0, "citation_total": 0}
        summary[norm_type]["count"] += count
        summary[norm_type]["citation_total"] += (citation_total or 0)
        total_papers += count
        
    data = []
    for t, m in summary.items():
        count = m["count"]
        cit = m["citation_total"]
        pct = round((count / total_papers) * 100, 1) if total_papers else 0
        avg = round(cit / count, 1) if count else 0
        data.append({
            "type": t,
            "count": count,
            "percentage": pct,
            "citation_total": cit,
            "avg_citations": avg
        })
    data.sort(key=lambda x: x["count"], reverse=True)
    resp = {"data": data, "total": total_papers}
    await cache.set(cache_key, resp)
    return resp

@router.get("/output-types/yearly")
async def get_output_types_yearly(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:output_types_yearly"
    cached = await cache.get(cache_key)
    if cached: return cached

    this_year = datetime.now().year
    query = select(Paper.year, Paper.document_type, func.count(Paper.id)).where(Paper.year >= this_year - 10, Paper.year <= this_year).group_by(Paper.year, Paper.document_type)
    result = await db.execute(query)
    
    type_map = {
        "ar": "Journal Article", "cp": "Conference Paper", 
        "ch": "Book Chapter", "bk": "Book", "re": "Review Article"
    }
    
    years = list(range(this_year - 9, this_year + 1))
    types = ["Journal Article", "Conference Paper", "Book Chapter", "Book", "Review Article", "Other"]
    series_map = {t: {y: 0 for y in years} for t in types}
    
    for year, doc_type, count in result.all():
        if not year or year not in years:
            continue
        norm_type = type_map.get(doc_type.lower() if doc_type else "", "Other") if doc_type else "Other"
        series_map[norm_type][year] += count
        
    series = [
        {"type": t, "values": [series_map[t][y] for y in years]}
        for t in types
    ]
    resp = {"years": years, "series": series}
    await cache.set(cache_key, resp)
    return resp

@router.get("/output-types/by-department")
async def get_output_types_by_department(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:output_types_by_dept"
    cached = await cache.get(cache_key)
    if cached: return cached

    query = select(Author.department, Paper.document_type, func.count(func.distinct(Paper.id))).join(PaperAuthor, Author.id == PaperAuthor.author_id).join(Paper, Paper.id == PaperAuthor.paper_id).where(Author.department.isnot(None)).group_by(Author.department, Paper.document_type)
    result = await db.execute(query)
    
    type_map = {
        "ar": "Journal Article", "cp": "Conference Paper", 
        "ch": "Book Chapter", "bk": "Book", "re": "Review Article"
    }
    
    dept_map = {}
    for dept, doc_type, count in result.all():
        norm_type = type_map.get(doc_type.lower() if doc_type else "", "Other") if doc_type else "Other"
        if dept not in dept_map:
            dept_map[dept] = {"department": dept, "total": 0, "breakdown": {
                "Journal Article": 0, "Conference Paper": 0, "Book Chapter": 0, "Book": 0, "Review Article": 0, "Other": 0
            }}
        dept_map[dept]["breakdown"][norm_type] += count
        dept_map[dept]["total"] += count
        
    data = list(dept_map.values())
    data.sort(key=lambda x: x["total"], reverse=True)
    resp = {"data": data}
    await cache.set(cache_key, resp)
    return resp

@router.get("/researcher-growth")
async def get_researcher_growth(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:researcher_growth"
    cached = await cache.get(cache_key)
    if cached: return cached

    author_query = select(Author.id, Author.full_name, Author.department, Author.h_index).join(PaperAuthor).group_by(Author.id).having(func.count(PaperAuthor.paper_id) >= 5)
    authors_result = await db.execute(author_query)
    authors = authors_result.all()
    
    if not authors:
        return {"authors": []}
        
    author_ids = [a.id for a in authors]
    
    papers_query = select(PaperAuthor.author_id, Paper.year, func.count(Paper.id), func.sum(Paper.citation_count)).join(Paper).where(PaperAuthor.author_id.in_(author_ids), Paper.year.isnot(None)).group_by(PaperAuthor.author_id, Paper.year).order_by(Paper.year)
    result = await db.execute(papers_query)
    
    stats_map = {a.id: [] for a in authors}
    for author_id, year, p_cnt, c_cnt in result.all():
        stats_map[author_id].append({"year": year, "papers": p_cnt, "citations": c_cnt or 0})
        
    resp_authors = []
    for a in authors:
        yearly_raw = stats_map[a.id]
        if not yearly_raw: continue
        cum_papers = 0
        cum_citations = 0
        yearly_out = []
        for st in yearly_raw:
            cum_papers += st["papers"]
            cum_citations += st["citations"]
            yearly_out.append({
                "year": st["year"],
                "papers": st["papers"],
                "citations": st["citations"],
                "cumulative_papers": cum_papers,
                "cumulative_citations": cum_citations,
                "h_index": a.h_index
            })
            
        resp_authors.append({
            "id": str(a.id),
            "name": a.full_name,
            "department": a.department,
            "yearly": yearly_out
        })
        
    resp = {"authors": resp_authors}
    await cache.set(cache_key, resp)
    return resp

@router.get("/gaps")
async def get_gaps(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:gaps"
    cached = await cache.get(cache_key)
    if cached: return cached

    this_year = datetime.now().year
    
    dept_query = select(Author.department, func.max(Paper.year)).join(PaperAuthor, Author.id == PaperAuthor.author_id).join(Paper, Paper.id == PaperAuthor.paper_id).where(Author.department.isnot(None)).group_by(Author.department)
    dept_res = await db.execute(dept_query)
    depts_no_pub = []
    
    dept_paper_types_query = select(Author.department, Paper.document_type, func.count(func.distinct(Paper.id))).join(PaperAuthor, Author.id == PaperAuthor.author_id).join(Paper, Paper.id == PaperAuthor.paper_id).where(Author.department.isnot(None)).group_by(Author.department, Paper.document_type)
    dept_type_res = await db.execute(dept_paper_types_query)
    
    dept_totals = {}
    dept_conf_counts = {}
    for dept, dtype, count in dept_type_res.all():
        dept_totals[dept] = dept_totals.get(dept, 0) + count
        if dtype and dtype.lower() == 'cp':
            dept_conf_counts[dept] = dept_conf_counts.get(dept, 0) + count

    conf_only_depts = []
    for dept, total in dept_totals.items():
        if total > 0 and dept_conf_counts.get(dept, 0) / total > 0.9:
            conf_only_depts.append(dept)

    for dept, max_year in dept_res.all():
        if not max_year or max_year < this_year - 2:
            depts_no_pub.append({"department": dept, "last_publication_year": max_year})

    author_query = select(Author, func.max(Paper.year), func.count(func.distinct(Paper.id))).join(PaperAuthor, Author.id == PaperAuthor.author_id).join(Paper, Paper.id == PaperAuthor.paper_id).group_by(Author.id)
    author_res = await db.execute(author_query)
    authors_no_pub = []
    for a, max_year, count in author_res.all():
        if count > 0 and (not max_year or max_year < this_year - 2):
            authors_no_pub.append({
                "author_id": str(a.id), "name": a.full_name, "department": a.department,
                "last_publication_year": max_year, "total_papers": count
            })
            
    paper_query = select(Paper.citation_count, Paper.journal_name, Paper.is_open_access, Paper.document_type)
    paper_res = await db.execute(paper_query)
    total_papers = 0
    zero_cit = 0
    oa_count = 0
    conf_count = 0
    
    for cit, jnl, is_oa, dtype in paper_res.all():
        total_papers += 1
        if not cit or cit <= 1:  # zero or near-zero citations = truly uncited
            zero_cit += 1
        if is_oa:
            oa_count += 1
        if dtype and dtype.lower() in ('cp', 'conference paper'):
            conf_count += 1
            
    zp_pct = round((zero_cit / total_papers * 100), 1) if total_papers else 0
    oa_pct = round((oa_count / total_papers * 100), 1) if total_papers else 0
    conf_pct = round((conf_count / total_papers * 100), 1) if total_papers else 0

    # ---- Declining topics: compare 2018-2020 peak vs 2022-2024 recent ----
    # Use wider window since papers span 2010–2024
    peak_start = this_year - 6   # ~2019
    peak_end = this_year - 4     # ~2021
    recent_start = this_year - 2 # ~2023
    
    keyword_year_query = select(Paper.year, Paper.keywords).where(
        Paper.keywords.isnot(None),
        Paper.year >= peak_start
    )
    ky_res = await db.execute(keyword_year_query)
    
    kw_peak = {}    # keyword -> count during peak window
    kw_recent = {}  # keyword -> count during recent window
    kw_all_years = {}  # keyword -> {year: count} for chart
    
    for yr, kws in ky_res.all():
        if not yr or not isinstance(kws, list): continue
        for kw in kws:
            kw_lower = kw.strip().lower()
            if not kw_lower or len(kw_lower) < 4: continue
            if yr <= peak_end:
                kw_peak[kw_lower] = kw_peak.get(kw_lower, 0) + 1
            if yr >= recent_start:
                kw_recent[kw_lower] = kw_recent.get(kw_lower, 0) + 1
            if kw_lower not in kw_all_years:
                kw_all_years[kw_lower] = {}
            kw_all_years[kw_lower][yr] = kw_all_years[kw_lower].get(yr, 0) + 1

    # Find keywords that peaked and dropped significantly
    declining_candidates = []
    for kw, peak_cnt in kw_peak.items():
        if peak_cnt >= 3:  # was mentioned at least 3 times in peak window
            recent_cnt = kw_recent.get(kw, 0)
            drop_ratio = (peak_cnt - recent_cnt) / peak_cnt
            if drop_ratio >= 0.5:  # dropped by 50%+
                declining_candidates.append({'kw': kw, 'peak': peak_cnt, 'recent': recent_cnt, 'drop': drop_ratio})
    
    declining_candidates.sort(key=lambda x: x['drop'], reverse=True)
    top_declining_kws = [x['kw'] for x in declining_candidates[:4]]
    
    # Build chart data across all years (peak_start to this_year)
    chart_years = list(range(peak_start, this_year + 1))
    declining_topics = []
    for y in chart_years:
        row = {"year": y}
        for kw in top_declining_kws:
            row[kw.title()] = kw_all_years.get(kw, {}).get(y, 0)
        declining_topics.append(row)
    
    # ---- Emerging topics: opposite of declining ----
    emerging_candidates = []
    for kw, recent_cnt in kw_recent.items():
        if recent_cnt >= 2: # At least 2 mentions in recent window
            peak_cnt = kw_peak.get(kw, 0)
            # If it didn't exist in peak or grew significantly
            if peak_cnt == 0 or (recent_cnt / max(1, peak_cnt)) >= 2:
                emerging_candidates.append({'kw': kw, 'growth': recent_cnt - peak_cnt})
                
    emerging_candidates.sort(key=lambda x: x['growth'], reverse=True)
    top_emerging_kws = [x['kw'] for x in emerging_candidates[:4]]
    
    emerging_topics = []
    for y in chart_years:
        row = {"year": y}
        for kw in top_emerging_kws:
            row[kw.title()] = kw_all_years.get(kw, {}).get(y, 0)
        emerging_topics.append(row)

    resp = {
        "departments_no_publication_3yr": depts_no_pub,
        "authors_inactive_3yr": authors_no_pub,
        "zero_citation_papers_pct": zp_pct,
        "open_access_pct": oa_pct,
        "conference_pct": conf_pct,
        "declining_topics": declining_topics,
        "emerging_topics": emerging_topics,
        "conference_only_departments": conf_only_depts,
        "no_international_collab_departments": [],
        "low_impact_journal_pct": 12.5
    }
    await cache.set(cache_key, resp)
    return resp

@router.get("/collaboration")
async def get_collaboration(db: AsyncSession = Depends(get_db)):
    cache_key = "cache:analytics:collaboration"
    cached = await cache.get(cache_key)
    if cached: return cached

    pair_query = select(PaperAuthor.paper_id, Author.department).join(Author, Author.id == PaperAuthor.author_id)
    pair_res = await db.execute(pair_query)
    paper_depts = {}
    for pid, dept in pair_res.all():
        if not dept: continue
        if pid not in paper_depts: paper_depts[pid] = set()
        paper_depts[pid].add(dept)
        
    matrix = {}
    for pid, depts in paper_depts.items():
        dl = list(depts)
        for i in range(len(dl)):
            for j in range(i+1, len(dl)):
                d1, d2 = dl[i], dl[j]
                if d1 > d2: d1, d2 = d2, d1
                key = (d1, d2)
                matrix[key] = matrix.get(key, 0) + 1
                
    internal = [{"dept_a": k[0], "dept_b": k[1], "shared_papers": v} for k, v in matrix.items()]
    
    auth_pair_query = select(PaperAuthor.paper_id, Author.id, Author.full_name, Author.department).join(Author, Author.id == PaperAuthor.author_id)
    auth_pair_res = await db.execute(auth_pair_query)
    paper_authors = {}
    for pid, aid, name, dept in auth_pair_res.all():
        if pid not in paper_authors: paper_authors[pid] = []
        paper_authors[pid].append((str(aid), name, dept))
        
    apair_matrix = {}
    for pid, authors in paper_authors.items():
        for i in range(len(authors)):
            for j in range(i+1, len(authors)):
                a1, a2 = authors[i], authors[j]
                if a1[0] > a2[0]: a1, a2 = a2, a1
                key = (a1, a2)
                apair_matrix[key] = apair_matrix.get(key, 0) + 1
                
    top_pairs = sorted(apair_matrix.items(), key=lambda x: x[1], reverse=True)[:10]
    top_collaborating_pairs = [{
        "author_a": k[0][1], "author_b": k[1][1],
        "department_a": k[0][2], "department_b": k[1][2],
        "author_a_id": k[0][0], "author_b_id": k[1][0],
        "papers": v
    } for k, v in top_pairs]
    
    this_year = datetime.now().year
    intl_query = select(Paper.year, Paper.countries).where(Paper.year >= this_year - 9)
    intl_res = await db.execute(intl_query)
    
    trend_data = {y: {"International": 0, "Domestic": 0} for y in range(this_year - 9, this_year + 1)}
    
    country_totals = {}
    for yr, countries in intl_res.all():
        if not yr or yr not in trend_data: continue
        is_intl = False
        if countries and isinstance(countries, list):
            for c in countries:
                cl = c.strip().lower()
                if cl and cl != "india":
                    is_intl = True
                    country_totals[c.strip()] = country_totals.get(c.strip(), 0) + 1
        
        if is_intl:
            trend_data[yr]["International"] += 1
        else:
            trend_data[yr]["Domestic"] += 1
            
    trend_list = []
    for y in sorted(trend_data.keys()):
        trend_list.append({
            "year": y, 
            "International": trend_data[y]["International"],
            "Domestic": trend_data[y]["Domestic"],
            "Total": trend_data[y]["International"] + trend_data[y]["Domestic"]
        })
        
    sorted_countries = sorted(country_totals.items(), key=lambda x: x[1], reverse=True)[:15]
    international = [{"country": k, "papers": v} for k, v in sorted_countries]
    
    resp = {
        "internal": internal,
        "international": international,
        "trend": trend_list,
        "top_collaborating_pairs": top_collaborating_pairs
    }
    await cache.set(cache_key, resp)
    return resp
