import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FileText, Users, Quote, TrendingUp } from "lucide-react";

export const OverviewStats = ({ stats }) => {
  const items = [
    { label: "Total Papers", value: stats?.total_papers, icon: FileText, color: "bg-primary" },
    { label: "Faculty Authors", value: stats?.total_authors, icon: Users, color: "bg-secondary" },
    { label: "Total Citations", value: stats?.total_citations, icon: Quote, color: "bg-surface-tint" },
    { label: "This Year", value: stats?.papers_this_year, icon: TrendingUp, color: "bg-primary-container" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {items.map((item) => (
        <div key={item.label} className="bg-surface-container-lowest p-6 border-l-4 border-primary flex items-center space-x-4 shadow-sm hover:-translate-y-1 transition-transform">
          <div className={`${item.color} p-4 text-white shadow-lg`}>
            <item.icon size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest leading-none mb-1">{item.label}</p>
            <p className="font-headline text-3xl font-black text-on-surface leading-none">{item.value?.toLocaleString() || 0}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const YearlyChart = ({ data }) => (
  <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 h-[400px]">
    <h3 className="font-headline text-lg font-bold text-primary mb-6">Publication Trends (Last 10 Years)</h3>
    <ResponsiveContainer width="100%" height="85%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e2df" />
        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#8a7171" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: "#8a7171" }} />
        <Tooltip 
          cursor={{ fill: "#f5f3f0" }}
          contentStyle={{ borderRadius: '0px', border: '1px solid #e4e2df', boxShadow: 'none', fontWeight: '700', backgroundColor: '#ffffff' }}
        />
        <Bar dataKey="count" fill="#7e5700" radius={[0, 0, 0, 0]} barSize={40}>
          {data?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === data.length - 1 ? "#49000a" : "#7e5700"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const KeywordCloud = ({ keywords }) => (
  <div className="bg-surface-container-lowest p-8 border border-outline-variant/10">
    <h3 className="font-headline text-lg font-bold text-primary mb-6">Research Domains</h3>
    <div className="flex flex-wrap gap-3">
      {keywords?.map(({ name, count }) => (
        <span 
          key={name}
          className="px-4 py-2 bg-surface-container-high text-on-surface font-bold border border-outline-variant/30 hover:border-primary hover:bg-primary-fixed hover:text-on-primary-fixed transition-all cursor-default"
          style={{ fontSize: Math.max(0.8, Math.min(1.5, 0.8 + count / 10)) + 'rem' }}
        >
          {name}
        </span>
      ))}
    </div>
  </div>
);

export { ContributorsTab } from './ContributorsTab';
