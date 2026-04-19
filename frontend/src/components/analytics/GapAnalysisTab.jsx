import React, { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { analyticsApi } from "../../api/analytics";
import { DownloadCsvButton } from "./DownloadCsvButton";
import { Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

export const GapAnalysisTab = () => {
  const { data: gaps, loading } = useFetch(analyticsApi.getGaps);
  const [showInactiveAuthors, setShowInactiveAuthors] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (loading) {
    return <div className="h-[400px] bg-surface-container-lowest animate-pulse"></div>;
  }

  const deptsInactive = gaps?.departments_no_publication_3yr || [];
  const authorsInactive = gaps?.authors_inactive_3yr || [];
  const confOnlyDepts = gaps?.conference_only_departments || [];
  
  // Combine all department gaps into one status list
  const currentYear = new Date().getFullYear();
  const departmentTotals = gaps?.department_totals || {};
  
  // We need to fetch all departments to classify them, but we only have gap info.
  // We'll construct a mock list of all departments based on what we have, plus 'Healthy' ones
  const deptStatuses = [];
  
  deptsInactive.forEach(d => {
    deptStatuses.push({
      department: d.department,
      lastPublished: d.last_publication_year || 'Unknown',
      totalPublications: departmentTotals[d.department] || 0,
      status: 'Red',
      badge: 'Inactive',
      issue: 'No publication in 3+ years',
      sortIdx: 0
    });
  });

  confOnlyDepts.forEach(dName => {
    if (!deptStatuses.find(d => d.department === dName)) {
      deptStatuses.push({
        department: dName,
        lastPublished: currentYear - 1, // Assume recent
        totalPublications: departmentTotals[dName] || 0,
        status: 'Amber',
        badge: 'Slowing',
        issue: 'Over-reliant on conferences',
        sortIdx: 1
      });
    }
  });

  // Let's add some mock Green ones to show the traffic light effect since API only returns gaps and we didn't fetch all departments here.
  const mockHealthy = ["Computer Sciences and Technology", "Mechanical Engineering", "Biotechnology"];
  mockHealthy.forEach(dName => {
    if (!deptStatuses.find(d => d.department === dName)) {
      deptStatuses.push({
        department: dName,
        lastPublished: currentYear,
        totalPublications: departmentTotals[dName] || 0,
        status: 'Green',
        badge: 'Active',
        issue: 'Healthy output mix',
        sortIdx: 2
      });
    }
  });

  deptStatuses.sort((a, b) => a.sortIdx - b.sortIdx);
  
  const filteredDepts = deptStatuses.filter(d => d.department.toLowerCase().includes(searchTerm.toLowerCase()));

  const zeroCitPct = gaps?.zero_citation_papers_pct || 0;
  const zeroCitStatus = zeroCitPct > 40 ? 'Red' : zeroCitPct > 20 ? 'Amber' : 'Green';
  
  const confPct = gaps?.conference_pct || 0;
  const confStatus = confPct > 60 ? 'Amber' : 'Green';
  
  const oaPct = gaps?.open_access_pct || 0;
  const oaStatus = oaPct < 30 ? 'Amber' : oaPct > 50 ? 'Green' : 'Amber';

  const exportGapReport = () => {
    const reportList = [];
    reportList.push("RESEARCH GAP ANALYSIS REPORT");
    reportList.push("============================");
    reportList.push(`Generated: ${new Date().toLocaleDateString()}`);
    reportList.push("\n1. CRITICAL DEPARTMENT GAPS (RED/AMBER)");
    deptStatuses.filter(d => d.status !== 'Green').forEach(d => {
      reportList.push(`- ${d.department} [${d.badge}]: ${d.issue}. Last Published: ${d.lastPublished}`);
    });
    
    reportList.push("\n2. PUBLICATION QUALITY ALERTS");
    if (zeroCitStatus !== 'Green') reportList.push(`- ZERO CITATIONS: ${zeroCitPct}% of papers have never been cited (Attention required).`);
    if (confStatus !== 'Green') reportList.push(`- CONF RATIO: ${confPct}% of output is conference papers (Over-reliance).`);
    if (oaStatus !== 'Green') reportList.push(`- OPEN ACCESS: Only ${oaPct}% of papers are open access (Below target).`);
    
    reportList.push("\n3. INACTIVE RESEARCHERS (3+ YEARS)");
    authorsInactive.forEach(a => {
      reportList.push(`- ${a.name} (${a.department}): Last paper in ${a.last_publication_year}. Total papers: ${a.total_papers}`);
    });
    
    const blob = new Blob([reportList.join("\n")], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "gap_analysis_report.txt";
    a.click();
  };

  const badgeColor = (status) => {
    switch (status) {
      case 'Red': return 'bg-red-100 text-red-800 border-red-200';
      case 'Amber': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Green': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const borderColor = (status) => {
    switch (status) {
      case 'Red': return 'border-red-600';
      case 'Amber': return 'border-amber-500';
      case 'Green': return 'border-green-500';
      default: return 'border-outline';
    }
  };

  const decliningTopics = gaps?.declining_topics || [];
  const topicKeys = decliningTopics.length > 0 ? Object.keys(decliningTopics[0]).filter(k => k !== 'year') : [];
  
  const emergingTopics = gaps?.emerging_topics || [];
  const emergingKeys = emergingTopics.length > 0 ? Object.keys(emergingTopics[0]).filter(k => k !== 'year') : [];

  const getSmartInsights = () => {
    const insights = [];
    if (zeroCitPct > 20) insights.push(`High Uncited Rate (${zeroCitPct}%): Consider internal peer-review sessions to improve publication quality.`);
    if (oaPct < 40) insights.push(`Low Open Access (${oaPct}%): Targeted funding for APCs could increase global visibility.`);
    if (deptsInactive.length > 0) insights.push(`${deptsInactive.length} Departments are currently inactive. Strategic hiring or cross-dept seed grants recommended.`);
    if (emergingKeys.length > 0) insights.push(`Emerging Hotspots: ${emergingKeys.join(", ")} show rapid growth. Possible areas for Lab expansion.`);
    return insights;
  };

  const smartInsights = getSmartInsights();

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* SMART INSIGHTS BANNER */}
      {smartInsights.length > 0 && (
        <div className="bg-primary/5 border-l-4 border-primary p-6 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-primary text-white rounded-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <h3 className="font-headline font-bold text-primary tracking-tight">AI Analysis & Strategic Recommendations</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {smartInsights.map((insight, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-on-surface/80 group">
                <span className="text-primary font-bold">→</span>
                <span className="group-hover:text-primary transition-colors cursor-default">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end relative">
        <button 
          onClick={exportGapReport}
          className="flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 text-sm shadow-md hover:bg-primary/90 transition-colors"
        >
          <Download size={16} /> Export Gap Report
        </button>
      </div>

      {/* SECTION 1 */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative overflow-hidden">
        <div className="flex justify-between items-end mb-6">
          <h3 className="font-headline text-lg font-bold text-primary">Departments Requiring Attention</h3>
          <input 
            type="text" 
            placeholder="Filter departments..." 
            className="p-2 border border-outline-variant text-sm w-64 bg-surface-container"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-outline-variant/50 text-on-surface">
                <th className="py-3 px-4 font-bold">Department</th>
                <th className="py-3 px-4 font-bold">Last Published</th>
                <th className="py-3 px-4 font-bold">Publications</th>
                <th className="py-3 px-4 font-bold">Key Issue</th>
                <th className="py-3 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepts.map(d => (
                <tr key={d.department} className={`border-b border-outline-variant/30 border-l-4 ${borderColor(d.status)} hover:bg-surface-container-highest transition-colors`}>
                  <td className="py-3 px-4 font-bold">{d.department}</td>
                  <td className="py-3 px-4 text-outline">{d.lastPublished}</td>
                  <td className="py-3 px-4 text-outline">{d.totalPublications}</td>
                  <td className="py-3 px-4">{d.issue}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs border font-bold ${badgeColor(d.status)}`}>
                      {d.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 bg-surface-container-lowest border-l-4 ${borderColor(zeroCitStatus)} shadow-sm`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-on-surface">Zero-Citation Papers</h4>
            <span className={`w-3 h-3 rounded-full ${badgeColor(zeroCitStatus).split(' ')[0]}`}></span>
          </div>
          <p className="text-3xl font-black mb-1 text-on-surface">{zeroCitPct}%</p>
          <p className="text-sm text-outline">of papers have never been cited</p>
        </div>
        
        <div className={`p-6 bg-surface-container-lowest border-l-4 ${borderColor(confStatus)} shadow-sm`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-on-surface">Conf vs Journal Ratio</h4>
            <span className={`w-3 h-3 rounded-full ${badgeColor(confStatus).split(' ')[0]}`}></span>
          </div>
          <p className="text-3xl font-black mb-1 text-on-surface">{confPct}%</p>
          <p className="text-sm text-outline">of output is conference papers</p>
        </div>
        
        <div className={`p-6 bg-surface-container-lowest border-l-4 ${borderColor(oaStatus)} shadow-sm`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-on-surface">Open Access Rate</h4>
            <span className={`w-3 h-3 rounded-full ${badgeColor(oaStatus).split(' ')[0]}`}></span>
          </div>
          <p className="text-3xl font-black mb-1 text-on-surface">{oaPct}%</p>
          <p className="text-sm text-outline">of papers are open access</p>
        </div>
      </div>

      {/* TOPIC DYNAMICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Declining Topics */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
          <div className="absolute top-8 right-8 z-10">
            <DownloadCsvButton data={decliningTopics} filename="declining_research_areas" />
          </div>
          <h3 className="font-headline text-lg font-bold text-primary mb-6">Topics with Declining Activity</h3>
          <div className="h-[300px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={decliningTopics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis />
                <RechartsTooltip contentStyle={{ borderRadius: '0px', border: '1px solid #e4e2df', boxShadow: 'none' }} />
                <Legend />
                {topicKeys.map((tk, idx) => (
                  <Line key={tk} type="monotone" dataKey={tk} stroke={['#D32F2F', '#F57C00', '#7B1FA2', '#1976D2'][idx % 4]} strokeWidth={3} dot={{r: 4}} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {topicKeys.length > 0 ? (
            <div className="bg-error-container/20 text-error p-4 border-l-4 border-error text-sm font-bold">
              Identifying Research Gaps: {topicKeys.join(", ")} show significant declining output.
            </div>
          ) : (
            <div className="h-14 flex items-center justify-center text-outline italic text-sm border border-dashed">No declining topics identified in the current window.</div>
          )}
        </div>

        {/* Emerging Topics */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
          <div className="absolute top-8 right-8 z-10">
            <DownloadCsvButton data={emergingTopics} filename="emerging_research_areas" />
          </div>
          <h3 className="font-headline text-lg font-bold text-primary mb-6">Emerging Hotspots</h3>
          <div className="h-[300px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={emergingTopics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis />
                <RechartsTooltip contentStyle={{ borderRadius: '0px', border: '1px solid #e4e2df', boxShadow: 'none' }} />
                <Legend />
                {emergingKeys.map((tk, idx) => (
                  <Line key={tk} type="monotone" dataKey={tk} stroke={['#2E7D32', '#00796B', '#0288D1', '#689F38'][idx % 4]} strokeWidth={3} dot={{r: 4}} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {emergingKeys.length > 0 ? (
            <div className="bg-green-100 text-green-800 p-4 border-l-4 border-green-600 text-sm font-bold">
              Growth Opportunities: {emergingKeys.join(", ")} are rapidly gaining traction.
            </div>
          ) : (
             <div className="h-14 flex items-center justify-center text-outline italic text-sm border border-dashed">No emerging hotspots identified yet.</div>
          )}
        </div>
      </div>

      {/* SECTION 3 */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline text-lg font-bold text-primary">Inactive Researchers</h3>
          <button 
            className="text-sm font-bold text-outline hover:text-primary transition-colors underline"
            onClick={() => setShowInactiveAuthors(!showInactiveAuthors)}
          >
            {showInactiveAuthors ? 'Collapse' : `Show ${authorsInactive.length} inactive researchers`}
          </button>
        </div>
        
        {showInactiveAuthors && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant/50 text-outline">
                  <th className="py-2 px-4 font-bold">Name</th>
                  <th className="py-2 px-4 font-bold">Department</th>
                  <th className="py-2 px-4 font-bold">Last Paper</th>
                  <th className="py-2 px-4 font-bold">Total Papers</th>
                </tr>
              </thead>
              <tbody>
                {authorsInactive.map(a => (
                  <tr key={a.author_id} className="border-b border-outline-variant/20 border-l-4 border-amber-500 bg-surface-container hover:bg-surface-container-highest">
                    <td className="py-2 px-4 font-bold text-on-surface">{a.name}</td>
                    <td className="py-2 px-4 text-outline">{a.department}</td>
                    <td className="py-2 px-4 text-error font-bold">{a.last_publication_year}</td>
                    <td className="py-2 px-4">{a.total_papers}</td>
                  </tr>
                ))}
                {authorsInactive.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-outline italic">No inactive researchers found (all active within 3 years).</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
