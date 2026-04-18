import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useFetch, useSearch } from "../hooks/useFetch";
import { authorsApi } from "../api/papers";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Pagination } from "../components/common";

const DEPARTMENTS = [
  "Aerospace Engineering",
  "Agriculture",
  "Applied Chemistry",
  "Applied Physics",
  "Biomedical Engineering",
  "Biotechnology",
  "Civil Engineering",
  "Computer Sciences and Technology",
  "Management Studies",
  "Mechanical Engineering"
];


// Helper to get initials for the avatar
const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// Map department to a color class for the avatar background
const getBgColor = (idx) => {
  const colors = [
    "bg-[#efdfd7]", "bg-primary-fixed", "bg-secondary-fixed", 
    "bg-surface-container-highest", "bg-[#ddc0bf]", "bg-tertiary-fixed-dim"
  ];
  return colors[idx % colors.length];
};

const AuthorCard = ({ author, index }) => {
  return (
    <div className="bg-surface-container-lowest p-8 flex flex-col group transition-all duration-500 hover:translate-y-[-4px] border border-outline-variant/10">
      <div className="flex justify-between items-start mb-8">
        <div className={`w-20 h-20 ${getBgColor(index)} flex items-center justify-center text-primary font-headline text-2xl font-bold`}>
          {getInitials(author.full_name)}
        </div>
        <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-right max-w-xs truncate">
          {author.department || "General Department"}
        </span>
      </div>
      <div className="mb-6">
        <h3 className="font-headline text-xl font-bold text-on-surface mb-1 truncate" title={author.full_name}>
          {author.full_name}
        </h3>
        <p className="text-on-surface-variant text-sm font-medium tracking-wide truncate">
          {author.designation || "Researcher"}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8 pt-6 border-t border-outline/10">
        <div>
          <p className="text-secondary font-headline text-lg font-bold">{author.h_index || 0}</p>
          <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">h-index</p>
        </div>
        <div>
          <p className="text-secondary font-headline text-lg font-bold">{(author.citation_count || 0).toLocaleString()}</p>
          <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Citations</p>
        </div>
        <div>
          <p className="text-secondary font-headline text-lg font-bold">{author.papers_count || 0}</p>
          <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">Papers</p>
        </div>
      </div>
      <Link to={`/authors/${author.id}`} className="w-full bg-primary text-on-primary py-4 text-xs font-bold uppercase tracking-widest hover:bg-primary-container transition-colors mt-auto text-center block">
        View Profile →
      </Link>
    </div>
  );
};

const AuthorsPage = () => {
  const { query, setQuery, debouncedQuery, filters, updateFilters, page, setPage, perPage } = useSearch();
  const selectedDept = filters.department || "";

  const { data, loading, error } = useFetch(
    () => authorsApi.list({ q: debouncedQuery, department: selectedDept || undefined, page, per_page: perPage }), 
    [debouncedQuery, selectedDept, page]
  );

  return (
    <DashboardLayout title="Faculty & Researchers" subtitle="Research profiles of Karunya Institute faculty">
      {/* Filter Canvas */}
      <section className="px-10 py-8 bg-surface-container-low border-b border-outline-variant/10">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => updateFilters({ department: "" })}
            className={`px-6 py-2 font-bold text-xs uppercase tracking-widest transition-all shrink-0 ${!selectedDept ? 'bg-secondary text-primary border border-secondary' : 'border border-outline/20 text-on-surface-variant hover:border-primary'}`}
          >
            All
          </button>
          {DEPARTMENTS.map((dept) => (
            <button 
              key={dept} 
              onClick={() => updateFilters({ department: dept })}
              className={`px-6 py-2 font-bold text-xs uppercase tracking-widest transition-all shrink-0 ${selectedDept === dept ? 'bg-secondary text-primary border border-secondary' : 'border border-outline/20 text-on-surface-variant hover:border-primary'}`}
            >
              {dept}
            </button>
          ))}
        </div>
      </section>

      {/* Faculty Grid */}
      <section className="px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {loading ? (
             Array(6).fill(0).map((_, i) => (
               <div key={i} className="bg-surface-container-lowest p-8 h-[380px] animate-pulse border border-outline-variant/10">
                 <div className="w-20 h-20 bg-surface-container-highest mb-8"></div>
                 <div className="h-6 bg-surface-container-highest w-3/4 mb-4"></div>
                 <div className="h-4 bg-surface-container-highest w-1/2 mb-8"></div>
                 <div className="border-t border-outline/10 pt-6 grid grid-cols-3 gap-4">
                   <div className="h-10 bg-surface-container-highest"></div>
                   <div className="h-10 bg-surface-container-highest"></div>
                   <div className="h-10 bg-surface-container-highest"></div>
                 </div>
               </div>
             ))
          ) : data?.results?.length ? (
            data.results.map((author, idx) => (
              <AuthorCard key={author.id} author={author} index={idx} />
            ))
          ) : (
            <div className="col-span-12 text-center py-20 text-on-surface-variant">
              No faculty members found.
            </div>
          )}
        </div>
        
        {!loading && data && data.total > perPage && (
          <div className="mt-12">
            <Pagination current={page} total={data.total} perPage={perPage} onPageChange={setPage} />
          </div>
        )}
      </section>
      
      {/* Asymmetric Bottom Section */}
      <div className="px-10 pb-12">
        <div className="mt-12 grid grid-cols-12 gap-8 items-center border-t border-outline/10 pt-16">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="font-headline text-4xl font-bold text-primary mb-6 leading-tight">Can't find a specific researcher?</h2>
            <p className="text-on-surface-variant text-lg max-w-xl mb-10">Access our comprehensive institutional repository to browse by project, citation record, or interdisciplinary collaboration networks.</p>
            <div className="flex gap-4">
              <Link to="/papers" className="bg-primary hover:bg-primary/90 text-on-primary px-8 py-4 text-xs font-bold uppercase tracking-widest text-center transition-opacity flex items-center justify-center">
                 Access Repository
              </Link>
              <button className="border border-primary text-primary px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all">
                 Download Faculty Directory
              </button>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5 relative h-80 bg-surface-container-high overflow-hidden">
            <img 
              alt="Karunya Campus Research Building" 
              className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-1000" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCg6Dzwd2wX_edZR89Uh4D67iBCDdwg_9cdXWdM2kPnZ7pnsZWhSn87MT2pgZoLMDDv1t4_14o89ScbX9n9B2O7HVtuBMQUJXLTI8qNagvUT7lKgE_d0AjXfVxaP_yDgisFOaFNmxnvco8uY2veS-TihmZOEIDPj9eiH9S-TY_3_329UcilfQVj2p58PygMbPYLGSb0Jrmltf4Mp9yoRucXps8o3-b5EqjJpZhQDWt37NGhVZ0zfW4k4CZJGvnpdhRN00Ldj6694v9"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-primary/90 text-on-primary p-8 max-w-xs">
                <p className="font-headline text-xl italic mb-2">"True knowledge is the bridge between tradition and the future."</p>
                <p className="text-[10px] uppercase tracking-widest font-bold">— Karunya Institutional Ethos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuthorsPage;
