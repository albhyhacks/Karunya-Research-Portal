import React, { useState, useMemo, useEffect } from "react";
import { useFetch } from "../../hooks/useFetch";
import { analyticsApi } from "../../api/analytics";
import { DownloadCsvButton } from "./DownloadCsvButton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, ReferenceArea 
} from "recharts";

const colors = ["#6B0F1A", "#0F6B5A", "#C9922A", "#0F2557", "#5A0F6B"];

const DEMO_RESEARCHER_SERIES = [
  {
    id: "demo-1",
    name: "Dr. John Mathew",
    department: "AI & Data Science",
    field: "AI & Data Science",
    yearly: [
      { year: 2021, papers: 4, cumulative_papers: 4, h_index: 12 },
      { year: 2022, papers: 5, cumulative_papers: 9, h_index: 13 },
      { year: 2023, papers: 7, cumulative_papers: 16, h_index: 14 },
      { year: 2024, papers: 9, cumulative_papers: 25, h_index: 15 },
    ],
  },
  {
    id: "demo-2",
    name: "Dr. Anjali Nair",
    department: "Cybersecurity",
    field: "Cybersecurity",
    yearly: [
      { year: 2021, papers: 3, cumulative_papers: 3, h_index: 9 },
      { year: 2022, papers: 4, cumulative_papers: 7, h_index: 10 },
      { year: 2023, papers: 6, cumulative_papers: 13, h_index: 11 },
      { year: 2024, papers: 7, cumulative_papers: 20, h_index: 12 },
    ],
  },
  {
    id: "demo-3",
    name: "Dr. Rahul Kumar",
    department: "Cloud Computing",
    field: "Cloud Computing",
    yearly: [
      { year: 2021, papers: 2, cumulative_papers: 2, h_index: 8 },
      { year: 2022, papers: 4, cumulative_papers: 6, h_index: 9 },
      { year: 2023, papers: 5, cumulative_papers: 11, h_index: 10 },
      { year: 2024, papers: 7, cumulative_papers: 18, h_index: 11 },
    ],
  },
  {
    id: "demo-4",
    name: "Dr. Sneha Joseph",
    department: "Bioinformatics",
    field: "Bioinformatics",
    yearly: [
      { year: 2021, papers: 2, cumulative_papers: 2, h_index: 7 },
      { year: 2022, papers: 3, cumulative_papers: 5, h_index: 8 },
      { year: 2023, papers: 4, cumulative_papers: 9, h_index: 9 },
      { year: 2024, papers: 6, cumulative_papers: 15, h_index: 10 },
    ],
  },
  {
    id: "demo-5",
    name: "Dr. Arjun Menon",
    department: "Robotics",
    field: "Robotics",
    yearly: [
      { year: 2021, papers: 1, cumulative_papers: 1, h_index: 6 },
      { year: 2022, papers: 3, cumulative_papers: 4, h_index: 7 },
      { year: 2023, papers: 3, cumulative_papers: 7, h_index: 8 },
      { year: 2024, papers: 5, cumulative_papers: 12, h_index: 9 },
    ],
  },
];

const getCumulativePublications = (yearly = []) => {
  const last = yearly[yearly.length - 1] || {};
  return last.cumulative_papers ?? last.cumulative_publications ?? last.total_publications ?? 0;
};

const getYearPublications = (stat = {}) => {
  return stat.papers ?? stat.publications ?? stat.year_publications ?? 0;
};

