import React, { useState, useMemo, useEffect } from "react";
import { useFetch } from "../../hooks/useFetch";
import { analyticsApi } from "../../api/analytics";
import { DownloadCsvButton } from "./DownloadCsvButton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, ReferenceArea 
} from "recharts";

const colors = ["#6B0F1A", "#0F6B5A", "#C9922A", "#0F2557", "#5A0F6B"];

export const ResearcherGrowthTab = () => {
  const { data: growthData, loading } = useFetch(analyticsApi.getResearcherGrowth);
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  
  const authors = growthData?.authors || [];

  // Initialize selected authors when data loads
  useEffect(() => {
    if (authors.length > 0 && selectedAuthors.length === 0) {
      // Find top 3 by total citations
      const sorted = [...authors].sort((a, b) => {
        const lastA = a.yearly[a.yearly.length - 1];
        const lastB = b.yearly[b.yearly.length - 1];
        return (lastB?.cumulative_citations || 0) - (lastA?.cumulative_citations || 0);
      });
      setSelectedAuthors(sorted.slice(0, 3).map(a => a.id));
    }
  }, [authors, selectedAuthors.length]);

  const departments = ["All", ...new Set(authors.map(a => a.department).filter(Boolean))];

  const filteredAuthors = selectedDept === "All" 
    ? authors 
    : authors.filter(a => a.department === selectedDept);

  const toggleAuthor = (id) => {
    if (selectedAuthors.includes(id)) {
      setSelectedAuthors(selectedAuthors.filter(a => a !== id));
    } else {
      if (selectedAuthors.length < 5) {
        setSelectedAuthors([...selectedAuthors, id]);
      }
    }
  };

  const selectedAuthorData = authors.filter(a => selectedAuthors.includes(a.id));

  // Build unified timeline data for the Multi-line chart
  const timelineData = useMemo(() => {
    const minYear = Math.min(...selectedAuthorData.map(a => a.yearly[0]?.year || Infinity));
    const maxYear = Math.max(...selectedAuthorData.map(a => a.yearly[a.yearly.length -1]?.year || -Infinity));
    
    if (minYear === Infinity) return [];
    
    const years = [];
    for (let y = minYear; y <= maxYear; y++) {
      let row = { year: y };
      selectedAuthorData.forEach(a => {
        const stat = a.yearly.find(s => s.year === y);
        if (stat) {
          row[`${a.name}_papers`] = stat.cumulative_papers;
          row[`${a.name}_citations`] = stat.cumulative_citations;
          row[`${a.name}_current`] = stat.papers;
        } else {
          // Carry forward
          const prev = a.yearly.filter(s => s.year < y).pop();
          row[`${a.name}_papers`] = prev ? prev.cumulative_papers : 0;
          row[`${a.name}_citations`] = prev ? prev.cumulative_citations : 0;
          row[`${a.name}_current`] = 0;
        }
      });
      years.push(row);
    }
    return years;
  }, [selectedAuthorData]);

  // Fastest growing researchers
  const fastestGrowing = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    
    return authors.map(a => {
      const cy = a.yearly.find(y => y.year === currentYear)?.citations || 0;
      const py = a.yearly.find(y => y.year === prevYear)?.citations || 0;
      const growth = py === 0 ? (cy > 0 ? 100 : 0) : ((cy - py) / py) * 100;
      return { ...a, cy, py, growth };
    }).sort((a, b) => b.growth - a.growth).slice(0, 5);
  }, [authors]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-[500px] bg-surface-container-lowest border border-outline-variant/10"></div>
        <div className="h-[300px] bg-surface-container-lowest border border-outline-variant/10"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SECTION 1 */}
      <div className="bg-surface-container-lowest border border-outline-variant/10">
        <div className="p-8 border-b border-outline-variant/20 flex flex-col md:flex-row gap-6 relative">
          <div className="absolute top-8 right-8 z-10">
            <DownloadCsvButton data={timelineData} filename="researcher_growth_timeline" />
          </div>
          <div className="w-full md:w-1/3 space-y-4">
            <h3 className="font-headline text-lg font-bold text-primary">Individual Researcher Trajectory</h3>
            <p className="text-sm text-outline">Select up to 5 researchers to compare their cumulative growth.</p>
            
            <select 
              className="w-full p-2 bg-surface-container text-on-surface border border-outline-variant text-sm font-bold"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            
            <div className="max-h-64 overflow-y-auto border border-outline-variant/30 mt-2 bg-white">
              {filteredAuthors.map(a => (
                <div 
                  key={a.id} 
                  className={`p-2 text-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-highest transition-colors ${selectedAuthors.includes(a.id) ? 'bg-primary-fixed/50 border-l-4 border-primary' : ''}`}
                  onClick={() => toggleAuthor(a.id)}
                >
                  <div>
                    <p className="font-bold text-on-surface">{a.name}</p>
                    <p className="text-xs text-outline">{a.department?.slice(0,25)}...</p>
                  </div>
                  {selectedAuthors.includes(a.id) && (
                    <span className="text-primary font-bold">✓</span>
                  )}
                </div>
              ))}
            </div>
            {selectedAuthors.length >= 5 && <p className="text-xs text-error font-bold">Maximum 5 researchers selected.</p>}
          </div>
          
          <div className="w-full md:w-2/3 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{fontSize: 12}} />
                <YAxis yAxisId="left" orientation="left" tick={{fontSize: 12}} label={{ value: 'Cum. Papers', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} label={{ value: 'Cum. Citations', angle: 90, position: 'insideRight', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '0px', border: '1px solid #e4e2df', boxShadow: 'none' }}
                  formatter={(value, name) => {
                    const cleanName = name.replace(/_(papers|citations|current)$/, '');
                    const type = name.includes('citations') ? 'Citations' : name.includes('current') ? 'Papers (Year)' : 'Total Papers';
                    return [value, `${cleanName} - ${type}`];
                  }}
                />
                <Legend />
                {selectedAuthorData.map((a, i) => (
                  <React.Fragment key={a.id}>
                    <Line yAxisId="left" type="monotone" dataKey={`${a.name}_papers`} stroke={colors[i]} strokeWidth={3} dot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey={`${a.name}_citations`} stroke={colors[i]} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </React.Fragment>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 bg-surface-container overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-outline-variant/50 text-on-surface">
                <th className="py-3 px-4 font-bold">Name</th>
                <th className="py-3 px-4 font-bold">Department</th>
                <th className="py-3 px-4 font-bold">Total Papers</th>
                <th className="py-3 px-4 font-bold">Total Citations</th>
                <th className="py-3 px-4 font-bold">h-index</th>
                <th className="py-3 px-4 font-bold">First Pub Year</th>
                <th className="py-3 px-4 font-bold">Most Productive Year</th>
              </tr>
            </thead>
            <tbody>
              {selectedAuthorData.map(a => {
                const totalPapers = a.yearly[a.yearly.length-1]?.cumulative_papers || 0;
                const totalCits = a.yearly[a.yearly.length-1]?.cumulative_citations || 0;
                const firstYear = a.yearly[0]?.year || '-';
                
                let maxP = 0;
                let maxPy = '-';
                a.yearly.forEach(y => { if(y.papers > maxP) { maxP = y.papers; maxPy = y.year; } });

                return (
                  <tr key={a.id} className="border-b border-outline-variant/30 hover:bg-surface-container-highest transition-colors">
                    <td className="py-3 px-4 font-bold text-primary">{a.name}</td>
                    <td className="py-3 px-4 text-outline">{a.department}</td>
                    <td className="py-3 px-4 font-black">{totalPapers}</td>
                    <td className="py-3 px-4">{totalCits}</td>
                    <td className="py-3 px-4 font-bold">{a.yearly[0]?.h_index || 0}</td>
                    <td className="py-3 px-4 text-outline">{firstYear}</td>
                    <td className="py-3 px-4">{maxPy} ({maxP} papers)</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2 & 3 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Fastest Growing */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10">
          <h3 className="font-headline text-lg font-bold text-primary mb-6">Rising Researchers — 2024 vs 2023</h3>
          <div className="space-y-4">
            {fastestGrowing.map((a, i) => (
              <div key={a.id} className="flex items-center gap-4 p-4 border bg-surface-container border-outline/10">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{a.name}</p>
                  <p className="text-xs text-outline truncate">{a.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-outline">{a.py} → {a.cy} cits</p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 font-bold text-[10px] mt-1">
                    +{Math.round(a.growth)}% Growth
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 overflow-x-auto relative">
          <h3 className="font-headline text-lg font-bold text-primary mb-6">Researcher Milestone Timeline</h3>
          <div className="space-y-6 min-w-[500px]">
             {/* Using a simplified timeline component with color scales */}
             {authors.slice(0, 10).map(a => {
               const minYear = a.yearly[0]?.year;
               const maxYear = new Date().getFullYear();
               if (!minYear) return null;
               
               const spanYears = maxYear - minYear + 1;
               
               return (
                 <div key={a.id} className="relative">
                   <p className="text-xs font-bold text-on-surface mb-1">{a.name} <span className="text-outline font-normal">({minYear}-{maxYear})</span></p>
                   <div className="flex h-6 w-full border border-outline-variant/30 bg-surface-container group">
                     {Array.from({length: spanYears}).map((_, i) => {
                       const yr = minYear + i;
                       const stat = a.yearly.find(y => y.year === yr);
                       const cits = stat?.citations || 0;
                       
                       // Opacity based on citations relative to their own max
                       const maxCits = Math.max(...a.yearly.map(y => y.citations)) || 1;
                       const opacity = Math.min(0.1 + (cits / maxCits), 1);
                       
                       return (
                         <div 
                           key={i} 
                           className="flex-1 relative border-r border-outline-variant/10 hover:bg-secondary transition-colors"
                           style={{ backgroundColor: cits > 0 ? `rgba(107, 15, 26, ${opacity})` : 'transparent' }}
                           title={`${yr}: ${stat?.papers || 0} papers, ${cits} citations`}
                         ></div>
                       );
                     })}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};
