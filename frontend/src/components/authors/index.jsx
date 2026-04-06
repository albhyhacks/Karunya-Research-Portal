import React from "react";
import { Link } from "react-router-dom";
import { getInitials, getBgColorFromHash, formatCitations } from "../../utils/format";
import { User, Award, Quote, FileText, ChevronRight } from "lucide-react";

export const AuthorCard = ({ author }) => (
  <Link 
    to={`/authors/${author.id}`}
    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex flex-col items-center text-center"
  >
    <div 
      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-inner group-hover:scale-105 transition-transform"
      style={{ backgroundColor: getBgColorFromHash(author.department) }}
    >
      {getInitials(author.full_name)}
    </div>
    
    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0f2557] transition-colors mb-1 uppercase tracking-tight">
      {author.full_name}
    </h3>
    <p className="text-sm text-[#0f2557] font-semibold mb-4 bg-blue-50 px-3 py-1 rounded-full">
      {author.department || "General Department"}
    </p>
    
    <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-gray-50 mt-auto">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">H-Index</span>
        <span className="text-lg font-black text-gray-700">{author.h_index}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Citations</span>
        <span className="text-lg font-black text-gray-700">{formatCitations(author.citation_count)}</span>
      </div>
    </div>
  </Link>
);

export const AuthorSkeleton = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse flex flex-col items-center text-center">
    <div className="w-20 h-20 rounded-full bg-gray-100 mb-4" />
    <div className="w-3/4 h-5 bg-gray-200 rounded mb-2" />
    <div className="w-1/2 h-4 bg-gray-100 rounded mb-6" />
    <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-gray-50">
      <div className="h-10 bg-gray-50 rounded" />
      <div className="h-10 bg-gray-50 rounded" />
    </div>
  </div>
);
