import React, { useState, useCallback, useMemo } from "react";
import { useFetch } from "../../hooks/useFetch";
import { analyticsApi } from "../../api/analytics";
import { outputTypeColors } from "../../utils/outputTypeColors";
import { DownloadCsvButton } from "./DownloadCsvButton";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";

// ── Constants ──────────────────────────────────────────────────────────────────
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CURRENT_YEAR = new Date().getFullYear();

// Colour for each year line in the comparison chart
const YEAR_COLORS = ["#49000a", "#7e5700", "#1a6b3c"];

// ── Tooltip used by both multi-year and department charts ──────────────────────
const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const tot = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-white border border-outline p-3 shadow-lg min-w-[150px]">
      <p className="font-bold text-on-surface mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.fill || p.stroke }}>
          {p.dataKey}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
      {payload.length > 1 && (
        <p className="text-xs font-bold text-outline mt-1 border-t border-outline-variant/30 pt-1">Total: {tot}</p>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const OutputTypesTab = () => {
  // Global filter state (affects SECTION 1 & 3)
  const [selectedYear, setSelectedYear]   = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");

  // 3-year comparison state — default to last 3 full years
  const defaultYears = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];
  const [pickedYears, setPickedYears] = useState(defaultYears);

  const yearParam  = selectedYear  === "All" ? null : selectedYear;
  const monthParam = selectedMonth === "All" ? null : selectedMonth;

  // Build comparison query string whenever picked years change
  const comparisonKey = pickedYears.join(",");
  const fetchComparison = useCallback(
    () => analyticsApi.getMonthlyComparison(comparisonKey),
    [comparisonKey]
  );

  const fetchYearlyData = useCallback(() => analyticsApi.getOutputTypesYearly(yearParam, monthParam), [yearParam, monthParam]);
  const fetchDeptData   = useCallback(() => analyticsApi.getOutputTypesByDept(yearParam, monthParam),  [yearParam, monthParam]);

  const { data: outputTypes,    loading: loadingTypes   } = useFetch(analyticsApi.getOutputTypes);
  const { data: yearlyData,     loading: loadingYearly  } = useFetch(fetchYearlyData,  [fetchYearlyData]);
  const { data: availableYears, loading: loadingYears   } = useFetch(analyticsApi.getOutputTypesAvailableYears);
  const { data: deptData,       loading: loadingDept    } = useFetch(fetchDeptData,    [fetchDeptData]);
  const { data: compData,       loading: loadingComp    } = useFetch(fetchComparison,  [fetchComparison]);

  const [stacked, setStacked] = useState(true);

  // ── Handle year-picker changes ────────────────────────────────────────────
  const handleYearPick = (slot, value) => {
    setPickedYears(prev => {
      const next = [...prev];
      next[slot] = parseInt(value, 10);
      return next;
    });
  };

  // ── Build grouped month chart data ────────────────────────────────────────
  // Shape: [{ month:"Jan", "2022":3, "2023":5, "2024":8 }, ...]
  const compChartData = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const row = { month: label };
      pickedYears.forEach(yr => {
        row[String(yr)] = compData?.data?.[String(yr)]?.[i] ?? 0;
      });
      return row;
    });
  }, [compData, pickedYears]);

  // Per-year totals from backend (includes papers without a month)
  const yearTotals = useMemo(() => {
    const result = {};
    pickedYears.forEach(yr => {
      result[yr] = compData?.totals?.[String(yr)] ?? 0;
    });
    return result;
  }, [compData, pickedYears]);

  // Per-year peak and quietest months (from monthly data)
  const yearStats = useMemo(() => {
    const result = {};
    pickedYears.forEach(yr => {
      const monthly = compData?.data?.[String(yr)];
      if (!monthly) { result[yr] = { peak: "-", peakVal: 0, quiet: "-", quietVal: 0 }; return; }
      let peakIdx = 0, quietIdx = 0;
      monthly.forEach((v, i) => {
        if (v > monthly[peakIdx])  peakIdx  = i;
        if (v < monthly[quietIdx]) quietIdx = i;
      });
      result[yr] = {
        peak:     MONTH_LABELS[peakIdx],
        peakVal:  monthly[peakIdx],
        quiet:    MONTH_LABELS[quietIdx],
        quietVal: monthly[quietIdx],
      };
    });
    return result;
  }, [compData, pickedYears]);

  // CSV export for comparison (one row per month, columns = years)
  const compCsvData = compChartData;

  // ── Screen-level loading skeleton ────────────────────────────────────────
  if (loadingTypes || loadingYearly || loadingDept || loadingYears) {
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

  const typesData   = outputTypes?.data || [];
  const totalPapers = outputTypes?.total || 0;

  const deptChartData = deptData?.data.map(d => ({
    department: d.department,
    ...d.breakdown,
    total: d.total
  })) || [];

  const monthsList = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" },   { value: "5", label: "May" },      { value: "6", label: "June" },
    { value: "7", label: "July" },    { value: "8", label: "August" },   { value: "9", label: "September" },
    { value: "10", label: "October"}, { value: "11", label: "November"}, { value: "12", label: "December" }
  ];

  const CustomTooltipPie = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-outline p-3 shadow-lg">
        <p className="font-bold text-on-surface">{payload[0].name}</p>
        <p className="text-sm text-outline">{payload[0].value} papers ({payload[0].payload.percentage}%)</p>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Global Filters ──────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest p-6 border border-outline-variant/10 flex items-center gap-6 rounded-lg">
        <h3 className="font-headline font-bold text-primary mr-4 text-lg">Filters</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-outline uppercase tracking-wider">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-surface-container text-on-surface text-sm px-3 py-1.5 outline-none border border-outline-variant/30 font-bold focus:border-primary transition-colors cursor-pointer rounded"
          >
            <option value="All">All Years</option>
            {(availableYears || []).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-outline uppercase tracking-wider">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-surface-container text-on-surface text-sm px-3 py-1.5 outline-none border border-outline-variant/30 font-bold focus:border-primary transition-colors cursor-pointer rounded"
          >
            <option value="All">All Months</option>
            {monthsList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── SECTION 1: Donut + Stat Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
          <div className="absolute top-8 right-8 z-10">
            <DownloadCsvButton data={typesData} filename="output_types_breakdown" />
          </div>
          <h3 className="font-headline text-lg font-bold text-primary mb-6">Research Output Breakdown</h3>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typesData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={2} dataKey="count" nameKey="type" stroke="none">
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

      {/* ── SECTION 2: Multi-year trend bar chart ───────────────────────────── */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
        <div className="absolute top-8 right-8 z-10 flex gap-4 items-center">
          <div className="flex bg-surface-container items-center text-xs font-bold p-1">
            <button className={`px-3 py-1 ${stacked ? 'bg-primary text-white' : 'text-outline hover:text-on-surface'}`} onClick={() => setStacked(true)}>Stacked</button>
            <button className={`px-3 py-1 ${!stacked ? 'bg-primary text-white' : 'text-outline hover:text-on-surface'}`} onClick={() => setStacked(false)}>Grouped</button>
          </div>
          <DownloadCsvButton 
            data={yearlyData?.years?.map((y, i) => {
              const row = { year: y };
              yearlyData?.series?.forEach(s => { row[s.type] = s.values[i]; });
              return row;
            }) || []} 
            filename="output_trends_yearly" 
          />
        </div>
        <h3 className="font-headline text-lg font-bold text-primary mb-6">Output Type Trends Over Time</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData?.years?.map((y, i) => {
              const row = { year: y };
              yearlyData?.series?.forEach(s => { row[s.type] = s.values[i]; });
              return row;
            }) || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2df" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#8a7171" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#8a7171" }} />
              <RechartsTooltip content={<CustomTooltipBar />} cursor={{ fill: "#f5f3f0" }} />
              <Legend />
              {yearlyData?.series?.map(s => (
                <Bar key={s.type} dataKey={s.type} stackId={stacked ? "a" : undefined} fill={outputTypeColors[s.type] || outputTypeColors["Other"]} radius={stacked ? [0,0,0,0] : [2,2,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── SECTION 2B: 3-Year Monthly Comparison (NEW) ─────────────────────── */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant/10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
          <div>
            <h3 className="font-headline text-lg font-bold text-primary">Year-over-Year Monthly Comparison</h3>
            <p className="text-sm text-outline mt-1">
              Choose any 3 years — see each year's 12-month publication breakdown side by side
            </p>
          </div>
          <DownloadCsvButton data={compCsvData} filename={`monthly_comparison_${pickedYears.join("_")}`} />
        </div>

        {/* Year selectors */}
        <div className="flex flex-wrap gap-4 mb-6">
          {[0, 1, 2].map(slot => (
            <div key={slot} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: YEAR_COLORS[slot] }} />
              <span className="text-xs font-bold text-outline uppercase tracking-wider">Year {slot + 1}</span>
              <select
                value={pickedYears[slot]}
                onChange={(e) => handleYearPick(slot, e.target.value)}
                className="bg-surface-container text-on-surface text-sm px-3 py-1.5 outline-none border border-outline-variant/30 font-bold focus:border-primary transition-colors cursor-pointer rounded"
              >
                {(availableYears || []).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Chart */}
        {loadingComp ? (
          <div className="h-[360px] animate-pulse bg-surface-container-low rounded" />
        ) : (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2df" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#8a7171" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#8a7171" }} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltipBar />} cursor={{ fill: "#f5f3f0" }} />
                <Legend />
                {pickedYears.map((yr, slot) => (
                  <Bar
                    key={yr}
                    dataKey={String(yr)}
                    name={String(yr)}
                    fill={YEAR_COLORS[slot]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per-year stat cards */}
        {!loadingComp && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {pickedYears.map((yr, slot) => {
              const stats = yearStats[yr] || {};
              const total = yearTotals[yr] || 0;
              const borderColor = YEAR_COLORS[slot];
              return (
                <div key={yr} className="bg-surface-container p-5 border-l-4" style={{ borderLeftColor: borderColor }}>
                  {/* Year badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-outline">{yr}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: borderColor }} />
                  </div>
                  {/* Total */}
                  <p className="font-black text-4xl text-on-surface leading-none">{total.toLocaleString()}</p>
                  <p className="text-xs text-outline mt-1 mb-4">papers published</p>
                  {/* Peak / quiet */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-outline font-medium">📈 Peak month</span>
                      <span className="font-bold text-on-surface">
                        {stats.peak || "—"} {stats.peakVal > 0 ? `(${stats.peakVal})` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline font-medium">📉 Quietest</span>
                      <span className="font-bold text-on-surface">
                        {stats.quiet || "—"} {stats.quietVal !== undefined && stats.quietVal > 0 ? `(${stats.quietVal})` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Note when no monthly data but totals exist */}
        {!loadingComp && pickedYears.some(yr => yearTotals[yr] > 0) && compChartData.every(row =>
          pickedYears.every(yr => (row[String(yr)] || 0) === 0)
        ) && (
          <div className="mt-4 text-sm text-outline bg-surface-container p-4 border border-outline-variant/20 rounded flex items-start gap-2">
            <span>ℹ️</span>
            <span>
              Total paper counts are shown above, but <strong>month-level data is unavailable</strong> for these years
              (publication month was not recorded when papers were imported). The bar chart will populate
              as new papers with month data are added.
            </span>
          </div>
        )}
      </div>

      {/* ── SECTION 3: Department mix ────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 relative">
        <div className="absolute top-8 right-8 z-10">
          <DownloadCsvButton data={deptChartData} filename={`output_by_department_${selectedYear}_${selectedMonth}`} />
        </div>
        <h3 className="font-headline text-lg font-bold text-primary mb-6">Output Mix by Department</h3>
        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={deptChartData} margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e2df" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8a7171" }} />
              <YAxis type="category" dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "#1a1c18", width: 110 }} />
              <RechartsTooltip cursor={{ fill: "#f5f3f0" }} contentStyle={{ borderRadius: '0px', border: '1px solid #e4e2df', boxShadow: 'none' }} />
              <Legend />
              {Object.keys(outputTypeColors).map(type => (
                <Bar key={type} dataKey={type} stackId="a" fill={outputTypeColors[type]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 flex gap-4 text-sm font-bold text-on-surface">
          {deptChartData.length > 0 && (() => {
            let maxJournalDept = deptChartData[0], maxJournalPct = 0;
            let maxConfDept = deptChartData[0], maxConfPct = 0;
            deptChartData.forEach(d => {
              const t = d.total || 1;
              const jPct = (d["Journal Article"] || 0) / t;
              const cPct = (d["Conference Paper"] || 0) / t;
              if (jPct > maxJournalPct) { maxJournalPct = jPct; maxJournalDept = d; }
              if (cPct > maxConfPct)    { maxConfPct = cPct;    maxConfDept   = d; }
            });
            return (
              <>
                <div className="flex-1 bg-surface-container p-4 border-l-4 border-maroon">
                  <p>Most journal-focused: <span className="text-primary">{maxJournalDept.department}</span> — {Math.round(maxJournalPct * 100)}% journal articles</p>
                </div>
                <div className="flex-1 bg-surface-container p-4 border-l-4 border-gold">
                  <p>Most conference-active: <span className="text-primary">{maxConfDept.department}</span> — {Math.round(maxConfPct * 100)}% conference papers</p>
                </div>
              </>
            );
          })()}
        </div>
      </div>

    </div>
  );
};
