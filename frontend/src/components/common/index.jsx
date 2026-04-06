import React from "react";
import { Search as SearchIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export const Spinner = ({ size = 24, className = "" }) => (
  <Loader2 size={size} className={`animate-spin text-[#0f2557] ${className}`} />
);

export const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-blue-50 text-blue-700 border-blue-100",
    success: "bg-green-50 text-green-700 border-green-100",
    navy: "bg-[#0f2557] text-white border-transparent",
    outline: "bg-transparent border-gray-200 text-gray-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative group w-full max-w-lg">
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0f2557] transition-colors" size={18} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2557]/20 focus:border-[#0f2557] transition-all bg-white shadow-sm"
      placeholder={placeholder}
    />
  </div>
);

export const Pagination = ({ current, total, perPage, onPageChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between space-x-4 mt-8 py-4">
      <span className="text-sm text-gray-500">
        Showing {(current - 1) * perPage + 1} to {Math.min(current * perPage, total)} of {total} results
      </span>
      <div className="flex space-x-2">
        <button
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
          className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="flex items-center px-4 font-medium text-gray-700 bg-white border border-gray-200 rounded">
          {current} / {totalPages}
        </span>
        <button
          disabled={current === totalPages}
          onClick={() => onPageChange(current + 1)}
          className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
