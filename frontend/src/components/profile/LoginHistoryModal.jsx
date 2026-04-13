import React, { useState, useEffect } from "react";
import { X, History, Monitor, Smartphone, Globe, AlertCircle, Clock } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";

const LoginHistoryModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/api/auth/login-history");
      setHistory(response);
    } catch (err) {
      setError("Failed to load login history.");
      showToast("Error loading activity logs", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <Globe size={18} />;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobi") || ua.includes("android")) return <Smartphone size={18} />;
    return <Monitor size={18} />;
  };

  const formatBrowser = (userAgent) => {
    if (!userAgent) return "Unknown Browser";
    const ua = userAgent.toLowerCase();
    if (ua.includes("edg/")) return "Microsoft Edge";
    if (ua.includes("chrome")) return "Google Chrome";
    if (ua.includes("firefox")) return "Mozilla Firefox";
    if (ua.includes("safari")) return "Apple Safari";
    return "Web Browser";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-dim/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-bright w-full max-w-2xl rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-300">
        <div className="px-8 py-6 bg-secondary text-on-secondary flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <History size={20} />
            <h2 className="text-xl font-headline font-bold">Login Activity</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-4 py-10">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-surface-container rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant space-y-4">
               <AlertCircle size={48} className="opacity-20" />
               <p className="font-medium text-lg">{error}</p>
               <button onClick={fetchHistory} className="text-primary font-bold hover:underline">Try Again</button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant space-y-4 opacity-60">
               <Clock size={48} />
               <p className="font-medium">No login events recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((event, idx) => (
                <div 
                  key={event.id} 
                  className={`flex items-center gap-6 p-5 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-all group ${idx === 0 ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-surface-bright"}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${idx === 0 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                    {getDeviceIcon(event.user_agent)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-on-surface truncate">
                        {formatBrowser(event.user_agent)}
                        {idx === 0 && <span className="ml-3 px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">Current Session</span>}
                      </h4>
                      <p className="text-xs font-medium text-on-surface-variant whitespace-nowrap ml-4">
                        {new Date(event.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-on-surface-variant opacity-70">
                      <div className="flex items-center gap-1">
                        <Globe size={12} />
                        <span>{event.ip_address || "Local IP"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-outline-variant/10 bg-surface-container-low/50 text-center shrink-0">
           <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-bold">
             Showing the last 10 successful authentication events
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginHistoryModal;
