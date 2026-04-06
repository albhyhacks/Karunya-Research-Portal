import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useFetch, useSearch } from "../hooks/useFetch";
import { papersApi } from "../api/papers";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Pagination } from "../components/common";

const PaperCard = ({ paper, onClick }) => {
  return (
    <article 
      onClick={() => onClick(paper)}
      className="bg-surface-container-lowest border-l-4 border-primary p-8 group hover:bg-surface-container-low transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          {paper.year && (
            <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-bold tracking-tighter">
              {paper.year}
            </span>
          )}
          {paper.is_open_access && (
            <span className="px-2 py-0.5 bg-[#dcfce7] text-[#166534] text-[10px] font-bold tracking-tighter border border-[#166534]/20">
              OA
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-secondary">
          <span className="font-bold text-lg">{paper.citation_count || 0}</span>
          <span className="text-[10px] uppercase font-bold tracking-widest">Citations</span>
        </div>
      </div>
      <h3 className="font-headline text-xl font-bold text-on-surface group-hover:text-primary transition-colors mb-3 leading-tight line-clamp-2">
        {paper.title}
      </h3>
      <p className="text-sm text-on-surface-variant mb-2 truncate">
        {paper.authors?.length > 0 ? paper.authors.map(a => a.full_name).join(", ") : "Unknown Authors"}
      </p>
      <p className="text-xs text-secondary italic mb-6 truncate">
        {paper.journal_name || "Unknown Journal"}
      </p>
      <div className="flex flex-wrap gap-2 mb-8">
        {(paper.keywords || []).slice(0, 3).map((kw, i) => (
          <span key={i} className="px-2 py-1 bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant text-[10px] font-bold uppercase truncate max-w-[150px]">
            {kw}
          </span>
        ))}
      </div>
      <button className="text-primary font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform mt-auto">
        View Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>
    </article>
  );
};

