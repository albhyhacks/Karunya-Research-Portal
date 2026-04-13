import React, { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { analyticsApi } from "../api/analytics";
import DashboardLayout from "../components/layout/DashboardLayout";
import { OverviewStats, YearlyChart, KeywordCloud } from "../components/analytics";
import { OutputTypesTab } from "../components/analytics/OutputTypesTab";
import { ResearcherGrowthTab } from "../components/analytics/ResearcherGrowthTab";
import { GapAnalysisTab } from "../components/analytics/GapAnalysisTab";
import { CollaborationTab } from "../components/analytics/CollaborationTab";

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("Overview");
  
  const tabs = ["Overview", "Output Types", "Researcher Growth", "Gap Analysis", "Collaboration"];

  // Overview Data Fetching
  const { data: overview, loading: overviewLoading } = useFetch(analyticsApi.getOverview);
  const { data: yearly, loading: yearlyLoading } = useFetch(analyticsApi.getYearlyOutput);
  const { data: keywords, loading: keywordsLoading } = useFetch(analyticsApi.getTopKeywords);

  return (
    <DashboardLayout title="Research Analytics" subtitle="Performance metrics and trends of institutional impact">
      <div className="px-12 py-8">
        
        {/* TAB BAR */}
        <div className="flex space-x-2 border-b-2 border-outline-variant/30 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold text-sm tracking-wide transition-all whitespace-nowrap \${
                activeTab === tab
                  ? "border-b-4 border-primary text-primary"
                  : "text-outline hover:text-on-surface hover:bg-surface-container/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === "Overview" && (
          <div className="space-y-8 animate-fade-in">
            {overviewLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-pulse">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="bg-surface-container-lowest p-6 border-l-4 border-outline/20 h-24"></div>
                ))}
              </div>
            ) : (
              <OverviewStats stats={overview} />
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {yearlyLoading ? (
                 <div className="bg-surface-container-lowest h-[400px] border border-outline-variant/10 animate-pulse"></div>
              ) : (
                 <YearlyChart data={yearly} />
              )}
              
              {keywordsLoading ? (
                 <div className="bg-surface-container-lowest h-[400px] border border-outline-variant/10 animate-pulse"></div>
              ) : (
                 <KeywordCloud keywords={keywords} />
              )}
            </div>
          </div>
        )}

        {activeTab === "Output Types" && <OutputTypesTab />}
        
        {activeTab === "Researcher Growth" && <ResearcherGrowthTab />}
        
        {activeTab === "Gap Analysis" && <GapAnalysisTab />}
        
        {activeTab === "Collaboration" && <CollaborationTab />}

      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
