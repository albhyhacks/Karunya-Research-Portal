import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await api.get("/api/analytics/overview");
        setOverview(response);
      } catch (error) {
        console.error("Failed to load overview data", error);
        showToast("Failed to load dashboard metrics", "error");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOverview();
  }, [showToast]);

  return (
    <DashboardLayout title="Dashboard" subtitle="Overview and Highlights">
      <div className="max-w-7xl mx-auto px-6 py-12 md:px-10 md:py-16 space-y-16 pb-24">
        
        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-8 text-on-primary relative overflow-hidden shadow-xl">
           <div 
             className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none opacity-20 transform translate-x-1/4 translate-y-1/4"
             style={{
               backgroundImage: "radial-gradient(circle, #fff 10%, transparent 10%)",
               backgroundSize: "20px 20px"
             }}
           ></div>
           
           <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
             <div>
               <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4 tracking-tight">
                 Welcome back, {user?.full_name?.split(" ")[0] || "Researcher"}
               </h1>
               <p className="text-secondary-container text-lg font-body max-w-xl leading-relaxed">
                 Here's a quick overview of what's happening across the Karunya Research Portal today. Your command center for academic excellence.
               </p>
             </div>
             <div className="hidden md:flex justify-end pr-8">
                <div className="w-32 h-32 rounded-full border-4 border-secondary/30 flex items-center justify-center overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm">
                 <span className="material-symbols-outlined text-7xl text-secondary opacity-90">space_dashboard</span>
                </div>
             </div>
           </div>
        </section>

        {/* Overview Stats */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-headline text-on-surface">Platform Insights</h2>
            <Link to="/analytics" className="text-primary font-medium hover:underline flex items-center gap-1 group">
              View Detailed Analytics 
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-surface-container rounded-xl p-6 h-32 animate-pulse border border-outline-variant/20"></div>
              ))}
            </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatCard 
                 title="Total Publications" 
                 value={overview?.total_papers || 0} 
                 icon="library_books" 
                 color="text-primary"
                 bg="bg-primary-container"
               />
               <StatCard 
                 title="Active Researchers" 
                 value={overview?.total_authors || 0} 
                 icon="groups" 
                 color="text-secondary"
                 bg="bg-secondary-container"
               />
               <StatCard 
                 title="Total Citations" 
                 value={overview?.total_citations || 0} 
                 icon="format_quote" 
                 color="text-tertiary"
                 bg="bg-tertiary-container"
               />
               <StatCard 
                 title="Published This Year" 
                 value={overview?.papers_this_year || 0} 
                 icon="calendar_month" 
                 color="text-secondary"
                 bg="bg-surface-container-high"
               />
             </div>
          )}
        </section>

        {/* Bottom Grid: Quick Actions & Highlights */}
        <section className="grid md:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="md:col-span-1 space-y-6">
             <h2 className="text-2xl font-headline text-on-surface">Quick Actions</h2>
             <div className="flex flex-col gap-4">
                <ActionCard 
                  to="/papers" 
                  icon="search" 
                  title="Browse Publications" 
                  desc="Search through the entire university repository"
                />
                <ActionCard 
                  to="/authors" 
                  icon="person_search" 
                  title="Find Researchers" 
                  desc="Explore faculty profiles and departments"
                />
                <ActionCard 
                  to="/analytics" 
                  icon="bar_chart" 
                  title="Platform Analytics" 
                  desc="View detailed charts and growth trends"
                />
                {isAdmin && (
                  <ActionCard 
                    to="/admin" 
                    icon="admin_panel_settings" 
                    title="Admin Console" 
                    desc="Manage users, papers, and system settings"
                    isAdminBtn={true}
                  />
                )}
             </div>
          </div>

          {/* Highlight Section */}
          <div className="md:col-span-2 space-y-6">
             <h2 className="text-2xl font-headline text-on-surface">Spotlight</h2>
             <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/30 h-full flex flex-col justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs uppercase tracking-wider w-max">
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  Most Cited Work
                </div>
                
                {isLoading ? (
                  <div className="space-y-4 w-3/4">
                    <div className="h-8 bg-surface-container-high rounded animate-pulse"></div>
                    <div className="h-8 bg-surface-container-high rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-surface-container-high rounded animate-pulse w-1/4 mt-6"></div>
                  </div>
                ) : overview?.most_cited_paper ? (
                  <>
                    <h3 className="text-2xl md:text-3xl font-headline font-bold text-on-surface leading-tight mb-6">
                      {overview.most_cited_paper.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto">
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                           <span className="material-symbols-outlined">format_quote</span>
                         </div>
                         <div>
                           <p className="text-sm text-on-surface-variant">Total Citations</p>
                           <p className="text-2xl font-bold text-primary">{overview.most_cited_paper.citations}</p>
                         </div>
                       </div>
                       <Link 
                         to={`/papers?q=${encodeURIComponent(overview.most_cited_paper.title)}`} 
                         className="px-6 py-3 bg-surface-container-highest hover:bg-primary hover:text-white text-on-surface font-medium rounded-full transition-colors flex items-center gap-2"
                       >
                         View Details
                         <span className="material-symbols-outlined text-sm">arrow_forward</span>
                       </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-on-surface-variant flex flex-col items-center justify-center space-y-3 py-12">
                     <span className="material-symbols-outlined text-4xl opacity-50">article</span>
                     <p>No spotlight data available</p>
                  </div>
                )}
             </div>
          </div>

        </section>
      </div>
    </DashboardLayout>
  );
};

// Sub-components for cleanliness
const StatCard = ({ title, value, icon, color, bg }) => (
  <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/30 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`${bg} ${color} w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <div>
      <h4 className="text-on-surface-variant text-sm font-medium mb-1">{title}</h4>
      <p className="text-3xl font-headline font-bold text-on-surface">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  </div>
);

const ActionCard = ({ to, icon, title, desc, isAdminBtn }) => (
  <Link 
    to={to} 
    className={`p-4 rounded-xl flex items-center gap-4 transition-all duration-300 border border-outline-variant/20 hover:shadow-md group ${
      isAdminBtn 
        ? "bg-error/5 hover:bg-error/10 hover:border-error/30" 
        : "bg-surface-bright hover:bg-surface-container-low hover:border-primary/30"
    }`}
  >
    <div className={`${isAdminBtn ? "text-error" : "text-primary"} bg-background w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </div>
    <div>
      <h4 className={`font-medium ${isAdminBtn ? "text-error" : "text-on-surface"} group-hover:text-primary transition-colors`}>{title}</h4>
      <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
    </div>
  </Link>
);

export default DashboardPage;
