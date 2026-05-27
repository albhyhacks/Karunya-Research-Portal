import React, { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { analyticsApi } from "../../api/analytics";
import { DownloadCsvButton } from "./DownloadCsvButton";
import { Users, FileText } from "lucide-react";

export const ContributorsTab = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: availableYears, loading: loadingYears } = useFetch(analyticsApi.getOutputTypesAvailableYears);
  
  // Custom fetch function for this tab since it needs selectedYear
  const fetchContributorsBreakdown = React.useCallback(
    () => analyticsApi.getContributorsBreakdown(selectedYear),
    [selectedYear]
  );
  
  const { data, loading, error } = useFetch(fetchContributorsBreakdown, [fetchContributorsBreakdown]);

  if (loadingYears) {
    return <div className="h-[400px] animate-pulse bg-surface-container-lowest border border-outline-variant/10"></div>;
  }

  const { total_papers, unique_contributors_count, contributors } = data || { total_papers: 0, unique_contributors_count: 0, contributors: [] };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Global Filters ──────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest p-6 border border-outline-variant/10 flex items-center gap-6 rounded-lg shadow-sm">
        <h3 className="font-headline font-bold text-primary mr-4 text-lg">Filters</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-outline uppercase tracking-wider">Select Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-surface-container text-on-surface text-sm px-4 py-2 outline-none border border-outline-variant/30 font-bold focus:border-primary transition-colors cursor-pointer rounded"
          >
            {(availableYears || []).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] animate-pulse bg-surface-container-lowest border border-outline-variant/10"></div>
      ) : error ? (
        <div className="bg-error-container text-on-error-container p-4 rounded border-l-4 border-error">
          Failed to load contributor breakdown.
        </div>
      ) : (
        <>
          {/* ── Summary Stats ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest p-6 border-l-4 border-primary shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-outline uppercase tracking-wider">Total Papers</p>
                <p className="font-black text-4xl text-on-surface mt-2">{total_papers}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-full text-primary">
                <FileText size={32} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 border-l-4 border-secondary shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-outline uppercase tracking-wider">Unique Contributors</p>
                <p className="font-black text-4xl text-on-surface mt-2">{unique_contributors_count}</p>
              </div>
              <div className="bg-secondary/10 p-4 rounded-full text-secondary">
                <Users size={32} />
              </div>
            </div>
          </div>

          {/* ── Breakdown Table ───────────────────────────────────────────────── */}
          <div className="bg-surface-container-lowest border border-outline-variant/10 shadow-sm relative">
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold text-primary">Contributors List ({selectedYear})</h3>
              <DownloadCsvButton data={contributors} filename={`contributors_breakdown_${selectedYear}`} />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container text-xs uppercase tracking-wider font-bold text-on-surface-variant border-b border-outline-variant/20">
                    <th className="py-4 px-6">Rank</th>
                    <th className="py-4 px-6">Author Name</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6 text-right">Papers</th>
                  </tr>
                </thead>
                <tbody>
                  {contributors?.length > 0 ? (
                    contributors.map((author, index) => (
                      <tr 
                        key={author.id} 
                        className="border-b border-outline-variant/10 hover:bg-surface-container/30 transition-colors"
                      >
                        <td className="py-4 px-6 font-medium text-outline">#{index + 1}</td>
                        <td className="py-4 px-6 font-bold text-on-surface">{author.name}</td>
                        <td className="py-4 px-6 text-on-surface-variant text-sm">{author.department}</td>
                        <td className="py-4 px-6 font-black text-primary text-right">{author.papers}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-outline">
                        No contributors found for {selectedYear}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
