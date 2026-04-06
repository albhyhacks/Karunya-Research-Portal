import React from "react";
import { useFetch } from "../hooks/useFetch";
import { analyticsApi } from "../api/papers";
import DashboardLayout from "../components/layout/DashboardLayout";
import { OverviewStats, YearlyChart, KeywordCloud } from "../components/analytics";

const AnalyticsPage = () => {
  const { data: overview, loading: overviewLoading } = useFetch(analyticsApi.getOverview);
  const { data: yearly, loading: yearlyLoading } = useFetch(analyticsApi.getYearlyOutput);
  const { data: keywords, loading: keywordsLoading } = useFetch(analyticsApi.getTopKeywords);

  return (
    <DashboardLayout title="Research Analytics" subtitle="Performance metrics and trends of institutional impact">
      <div className="px-12 py-8 space-y-8">
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
    </DashboardLayout>
  );
};

export default AnalyticsPage;
