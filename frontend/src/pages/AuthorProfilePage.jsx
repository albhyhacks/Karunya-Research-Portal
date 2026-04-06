import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { api } from "../api/client";
import Sidebar from "../components/layout/Sidebar";

const AuthorProfilePage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("publications");
  
  // Fetch detailed author info which includes their papers
  const { data: author, loading, error } = useFetch(() => api.get(`/api/v1/authors/${id}`), [id]);

  if (loading) {
    return (
      <div className="bg-surface text-on-surface font-body flex min-h-screen">
        <Sidebar />
        <div className="ml-64 flex-1 p-12 text-center text-on-surface-variant flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-24 h-24 bg-surface-container-highest rounded-full mb-4"></div>
            <div className="h-4 w-48 bg-surface-container-highest mb-2"></div>
            <div className="h-3 w-32 bg-surface-container-highest"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="bg-surface text-on-surface font-body flex min-h-screen">
        <Sidebar />
        <div className="ml-64 flex-1 p-12 text-center text-error flex items-center justify-center">
          <p>Failed to load faculty profile. They may not exist in the database.</p>
        </div>
      </div>
    );
  }

  // Get initials for profile picture fallback
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const papersList = author.papers || [];

  return (
    <div className="bg-surface text-on-surface font-body flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col pt-16 md:pt-0"> {/* Adjusted for mobile safety, though dashboard is desktop first */}
        
        {/* Profile Header Section */}
        <section className="h-[200px] bg-gradient-to-r from-primary to-primary-container relative flex items-center px-12 overflow-hidden shrink-0">
          {/* Background Text Overlay for Archivist Feel */}
          <div className="absolute right-0 top-0 opacity-10 select-none pointer-events-none translate-x-1/4 -translate-y-1/4 hidden md:block">
            <h2 className="text-[200px] font-headline font-bold text-white">KARUNYA</h2>
          </div>
          <div className="flex items-center gap-10 relative z-10">
            <div className="w-[100px] h-[100px] border-4 border-secondary flex-shrink-0 bg-surface-container flex items-center justify-center overflow-hidden">
              <span className="font-headline text-4xl text-primary font-bold">
                {getInitials(author.full_name)}
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-headline font-bold text-white mb-2">{author.full_name}</h1>
              <p className="text-secondary font-headline italic tracking-wide text-lg md:text-xl">
                {author.designation || "Researcher"}, {author.department || "General Department"}
              </p>
            </div>
          </div>
        </section>

        {/* Metric Pills Bar */}
        <div className="flex flex-wrap gap-4 px-12 py-6 bg-surface-container-low border-b border-outline-variant/10 shrink-0">
          <div className="border border-secondary px-6 py-2 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">h-index</span>
            <span className="text-xl font-headline font-bold text-primary">{author.h_index || 0}</span>
          </div>
          <div className="border border-secondary px-6 py-2 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Citations</span>
            <span className="text-xl font-headline font-bold text-primary">{(author.citation_count || 0).toLocaleString()}</span>
          </div>
          <div className="border border-secondary px-6 py-2 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Publications</span>
            <span className="text-xl font-headline font-bold text-primary">{papersList.length}</span>
          </div>
        </div>

        {/* Profile Body: Two Columns */}
        <div className="px-12 py-10 flex flex-col lg:flex-row gap-12 flex-1">
          
          {/* Left Column */}
          <aside className="w-full lg:w-[300px] space-y-8 shrink-0">
            {/* Identity Card */}
            <div className="lg:sticky lg:top-10 bg-surface-container-lowest p-6 border border-outline-variant/10 space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-4">Official Identifiers</span>
                <div className="space-y-3">
                  {author.orcid && (
                    <a className="flex items-center gap-3 text-sm text-on-surface hover:text-primary transition-colors" href={`https://orcid.org/${author.orcid}`} target="_blank" rel="noreferrer">
                      <span className="material-symbols-outlined text-secondary text-lg">link</span>
                      orcid.org/{author.orcid}
                    </a>
                  )}
                  {author.scopus_author_id && (
                    <div className="flex items-center gap-3 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-lg">id_card</span>
                      Scopus: {author.scopus_author_id}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-lg">apartment</span>
                    {author.department || "General Department"}
                  </div>
                </div>
              </div>
            </div>
            
            <Link to="/authors" className="flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary transition-colors mt-8">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Faculty List
            </Link>
          </aside>

          {/* Right Column */}
          <section className="flex-1">
            {/* Tab Bar */}
            <div className="flex gap-10 border-b border-outline-variant/10 mb-8">
              <button 
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'publications' ? 'text-primary border-b-2 border-secondary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
                onClick={() => setActiveTab('publications')}
              >
                Publications
              </button>
            </div>

            {/* Publications List */}
            {activeTab === 'publications' && (
              <div className="space-y-6">
                {papersList.length > 0 ? papersList.map(paper => (
                  <article key={paper.id} className="bg-surface-container-lowest border border-outline-variant/5 hover:border-primary/20 transition-all p-8 flex flex-col gap-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                         {paper.is_open_access && (
                            <span className="text-[9px] px-2 py-0.5 bg-[#dcfce7] text-[#166534] font-bold uppercase tracking-tighter border border-[#166534]/20">OA</span>
                         )}
                      </div>
                      {paper.year && <time className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{paper.year}</time>}
                    </div>
                    <Link to="/papers" state={{ search: paper.title }} className="text-xl md:text-2xl font-headline font-bold text-primary hover:text-secondary transition-colors leading-tight cursor-pointer">
                      {paper.title}
                    </Link>
                    <p className="text-sm text-on-surface-variant leading-relaxed italic">{paper.journal_name || "Unknown Journal"}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[9px] border border-outline-variant/30 bg-surface-container-low px-3 py-1 uppercase tracking-widest font-semibold text-on-surface-variant">
                        Citations: {paper.citation_count || 0}
                      </span>
                      {paper.doi && (
                         <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="text-[9px] border border-outline-variant/30 px-3 py-1 uppercase tracking-widest font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center gap-1">
                           <span className="material-symbols-outlined text-[10px]">link</span> DOI
                         </a>
                      )}
                    </div>
                  </article>
                )) : (
                  <div className="text-on-surface-variant italic p-8 bg-surface-container-low">Zero publications recorded in portal.</div>
                )}
              </div>
            )}
          </section>
        </div>
        
        {/* Footer */}
        <footer className="px-10 py-12 bg-surface-container border-t border-outline/5 mt-auto w-full">
          <div className="flex flex-col md:flex-row justify-between md:items-end">
            <div className="mb-4 md:mb-0">
              <p className="text-primary font-bold tracking-tighter mb-1 uppercase text-sm">Karunya Institute of Technology and Sciences</p>
              <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">© {new Date().getFullYear()} Karunya Portal. All intellectual assets protected.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AuthorProfilePage;