export const ResearcherGrowthTab = () => {
  const { data: growthData, loading } = useFetch(analyticsApi.getResearcherGrowth);
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  
  const authors = growthData?.authors || [];
  const effectiveAuthors = useMemo(() => {
    const source = authors.length > 0 ? authors : DEMO_RESEARCHER_SERIES;

    return source.map((a, index) => {
      const fallbackPublications = typeof a.publications === "number" ? a.publications : 0;
      const yearlySource = Array.isArray(a.yearly) ? a.yearly : [];

      const normalizedYearly = yearlySource.length
        ? yearlySource.map((st, idx) => {
            const publications = getYearPublications(st);
            const previous = yearlySource.slice(0, idx).reduce((sum, prev) => sum + getYearPublications(prev), 0);
            const cumulative = st?.cumulative_papers ?? st?.cumulative_publications ?? (previous + publications);
            return {
              ...st,
              year: st?.year ?? new Date().getFullYear(),
              papers: publications,
              cumulative_papers: cumulative,
            };
          })
        : [{
            year: new Date().getFullYear(),
            papers: fallbackPublications,
            cumulative_papers: fallbackPublications,
            h_index: a?.h_index || 0,
          }];

      return {
        ...a,
        id: a?.id || `demo-normalized-${index + 1}`,
        name: a?.name || `Researcher ${index + 1}`,
        department: a?.department || a?.field || "Research",
        yearly: normalizedYearly,
      };
    });
  }, [authors]);

  // Initialize selected authors when data loads
  useEffect(() => {
    if (effectiveAuthors.length > 0 && selectedAuthors.length === 0) {
      // Find top 3 by total publications
      const sorted = [...effectiveAuthors].sort((a, b) => {
        return getCumulativePublications(b.yearly) - getCumulativePublications(a.yearly);
      });
      setSelectedAuthors(sorted.slice(0, 3).map(a => a.id));
    }
  }, [effectiveAuthors, selectedAuthors.length]);

  const departments = ["All", ...new Set(effectiveAuthors.map(a => a.department || a.field).filter(Boolean))];

  const filteredAuthors = selectedDept === "All" 
    ? effectiveAuthors 
    : effectiveAuthors.filter(a => (a.department || a.field) === selectedDept);

  const toggleAuthor = (id) => {
    if (selectedAuthors.includes(id)) {
      setSelectedAuthors(selectedAuthors.filter(a => a !== id));
    } else {
      if (selectedAuthors.length < 5) {
        setSelectedAuthors([...selectedAuthors, id]);
      }
    }
  };

  const selectedAuthorData = effectiveAuthors.filter(a => selectedAuthors.includes(a.id));

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
          row[`${a.name}_publications`] = stat.cumulative_papers ?? stat.cumulative_publications ?? 0;
          row[`${a.name}_yearly_publications`] = getYearPublications(stat);
        } else {
          // Carry forward
          const prev = a.yearly.filter(s => s.year < y).pop();
          row[`${a.name}_publications`] = prev ? (prev.cumulative_papers ?? prev.cumulative_publications ?? 0) : 0;
          row[`${a.name}_yearly_publications`] = 0;
        }
      });
      years.push(row);
    }
    return years;
  }, [selectedAuthorData]);

  const risingResearchersByPublications = useMemo(() => {
    const allYears = effectiveAuthors
      .flatMap((a) => (Array.isArray(a.yearly) ? a.yearly.map((y) => y?.year).filter(Boolean) : []));

    const currentYear = allYears.length ? Math.max(...allYears) : new Date().getFullYear();
    const prevYear = currentYear - 1;

    const ranked = effectiveAuthors.map((a) => {
      const current = getYearPublications((a.yearly || []).find((y) => y.year === currentYear));
      const previous = getYearPublications((a.yearly || []).find((y) => y.year === prevYear));
      const growth = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

      return {
        id: a.id,
        name: a.name,
        department: a.department || a.field || "Researcher",
        current,
        previous,
        growth,
      };
    });

    return {
      currentYear,
      prevYear,
      rows: ranked.sort((a, b) => b.growth - a.growth).slice(0, 5),
    };
  }, [effectiveAuthors]);

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
                <YAxis yAxisId="left" orientation="left" tick={{fontSize: 12}} label={{ value: 'Cumulative Publications', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} label={{ value: 'Year Publications', angle: 90, position: 'insideRight', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '0px', border: '1px solid #e4e2df', boxShadow: 'none' }}
                  formatter={(value, name) => {
                    const cleanName = name.replace(/_(publications|yearly_publications)$/, '');
                    const type = name.includes('yearly_publications') ? 'Year Publications' : 'Cumulative Publications';
                    return [value, `${cleanName} - ${type}`];
                  }}
                />
                <Legend />
                {selectedAuthorData.map((a, i) => (
                  <React.Fragment key={a.id}>
                    <Line yAxisId="left" type="monotone" dataKey={`${a.name}_publications`} stroke={colors[i]} strokeWidth={3} dot={{r: 4}} />
                    <Line yAxisId="right" type="monotone" dataKey={`${a.name}_yearly_publications`} stroke={colors[i]} strokeWidth={2} strokeDasharray="5 5" dot={false} />
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
                <th className="py-3 px-4 font-bold">Year Publications</th>
                <th className="py-3 px-4 font-bold">h-index</th>
                <th className="py-3 px-4 font-bold">First Pub Year</th>
                <th className="py-3 px-4 font-bold">Most Productive Year</th>
              </tr>
            </thead>
            <tbody>
              {selectedAuthorData.map(a => {
                const totalPapers = getCumulativePublications(a.yearly);
                const latestYear = a.yearly[a.yearly.length - 1] || {};
                const yearPublications = getYearPublications(latestYear);
                const firstYear = a.yearly[0]?.year || '-';
                
                let maxP = 0;
                let maxPy = '-';
                a.yearly.forEach(y => {
                  const publications = getYearPublications(y);
                  if (publications > maxP) {
                    maxP = publications;
                    maxPy = y.year;
                  }
                });

                return (
                  <tr key={a.id} className="border-b border-outline-variant/30 hover:bg-surface-container-highest transition-colors">
                    <td className="py-3 px-4 font-bold text-primary">{a.name}</td>
                    <td className="py-3 px-4 text-outline">{a.department || a.field}</td>
                    <td className="py-3 px-4 font-black">{totalPapers}</td>
                    <td className="py-3 px-4">{yearPublications}</td>
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
        
        {/* Rising Researchers */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10">
          <h3 className="font-headline text-lg font-bold text-primary mb-6">
            Rising Researchers - {risingResearchersByPublications.currentYear} vs {risingResearchersByPublications.prevYear}
          </h3>
          <div className="space-y-4">
            {risingResearchersByPublications.rows.map((a, i) => (
              <div
                key={a.id || a.name}
                className="flex items-center gap-4 p-4 border bg-surface-container border-outline/10"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{a.name}</p>
                  <p className="text-xs text-outline truncate">{a.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-outline tabular-nums">{a.previous} {"->"} {a.current} publications</p>
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
             {effectiveAuthors.slice(0, 10).map(a => {
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
                       const publications = getYearPublications(stat);
                       
                       // Opacity based on yearly publications relative to each author's max
                       const maxPublications = Math.max(...a.yearly.map(y => getYearPublications(y))) || 1;
                       const opacity = Math.min(0.1 + (publications / maxPublications), 1);
                       
                       return (
                         <div 
                           key={i} 
                           className="flex-1 relative border-r border-outline-variant/10 hover:bg-secondary transition-colors"
                           style={{ backgroundColor: publications > 0 ? `rgba(107, 15, 26, ${opacity})` : 'transparent' }}
                           title={`${yr}: ${publications} publications`}
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
