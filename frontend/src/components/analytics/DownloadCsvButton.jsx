import React from 'react';
import { Download } from 'lucide-react';

export const DownloadCsvButton = ({ data, filename, columns }) => {
  const handleDownload = () => {
    if (!data || data.length === 0) return;
    
    const cols = columns || Object.keys(data[0]);
    
    const csvRows = [];
    csvRows.push(cols.join(','));
    
    for (const row of data) {
      const values = cols.map(col => {
        let val = row[col] !== undefined && row[col] !== null ? row[col] : '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const escapeQuote = val.toString().replace(/"/g, '""');
        return `"${escapeQuote}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button 
      onClick={handleDownload}
      className="flex items-center gap-2 text-xs font-bold text-outline hover:text-primary transition-colors bg-surface-container-high px-3 py-1.5"
    >
      <Download size={14} /> Download CSV
    </button>
  );
};
