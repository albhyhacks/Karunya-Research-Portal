import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`flex items-center p-4 min-w-[300px] max-w-md bg-white rounded-xl shadow-2xl border-l-4 animate-in slide-in-from-right duration-300 ${
              toast.type === "success" ? "border-green-500" :
              toast.type === "error" ? "border-red-500" :
              "border-[#0f2557]"
            }`}
          >
            <div className="mr-3">
              {toast.type === "success" && <CheckCircle className="text-green-500" size={20} />}
              {toast.type === "error" && <AlertCircle className="text-red-500" size={20} />}
              {toast.type === "info" && <Info className="text-[#0f2557]" size={20} />}
            </div>
            <p className="text-sm font-bold text-gray-700 flex-grow">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="ml-4 p-1 rounded-full hover:bg-gray-100 text-gray-400">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
