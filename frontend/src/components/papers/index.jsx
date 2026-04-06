import React from "react";
import { formatCitations, truncate } from "../../utils/format";
import { Badge } from "../common";
import { ExternalLink, X, BookOpen, Quote, Calendar, Hash } from "lucide-react";

export const PaperCard = ({ paper, onClick }) => (
  <div 
    onClick={() => onClick(paper)}
    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group flex flex-col h-full"
  >
    <div className="flex justify-between items-start mb-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant="navy">{paper.year}</Badge>
        {paper.is_open_access && <Badge variant="success">OA</Badge>}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-bold text-[#0f2557] uppercase tracking-wider">Citations</span>
        <span className="text-xl font-black text-[#0f2557] leading-none">{formatCitations(paper.citation_count)}</span>
      </div>
    </div>
    
    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0f2557] transition-colors mb-2 line-clamp-2 leading-snug">
      {paper.title}
    </h3>
    
    <div className="text-sm text-gray-500 mb-4 line-clamp-2 italic">
      {paper.authors?.length > 0 ? paper.authors.map(a => a.full_name).join(", ") : "Unknown Authors"}
    </div>
    
    <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400 font-medium uppercase tracking-widest">
      <span className="flex items-center truncate max-w-[70%]">
        <BookOpen className="inline mr-1" size={12} /> {paper.journal_name}
      </span>
      <span>{paper.doi ? "DOI Available" : ""}</span>
    </div>
  </div>
);

export const PaperDetail = ({ paper, onClose }) => {
  if (!paper) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 bg-[#0f2557] text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold line-clamp-2 pr-8">{paper.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
              <Quote className="mr-2" size={14} /> Abstract
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg font-serif">
              {paper.abstract || "No abstract available for this publication."}
            </p>
          </section>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center">
                <Calendar className="mr-2" size={14} /> Publication Year
              </h4>
              <span className="text-lg font-bold text-[#0f2557]">{paper.year}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center">
                <Hash className="mr-2" size={14} /> DOI
              </h4>
              <span className="text-sm font-mono text-blue-600 truncate block">
                {paper.doi || "N/A"}
              </span>
            </div>
          </div>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Authors</h3>
            <div className="flex flex-wrap gap-2">
              {paper.authors?.map((auth) => (
                <span key={auth.id} className="bg-gray-100 px-3 py-1.5 rounded text-sm font-medium text-gray-700 border border-gray-200">
                  {auth.full_name}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {paper.keywords?.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </section>

          <div className="pt-8 border-t border-gray-100 flex gap-4">
            {paper.scopus_id && (
              <a 
                href={`https://www.scopus.com/record/display.uri?eid=${paper.scopus_id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-[#0f2557] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-900 transition-colors shadow-lg"
              >
                <span>View on Scopus</span>
                <ExternalLink size={18} />
              </a>
            )}
            {paper.doi && (
              <a 
                href={`https://doi.org/${paper.doi}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-4 px-6 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
              >
                <span>Full Text (DOI)</span>
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PaperSkeleton = () => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm animate-pulse">
    <div className="w-16 h-6 bg-gray-100 rounded mb-4" />
    <div className="w-full h-5 bg-gray-200 rounded mb-2" />
    <div className="w-3/4 h-5 bg-gray-200 rounded mb-4" />
    <div className="w-1/2 h-4 bg-gray-100 rounded mb-6" />
    <div className="w-full h-4 bg-gray-50 rounded mt-auto" />
  </div>
);