const PaperDetailSlideover = ({ paper, onClose }) => {
  if (!paper) return null;

  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[60] flex justify-end transition-opacity">
      <div className="w-full max-w-[480px] bg-surface-container-lowest h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="bg-primary text-white p-6 flex justify-between items-center">
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 truncate pr-8">
            {paper.title}
          </p>
          <button onClick={onClose} className="hover:rotate-90 transition-transform">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {/* Content Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-8 space-y-8">
            <h2 className="font-headline text-2xl font-bold text-primary leading-tight">
              {paper.title}
            </h2>
            
            {/* Authors */}
            {paper.authors && paper.authors.length > 0 && (
              <div className="space-y-3">
                <label className="uppercase tracking-widest text-[10px] font-bold text-outline">Authors</label>
                <div className="flex flex-wrap gap-2">
                  {paper.authors.map((auth, i) => (
                    <span key={i} className="px-3 py-1 bg-surface-container-high border border-outline-variant/30 text-xs font-bold flex items-center gap-1">
                      {auth.is_corresponding && <span className="material-symbols-outlined text-[14px] text-secondary">stars</span>}
                      {auth.full_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-6 border-y border-outline-variant/15 py-6">
              <div className="space-y-1">
                <label className="uppercase tracking-widest text-[10px] font-bold text-outline">Journal</label>
                <p className="text-sm font-bold italic line-clamp-2">{paper.journal_name || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <label className="uppercase tracking-widest text-[10px] font-bold text-outline">ISSN</label>
                <p className="text-sm font-bold">{paper.journal_issn || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <label className="uppercase tracking-widest text-[10px] font-bold text-outline">Year</label>
                <p className="text-sm font-bold">{paper.year || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <label className="uppercase tracking-widest text-[10px] font-bold text-outline">Citations</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-secondary">{paper.citation_count || 0}</span>
                  <span className="material-symbols-outlined text-secondary">trending_up</span>
                </div>
              </div>
            </div>
            
            {/* Abstract */}
            {paper.abstract && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="uppercase tracking-widest text-[10px] font-bold text-outline">Abstract</label>
                </div>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {paper.abstract}
                </p>
              </div>
            )}
            
            {/* Links/Actions */}
            <div className="space-y-4 pt-4">
              {paper.doi && (
                <div className="flex items-center gap-2 p-3 bg-surface-container-low border border-outline-variant/10">
                  <span className="material-symbols-outlined text-outline">link</span>
                  <span className="text-xs font-mono text-outline select-all truncate">{paper.doi}</span>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {paper.doi && (
                  <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="w-full py-4 bg-primary text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined">article</span>
                    Open Source
                  </a>
                )}
                {paper.scopus_id && (
                  <a href={`https://www.scopus.com/record/display.uri?eid=2-s2.0-${paper.scopus_id}&origin=resultslist`} target="_blank" rel="noreferrer" className="w-full py-4 border-2 border-primary text-primary font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-primary/5 transition-colors">
                    View on Scopus
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Panel Footer */}
        <div className="p-8 border-t border-outline-variant/15 bg-surface-container-lowest flex items-center justify-between mt-auto">
          <div className="text-right ml-auto">
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Internal ID</p>
            <p className="text-xs text-primary font-bold">{paper.scopus_id || paper.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PapersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { query, setQuery, debouncedQuery, page, setPage, perPage, filters, updateFilters } = useSearch(
    searchParams.get("q") || ""
  );
  
  const [selectedPaper, setSelectedPaper] = useState(null);

  useEffect(() => {
    const params = { q: debouncedQuery, page: page.toString() };
    if (filters.year_from) params.year_from = filters.year_from;
    if (filters.year_to) params.year_to = filters.year_to;
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, page, filters, setSearchParams]);

  const { data, loading, error } = useFetch(() => papersApi.list({ 
    q: debouncedQuery, 
    page, 
    per_page: perPage,
    ...filters
  }), [debouncedQuery, page, JSON.stringify(filters)]);

  return (
    <DashboardLayout title="Publications" subtitle="Institutional repository of peer-reviewed research">
      <div className="px-12 py-8 space-y-8">
        
        {/* Sticky Filter Bar */}
        <section className="bg-surface-container-lowest p-8 shadow-sm border-l-4 border-primary">
          <div className="grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 md:col-span-4 space-y-2">
              <label className="uppercase tracking-widest text-[10px] font-bold text-outline">Search Keyword</label>
              <input 
                className="w-full bg-transparent border-0 border-b border-outline/30 focus:border-secondary focus:ring-0 text-sm py-2" 
                placeholder="Search by title, keyword, author..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="col-span-6 md:col-span-3 space-y-2">
              <label className="uppercase tracking-widest text-[10px] font-bold text-outline">Year Range</label>
              <div className="flex items-center gap-2">
                <input 
                  className="w-full bg-transparent border-0 border-b border-outline/30 focus:border-secondary focus:ring-0 text-sm py-2 text-center" 
                  placeholder="2018" 
                  value={filters.year_from || ""}
                  onChange={e => updateFilters({ year_from: e.target.value })}
                />
                <span className="text-outline">—</span>
                <input 
                  className="w-full bg-transparent border-0 border-b border-outline/30 focus:border-secondary focus:ring-0 text-sm py-2 text-center" 
                  placeholder="2024" 
                  value={filters.year_to || ""}
                  onChange={e => updateFilters({ year_to: e.target.value })}
                />
              </div>
            </div>
            
            <div className="col-span-6 md:col-span-5 flex justify-end gap-4 pb-1">
              <button 
                onClick={() => updateFilters({ year_from: null, year_to: null, is_open_access: null })}
                className="text-[10px] uppercase font-bold text-secondary underline underline-offset-4 decoration-secondary/30 hidden md:block"
              >
                Clear all
              </button>
            </div>
          </div>
        </section>
        
        {/* Results Header */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-outline italic">
            Showing <span className="text-primary font-bold">{loading ? "..." : data?.results?.length || 0}</span> of {loading ? "..." : data?.total || 0} research publications
          </p>
        </div>
        
        {/* Publication Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
             Array(6).fill(0).map((_, i) => (
               <div key={i} className="bg-surface-container-lowest border-l-4 border-outline/20 p-8 h-[250px] animate-pulse">
                  <div className="h-4 bg-surface-container-highest w-20 mb-4"></div>
                  <div className="h-6 bg-surface-container-highest w-full mb-2"></div>
                  <div className="h-6 bg-surface-container-highest w-3/4 mb-4"></div>
                  <div className="h-4 bg-surface-container-highest w-1/2 mb-6"></div>
                  <div className="h-6 bg-surface-container-highest w-1/4 mt-auto"></div>
               </div>
             ))
          ) : data?.results?.length ? (
            data.results.map(paper => (
              <PaperCard key={paper.id} paper={paper} onClick={setSelectedPaper} />
            ))
          ) : (
             <div className="col-span-full py-20 text-center text-on-surface-variant">
               No publications found matching your criteria.
             </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && data && data.total > perPage && (
          <div className="py-12 flex justify-center">
            <Pagination current={page} total={data.total} perPage={perPage} onPageChange={setPage} />
          </div>
        )}
      </div>
      
      {/* Detail Slideover */}
      {selectedPaper && (
        <PaperDetailSlideover paper={selectedPaper} onClose={() => setSelectedPaper(null)} />
      )}
    </DashboardLayout>
  );
};

export default PapersPage;
