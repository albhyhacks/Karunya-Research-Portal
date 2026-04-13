import React, { useMemo } from "react";
import { useFetch } from "../../hooks/useFetch";
import { analyticsApi } from "../../api/analytics";
import { DownloadCsvButton } from "./DownloadCsvButton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

export const CollaborationTab = () => {
  const { data: collabData, loading } = useFetch(analyticsApi.getCollaboration);

  const internal = collabData?.internal || [];
  const international = collabData?.international || [];
  const topPairs = collabData?.top_collaborating_pairs || [];
  const trendData = collabData?.trend || [];

  const topSynergies = useMemo(() => {
    return [...internal].sort((a,b) => b.shared_papers - a.shared_papers).slice(0, 5);
  }, [internal]);

  if (loading) {
    return <div className="h-[400px] bg-surface-container-lowest animate-pulse"></div>;
  }

  // Heatmap prep
  const departments = Array.from(new Set([
    ...internal.map(i => i.dept_a), 
    ...internal.map(i => i.dept_b)
  ])).sort();

  const matrix = {};
  let maxShared = 0;
  internal.forEach(edge => {
    if (!matrix[edge.dept_a]) matrix[edge.dept_a] = {};
    if (!matrix[edge.dept_b]) matrix[edge.dept_b] = {};
    matrix[edge.dept_a][edge.dept_b] = edge.shared_papers;
    matrix[edge.dept_b][edge.dept_a] = edge.shared_papers; // Bidirectional
    if (edge.shared_papers > maxShared) maxShared = edge.shared_papers;
  });

  const getHeatmapColor = (val) => {
    if (!val) return 'transparent'; // No papers
    const ratio = Math.max(0.1, val / maxShared);
    return `rgba(107, 15, 26, ${ratio})`; // Maroon base
  };

  const currentYearData = trendData.length > 0 ? trendData[trendData.length - 1] : { year: new Date().getFullYear(), International: 0, Total: 1 };
  const intlRate = currentYearData.Total > 0 ? Math.round((currentYearData.International / currentYearData.Total) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* SECTION 1: HEATMAP */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
        <div className="absolute top-8 right-8 z-10 flex gap-2">
          <DownloadCsvButton data={internal} filename="interdepartmental_collab" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-headline text-lg font-bold text-primary">Interdepartmental Collaboration Network</h3>
            <p className="text-sm text-outline">Strengthen cross-functional research through shared publication data.</p>
          </div>
          {topSynergies.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="font-bold text-on-surface/60 mr-2 self-center">TOP SYNERGIES:</span>
              {topSynergies.map((s, idx) => (
                <div key={idx} className="px-2 py-1 bg-primary text-white font-bold rounded-sm shadow-sm">
                  {s.dept_a.split(' ')[0]} + {s.dept_b.split(' ')[0]} ({s.shared_papers})
                </div>
              ))}
            </div>
          )}
        </div>
        
        {departments.length > 0 ? (
          <div className="overflow-x-auto overflow-y-hidden pb-4">
            <div className="min-w-fit pr-4">
              <table className="border-collapse text-[10px] md:text-xs text-center border border-outline-variant w-full">
                <thead>
                  <tr>
                    <th className="p-3 border border-outline-variant bg-surface-container text-right font-headline font-bold text-primary min-w-[150px]">Departments</th>
                    {departments.map((d, i) => (
                      <th key={d} className="p-3 border border-outline-variant bg-surface-container min-w-[70px] whitespace-nowrap" title={d}>
                        {d.length > 12 ? d.substring(0, 10) + '...' : d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {departments.map(rowDept => (
                    <tr key={rowDept} className="group">
                      <th className="p-3 border border-outline-variant bg-surface-container text-right whitespace-nowrap font-bold text-on-surface group-hover:bg-primary/5 transition-colors">{rowDept}</th>
                      {departments.map(colDept => {
                        if (rowDept === colDept) {
                          return <td key={colDept} className="p-3 border border-outline-variant bg-surface-container-highest/20 w-16"></td>;
                        }
                        const val = matrix[rowDept]?.[colDept] || 0;
                        return (
                          <td 
                            key={colDept} 
                            className="p-3 border border-outline-variant w-16 font-bold group/cell relative hover:ring-2 hover:ring-primary z-10 transition-all cursor-crosshair"
                            style={{ backgroundColor: getHeatmapColor(val), color: val > (maxShared/2) ? 'white' : 'black' }}
                          >
                            {val > 0 ? val : ''}
                            {val > 0 && (
                              <div className="absolute invisible group-cell/cell-hover:visible bg-surface-container-lowest text-on-surface p-3 border-l-4 border-primary shadow-xl bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] text-xs w-max pointer-events-none">
                                <p className="font-headline font-bold text-primary mb-1 underline">Collaboration Data</p>
                                <p className="font-bold">{rowDept}</p>
                                <p className="font-bold mb-1">{colDept}</p>
                                <p className="text-lg font-black">{val} Co-authored Papers</p>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-sm">
             <svg className="w-12 h-12 text-outline-variant mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 12l.01 0" /></svg>
             <p className="text-outline italic">Analyzing cross-departmental links... Not enough data yet.</p>
          </div>
        )}
      </div>

      {/* SECTION 2: BAR CHARTS AND LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: International Collaborations */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative flex flex-col h-full">
          <div className="absolute top-8 right-8 z-10">
            <DownloadCsvButton data={international} filename="international_collaborations" />
          </div>
          <h3 className="font-headline text-lg font-bold text-primary mb-6">International Collaborations</h3>
          <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {international.length > 0 ? international.map((c, i) => {
              const maxPapers = Math.max(...international.map(x => x.papers)) || 1;
              const pct = (c.papers / maxPapers) * 100;
              return (
                <div key={c.country} className="flex items-center gap-4 text-sm group">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-outline border group-hover:bg-primary group-hover:text-white transition-colors duration-300">#{i+1}</div>
                  <div className="w-32 truncate font-bold text-on-surface" title={c.country}>
                    🌐 {c.country}
                  </div>
                  <div className="w-12 text-right font-black text-primary">{c.papers}</div>
                  <div className="flex-1 h-2.5 bg-surface-container rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-primary group-hover:bg-secondary transition-all duration-500 ease-out" style={{ width: pct + '%' }}></div>
                  </div>
                </div>
              );
            }) : (
               <div className="h-full flex items-center justify-center text-outline italic">Scanning country metadata in papers...</div>
            )}
          </div>
        </div>

        {/* Right: Top Pairs */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative flex flex-col h-full">
          <div className="absolute top-8 right-8 z-10">
            <DownloadCsvButton data={topPairs} filename="top_collaborating_pairs" />
          </div>
          <h3 className="font-headline text-lg font-bold text-primary mb-6">Top Co-Authorship Pairs</h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {topPairs.length > 0 ? topPairs.map((p, i) => (
              <a 
                href={`/papers?author_ids=${p.author_a_id},${p.author_b_id}`}
                key={i} 
                className="block p-4 border border-outline-variant/30 hover:border-primary hover:bg-surface-container-highest transition-all transform hover:-translate-y-1 bg-white shadow-sm hover:shadow-md group"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary group-hover:text-secondary transition-colors underline decoration-dotted">{p.author_a}</span>
                    <span className="text-outline text-xs">&</span>
                    <span className="font-bold text-primary group-hover:text-secondary transition-colors underline decoration-dotted">{p.author_b}</span>
                  </div>
                  <div className="font-black text-xl text-primary">{p.papers} <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Papers</span></div>
                </div>
                <div className="text-[11px] text-outline font-bold flex gap-2 items-center">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
                   {p.department_a === p.department_b ? p.department_a : `${p.department_a} + ${p.department_b}`}
                </div>
              </a>
            )) : (
               <div className="h-full flex items-center justify-center text-outline italic">Calculating authorship connections...</div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: LINE TREND */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
        <div className="absolute top-8 right-8 z-10">
          <DownloadCsvButton data={trendData} filename="collaboration_trend" />
        </div>
        <h3 className="font-headline text-lg font-bold text-primary mb-6">Collaboration Outlook (By Country)</h3>
        <div className="h-[350px] mb-6 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2df" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#8c8c8c', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#8c8c8c', fontSize: 12}} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '0px', border: '1px solid #e4e2df', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                cursor={{stroke: '#1A4D2E', strokeWidth: 1}}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="International" name="International Co-authors" stroke="#1A4D2E" strokeWidth={4} dot={{r: 6, fill: '#1A4D2E', border: 2}} activeDot={{r: 8}} />
              <Line type="monotone" dataKey="Domestic" name="University Lead" stroke="#C9922A" strokeWidth={4} dot={{r: 6, fill: '#C9922A', border: 2}} activeDot={{r: 8}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-primary/5 p-6 border-l-4 border-primary shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🌍</span>
            <h4 className="font-headline font-bold text-primary tracking-tight">Geo-Impact Analysis</h4>
          </div>
          <p className="text-sm font-bold text-on-surface/80">
            For {currentYearData.year}, the international collaboration rate is <span className="text-primary text-xl font-black">{intlRate}%</span>. 
            Research showing multi-country involvement typically correlates with <span className="border-b-2 border-primary/20">40% higher citation scores</span> in global indexing services.
          </p>
        </div>
      </div>
    </div>
  );
}
