import React, { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { analyticsApi } from "../../api/analytics";
import { outputTypeColors } from "../../utils/outputTypeColors";
import { DownloadCsvButton } from "./DownloadCsvButton";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";

export const OutputTypesTab = () => {
  const { data: outputTypes, loading: loadingTypes } = useFetch(analyticsApi.getOutputTypes);
  const { data: yearlyData, loading: loadingYearly } = useFetch(analyticsApi.getOutputTypesYearly);
  const { data: deptData, loading: loadingDept } = useFetch(analyticsApi.getOutputTypesByDept);
  
  const [stacked, setStacked] = useState(true);

  if (loadingTypes || loadingYearly || loadingDept) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex gap-8">
          <div className="w-1/2 h-[400px] bg-surface-container-lowest border border-outline-variant/10"></div>
          <div className="w-1/2 h-[400px] bg-surface-container-lowest border border-outline-variant/10"></div>
        </div>
        <div className="h-[400px] bg-surface-container-lowest border border-outline-variant/10"></div>
      </div>
    );
  }

  const typesData = outputTypes?.data || [];
  const totalPapers = outputTypes?.total || 0;
  
  const CustomTooltipPie = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-outline p-3 shadow-lg">
          <p className="font-bold text-on-surface">{payload[0].name}</p>
          <p className="text-sm text-outline">{payload[0].value} papers ({payload[0].payload.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const deptChartData = deptData?.data.map(d => ({
    department: d.department,
    ...d.breakdown,
    total: d.total
  })) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SECTION 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Donut Chart */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
          <div className="absolute top-8 right-8 z-10">
            <DownloadCsvButton data={typesData} filename="output_types_breakdown" />
          </div>
          <h3 className="font-headline text-lg font-bold text-primary mb-6">Research Output Breakdown</h3>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="type"
                  stroke="none"
                >
                  {typesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={outputTypeColors[entry.type] || outputTypeColors["Other"]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-on-surface">{totalPapers}</span>
              <span className="text-xs font-bold text-outline uppercase tracking-widest text-center mt-1">Total Papers</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {typesData.map(t => (
              <div key={t.type} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3" style={{ backgroundColor: outputTypeColors[t.type] || outputTypeColors["Other"] }}></div>
                <span className="font-bold text-on-surface">{t.type}</span>
                <span className="text-outline">({t.count} - {t.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stat Cards */}
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 flex flex-col gap-4 overflow-y-auto max-h-[460px]">
          <h3 className="font-headline text-lg font-bold text-primary mb-2">Metrics by Output Type</h3>
          {typesData.map(t => (
            <div key={t.type} className="flex bg-surface-container p-4 border-l-4 shadow-sm" style={{ borderLeftColor: outputTypeColors[t.type] || outputTypeColors["Other"] }}>
              <div className="flex-1">
                <p className="font-bold text-on-surface text-lg">{t.type}</p>
                <p className="text-sm text-outline mt-1">Avg. {t.avg_citations} citations per paper</p>
              </div>
              <div className="text-right">
                <p className="font-black text-2xl text-on-surface leading-none">{t.count}</p>
                <p className="text-xs text-outline mt-1">papers</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
        <div className="absolute top-8 right-8 z-10 flex gap-4 items-center">
          <div className="flex bg-surface-container items-center text-xs font-bold p-1">
            <button 
              className={`px-3 py-1 ${stacked ? 'bg-primary text-white' : 'text-outline hover:text-on-surface'}`}
              onClick={() => setStacked(true)}
            >
              Stacked
            </button>
            <button 
              className={`px-3 py-1 ${!stacked ? 'bg-primary text-white' : 'text-outline hover:text-on-surface'}`}
              onClick={() => setStacked(false)}
            >
              Grouped
            </button>
          </div>
          <DownloadCsvButton 
            data={yearlyData?.years?.map((y, i) => {
              const row = { year: y };
              yearlyData?.series?.forEach(s => {
                row[s.type] = s.values[i];
              });
              return row;
            }) || []} 
            filename="output_trends_yearly" 
          />
        </div>
        <h3 className="font-headline text-lg font-bold text-primary mb-6">Output Type Trends Over Time</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={yearlyData?.years?.map((y, i) => {
                const row = { year: y };
                yearlyData?.series?.forEach(s => { row[s.type] = s.values[i]; });
                return row;
              }) || []}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2df" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#8a7171" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#8a7171" }} />
              <RechartsTooltip cursor={{ fill: "#f5f3f0" }} contentStyle={{ borderRadius: '0px', border: '1px solid #e4e2df', boxShadow: 'none' }} />
              <Legend />
              {yearlyData?.series?.map(s => (
                <Bar 
                  key={s.type} 
                  dataKey={s.type} 
                  stackId={stacked ? "a" : undefined} 
                  fill={outputTypeColors[s.type] || outputTypeColors["Other"]} 
                  radius={stacked ? [0, 0, 0, 0] : [2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 3 */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
        <div className="absolute top-8 right-8 z-10 flex gap-4">
          <DownloadCsvButton data={deptChartData} filename="output_by_department" />
        </div>
        <h3 className="font-headline text-lg font-bold text-primary mb-6">Output Mix by Department</h3>
        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={deptChartData} margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e2df" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8a7171" }} />
              <YAxis 
                type="category" 
                dataKey="department" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 600, fill: "#1a1c18", width: 110 }} 
              />
              <RechartsTooltip cursor={{ fill: "#f5f3f0" }} contentStyle={{ borderRadius: '0px', border: '1px solid #e4e2df', boxShadow: 'none' }} />
              <Legend />
              {Object.keys(outputTypeColors).map(type => (
                <Bar key={type} dataKey={type} stackId="a" fill={outputTypeColors[type]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Callout Info */}
        <div className="mt-8 flex gap-4 text-sm font-bold text-on-surface">
             {deptChartData.length > 0 && (() => {
               // Calculate metrics for callouts
               let maxJournalDept = deptChartData[0];
               let maxJournalPct = 0;
               let maxConfDept = deptChartData[0];
               let maxConfPct = 0;
               
               deptChartData.forEach(d => {
                 const t = d.total || 1;
                 const jPct = (d["Journal Article"] || 0) / t;
                 const cPct = (d["Conference Paper"] || 0) / t;
                 if (jPct > maxJournalPct) { maxJournalPct = jPct; maxJournalDept = d; }
                 if (cPct > maxConfPct) { maxConfPct = cPct; maxConfDept = d; }
               });
               
               return (
                 <>
                  <div className="flex-1 bg-surface-container p-4 border-l-4 border-maroon">
                    <p>Most journal-focused department: <span className="text-primary">{maxJournalDept.department}</span> — {Math.round(maxJournalPct * 100)}% journal articles</p>
                  </div>
                  <div className="flex-1 bg-surface-container p-4 border-l-4 border-gold">
                    <p>Most conference-active department: <span className="text-primary">{maxConfDept.department}</span> — {Math.round(maxConfPct * 100)}% conference papers</p>
                  </div>
                 </>
               )
             })()}
        </div>
      </div>
    </div>
  );
};
