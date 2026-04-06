import React, { useState } from "react";
import { RefreshCw, Upload, CheckCircle, AlertCircle, Clock, Database, FileUp } from "lucide-react";
import { adminApi } from "../../api/papers"; // Adjust import path if needed
import { Badge, Spinner } from "../common";

export const SyncPanel = ({ stats, status, onSync }) => {
  const [loading, setLoading] = useState(false);

  const handleSync = async (mode) => {
    setLoading(true);
    try {
      await onSync(mode);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    running: "text-blue-500",
    success: "text-green-500",
    error: "text-red-500",
    idle: "text-gray-400",
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-50 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0f2557] flex items-center">
            <Database className="mr-3" size={28} /> Data Ingestion
          </h2>
          <p className="text-gray-400 font-medium">Synchronize local database with Scopus API</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            disabled={loading || status === "running"}
            onClick={() => handleSync("incremental")}
            className="flex-1 md:flex-none px-6 py-3 bg-white border-2 border-gray-100 rounded-xl font-bold flex items-center justify-center space-x-2 hover:border-[#0f2557] hover:text-[#0f2557] transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading || status === "running" ? "animate-spin" : ""} />
            <span>Incremental</span>
          </button>
          <button 
            disabled={loading || status === "running"}
            onClick={() => handleSync("full")}
            className="flex-1 md:flex-none px-6 py-3 bg-[#0f2557] text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading || status === "running" ? "animate-spin" : ""} />
            <span>Full Sync</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-50 flex items-center space-x-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Clock className="text-[#0f2557]" size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Last Sync</span>
            <span className="font-bold text-gray-700">
              {stats?.last_sync_at ? new Date(stats.last_sync_at).toLocaleString() : "Never"}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-50 flex items-center space-x-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            {status === "success" ? <CheckCircle className="text-green-500" size={24} /> : 
             status === "error" ? <AlertCircle className="text-red-500" size={24} /> : 
             <RefreshCw className={`text-blue-500 ${status === "running" ? "animate-spin" : ""}`} size={24} />}
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Status</span>
            <span className={`font-bold capitalize ${statusColors[status] || "text-gray-500"}`}>
              {status || "Idle"}
            </span>
          </div>
        </div>

        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-50 flex items-center space-x-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Database className="text-blue-500" size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">New Records</span>
            <span className="font-bold text-gray-700">{stats?.papers_added || 0} Papers added</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ThesisUpload = ({ onUpload }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    try {
      await onUpload(formData);
      e.target.reset();
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-50">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#0f2557] flex items-center uppercase tracking-tight">
          <FileUp className="mr-3" size={24} /> Thesis Repository
        </h2>
        <p className="text-gray-400 font-medium">Add student research to the institutional repository</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Thesis Title</label>
            <input required name="title" className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-[#0f2557] outline-none transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Author Name</label>
            <input required name="author_name" className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-[#0f2557] outline-none transition-colors" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Abstract</label>
          <textarea rows={4} name="abstract" className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-[#0f2557] outline-none transition-colors" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Department</label>
            <input name="department" className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-[#0f2557] outline-none transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Supervisor</label>
            <input name="supervisor_name" className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-[#0f2557] outline-none transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Year</label>
            <input type="number" name="year" className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-[#0f2557] outline-none transition-colors" />
          </div>
        </div>

        <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-[#0f2557] transition-all group flex flex-col items-center justify-center text-center cursor-pointer">
          <input 
            required 
            type="file" 
            name="file" 
            accept=".pdf" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => setFile(e.target.files[0])}
          />
          <div className="w-16 h-16 bg-blue-50 text-[#0f2557] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <p className="font-bold text-gray-700">{file ? file.name : "Drop PDF here or click to browse"}</p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Maximum file size: 20MB</p>
        </div>

        <button 
          disabled={loading}
          type="submit"
          className="w-full bg-[#0f2557] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {loading ? <Spinner className="text-white" /> : <span>Upload & Index Thesis</span>}
        </button>
      </form>
    </div>
  );
};
