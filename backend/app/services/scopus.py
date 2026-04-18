import httpx
import asyncio
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from ..config import settings

logger = logging.getLogger(__name__)

class ScopusClient:
    BASE_URL = "https://api.elsevier.com/content"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "X-ELS-APIKey": self.api_key,
            "Accept": "application/json"
        }
        self.timeout = httpx.Timeout(30.0)

    async def _request(self, method: str, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.BASE_URL}/{path.lstrip('/')}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.request(method, url, headers=self.headers, params=params)
            if response.is_error:
                logger.error(f"Scopus API Error {response.status_code} for {url}: {response.text}")
                response.raise_for_status()
            return response.json()

    def _normalize_authors(self, entry: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract authors from either search entry or abstract retrieval entry."""
        authors = []
        
        # Abstracts Retrieval API structure: 
        # try 'authors' -> 'author' at top level of abstracts-retrieval-response
        # then try 'coredata' -> 'dc:creator' -> 'author' (primary author)
        author_list = entry.get("authors", {}).get("author", [])
        if not author_list:
            creator_data = entry.get("dc:creator", {})
            if isinstance(creator_data, dict):
                author_list = creator_data.get("author", [])
        
        # If no author list, use dc:creator as fallback for name only
        if not author_list and entry.get("dc:creator"):
            author_list = [{
                "@auid": entry.get("@auid", ""), 
                "ce:given-name": "", 
                "ce:surname": entry.get("dc:creator", "")
            }]
            
        if isinstance(author_list, dict):
            author_list = [author_list]
            
            
            # Check if this author's affiliation matches Karunya (from settings)
            is_faculty = False
            affils = auth.get("affiliation", [])
            if isinstance(affils, dict):
                affils = [affils]
            
            for aff in affils:
                if aff.get("@id") == settings.SCOPUS_AFFILIATION_ID:
                    is_faculty = True
                    break

            authors.append({
                "scopus_author_id": auth.get("@auid", auth.get("authid", "")),
                "full_name": f"{auth.get('ce:given-name', auth.get('given-name', ''))} {auth.get('ce:surname', auth.get('surname', ''))}".strip() or auth.get("dc:creator", ""),
                "position": i + 1,
                "is_corresponding": False,
                "is_faculty": is_faculty
            })
        return authors

    def _normalize_paper(self, entry: Dict[str, Any], top_level_affiliation: Optional[List] = None, keywords_raw: Optional[str] = None) -> Dict[str, Any]:
        """Normalize a single Scopus entry into PaperData format.
        
        Handles both:
        - Search result entries (flat structure)
        - Abstract Retrieval entries (nested coredata or bibrecord)
        """
        # Scopus ID might be in dc:identifier or @id
        scopus_id = entry.get("dc:identifier", "").replace("SCOPUS_ID:", "") or entry.get("@id", "")
        authors = self._normalize_authors(entry)

        # Affiliations: prefer explicitly passed top_level_affiliation (from Abstract API)
        affiliations = top_level_affiliation if top_level_affiliation is not None else entry.get("affiliation", [])
        if isinstance(affiliations, dict):
            affiliations = [affiliations]
        countries = [aff.get("affiliation-country", "") for aff in (affiliations or []) if aff.get("affiliation-country")]
        countries = list(set(countries))
        
        # Open access
        oa = entry.get("openaccess", "0")
        is_oa = str(oa).lower() in ("1", "true")

        # Keywords
        kw_raw = keywords_raw if keywords_raw is not None else entry.get("authkeywords", "")
        if kw_raw and isinstance(kw_raw, str):
            keywords = [k.strip() for k in kw_raw.split(" | ") if k.strip()]
        elif isinstance(kw_raw, list):
            keywords = kw_raw
        else:
            keywords = []

        # Extraction logic with fallbacks for search vs abstract vs bibrecord
        title = entry.get("dc:title", entry.get("title", ""))
        abstract = entry.get("dc:description", entry.get("abstract", ""))
        year = entry.get("prism:coverDate", entry.get("pub-date", ""))[:4]
        doi = entry.get("prism:doi", entry.get("doi", ""))
        journal = entry.get("prism:publicationName", entry.get("sourcetitle", ""))
        issn = entry.get("prism:issn", entry.get("prism:eIssn", entry.get("issn", "")))
        
        # Citations: handle 'citedby-count' vs 'cited-by-count'
        citations = entry.get("citedby-count", entry.get("cited-by-count", 0))
        try:
            citations = int(citations)
        except (ValueError, TypeError):
            citations = 0

        return {
            "scopus_id": scopus_id,
            "title": title,
            "abstract": abstract, 
            "year": year,
            "doi": doi,
            "is_open_access": is_oa,
            "citation_count": citations,
            "journal_name": journal,
            "journal_issn": issn,
            "keywords": keywords,
            "authors": authors,
            "document_type": entry.get("subtype", entry.get("document-type", "")),
            "countries": countries
        }

    async def search_papers(self, affiliation_id: str, query: str = "", start: int = 0, count: int = 25, sort: str = "citedby-count") -> Dict[str, Any]:
        if affiliation_id.isdigit():
            full_query = f"AF-ID({affiliation_id})"
        else:
            full_query = f"AFFIL(\"{affiliation_id}\")"
        
        if query:
            full_query += f" AND {query}"
        
        params = {
            "query": full_query,
            "count": count,
            "start": start,
            "sort": sort,
            "field": "dc:title,dc:identifier,prism:coverDate,prism:doi,citedby-count,prism:publicationName,prism:issn,authkeywords,author,@auid,subtype,openaccess,affiliation"
        }
        
        data = await self._request("GET", "search/scopus", params=params)
        results = data.get("search-results", {})
        total_results = int(results.get("opensearch:totalResults", 0))
        entries = results.get("entry", [])
        
        # If no entries, it might be a single entry not in a list
        if isinstance(entries, dict):
            entries = [entries]
            
        papers = [self._normalize_paper(entry) for entry in entries if entry.get("dc:identifier")]
        return {
            "papers": papers,
            "total_results": total_results
        }

    async def get_paper_details(self, scopus_id: str) -> Dict[str, Any]:
        """Fetch full metadata for a paper using Abstract Retrieval API."""
        data = await self._request("GET", f"abstract/scopus_id/{scopus_id}", params={
            "field": "authors,affiliation,coredata,authkeywords"
        })
        response = data.get("abstracts-retrieval-response") or {}
        coredata = response.get("coredata") or {}
        
        # Fallback for core metadata if coredata is null
        if not coredata:
            item = response.get("item", {})
            bibrecord = item.get("bibrecord", {})
            head = bibrecord.get("head", {})
            coredata = {
                "dc:title": head.get("citation-title", {}).get("titletext", ""),
                "dc:description": head.get("abstracts", {}).get("abstract", {}).get("ce:para", ""),
                "prism:publicationName": head.get("source", {}).get("sourcetitle", ""),
                "prism:issn": head.get("source", {}).get("issn", {}).get("$", ""),
                "prism:doi": response.get("item", {}).get("ait", {}).get("open-accessinfo", {}).get("doi", ""),
                "citedby-count": coredata.get("cited-by-count", "0") # already null check above, but for clarity
            }

        # Full authors live at top-level 'authors' -> 'author' when field=authors requested
        authors_section = response.get("authors") or {}
        authors_list = authors_section.get("author", []) if authors_section else []
        if isinstance(authors_list, dict):
            authors_list = [authors_list]
        
        # Keywords in Abstract API are in coredata under 'authkeywords'  
        keywords_raw = coredata.get("authkeywords", "")
        
        # Abstract API: affiliations live at TOP LEVEL of response, NOT inside coredata
        top_level_affiliations = response.get("affiliation", [])
        if isinstance(top_level_affiliations, dict):
            top_level_affiliations = [top_level_affiliations]
        
        # Build normalized authors from full author list
        normalized_authors = []
        for i, auth in enumerate(authors_list):
            pref = auth.get("preferred-name", {})
            given = pref.get("ce:given-name", auth.get("ce:given-name", auth.get("given-name", "")))
            surname = pref.get("ce:surname", auth.get("ce:surname", auth.get("surname", "")))
            full_name = f"{given} {surname}".strip()
            
            # Check affiliation
            is_faculty = False
            affils = auth.get("affiliation", [])
            if isinstance(affils, dict):
                affils = [affils]
            for aff in affils:
                if aff.get("@id") == settings.SCOPUS_AFFILIATION_ID:
                    is_faculty = True
                    break
                    
            normalized_authors.append({
                "scopus_author_id": auth.get("@auid", auth.get("authid", "")),
                "full_name": full_name,
                "position": int(auth.get("@seq", i + 1)),
                "is_corresponding": False,
                "is_faculty": is_faculty
            })
        
        # Combine coredata with authors info for normalization
        entry = {**coredata, "authors": {"author": authors_list}, "abstract": coredata.get("dc:description", "")}
        result = self._normalize_paper(entry, top_level_affiliation=top_level_affiliations, keywords_raw=keywords_raw)
        result["authors"] = normalized_authors  # override with properly parsed list
        
        # The Abstract API's coredata may not always include dc:identifier; inject the known scopus_id
        if not result.get("scopus_id"):
            result["scopus_id"] = scopus_id
        return result

        # Combine coredata with authors info for normalization
        entry = {**coredata, "authors": {"author": authors_list}, "abstract": coredata.get("dc:description", "")}
        result = self._normalize_paper(entry, top_level_affiliation=top_level_affiliations, keywords_raw=keywords_raw)
        result["authors"] = normalized_authors  # override with properly parsed list
        # The Abstract API's coredata may not always include dc:identifier; inject the known scopus_id
        if not result.get("scopus_id"):
            result["scopus_id"] = scopus_id
        return result


    async def get_author(self, scopus_author_id: str) -> Dict[str, Any]:
        params = {"httpAccept": "application/json"}
        # Path is author/author_id/{id}
        data = await self._request("GET", f"author/author_id/{scopus_author_id}", params=params)
        
        profile = data.get("author-retrieval-response", [{}])[0].get("author-profile", {})
        preferred_name = profile.get("preferred-name", {})
        coredata = data.get("author-retrieval-response", [{}])[0].get("coredata", {})
        
        return {
            "scopus_author_id": scopus_author_id,
            "full_name": f"{preferred_name.get('given-name', '')} {preferred_name.get('surname', '')}".strip(),
            "orcid": coredata.get("orcid"),
            "h_index": int(coredata.get("h-index", 0)),
            "citation_count": int(coredata.get("cited-by-count", 0)),
            "works_count": int(coredata.get("document-count", 0))
        }

    async def get_all_institution_papers(self, affiliation_id: str) -> AsyncGenerator[List[Dict[str, Any]], None]:
        start = 0
        count = 25
        total = 1 # Initial value to enter loop
        
        if affiliation_id.isdigit():
            query_str = f"AF-ID({affiliation_id})"
        else:
            query_str = f"AFFIL(\"{affiliation_id}\")"
            
        while start < total:
            data = await self._request("GET", "search/scopus", params={
                "query": query_str,
                "count": count,
                "start": start,
                "sort": "citedby-count",
                "field": "dc:title,dc:identifier,prism:coverDate,prism:doi,citedby-count,prism:publicationName,prism:issn,authkeywords,author,@auid,subtype,openaccess,affiliation"
            })
            
            results = data.get("search-results", {})
            total = int(results.get("opensearch:totalResults", 0))
            entries = results.get("entry", [])
            
            if not entries:
                break
                
            if isinstance(entries, dict):
                entries = [entries]
            
            normalized_batch = [self._normalize_paper(entry) for entry in entries if entry.get("dc:identifier")]
            yield normalized_batch
            
            start += len(entries)
            
            # Respect rate limit: max 3 req/sec -> 0.34s delay per request
            await asyncio.sleep(0.34)
