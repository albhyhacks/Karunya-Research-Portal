import React, { useState } from "react";
import { X, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [passwords, setPasswords] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (passwords.new_password !== passwords.confirm_password) {
      setError("New passwords do not match");
      return;
    }

    if (passwords.new_password.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/change-password", passwords);
      showToast("Password updated successfully!", "success");
      onClose();
      setPasswords({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setError(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-dim/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-bright w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 bg-primary text-on-primary flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Lock size={20} />
            <h2 className="text-xl font-headline font-bold">Change Password</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-start gap-3 text-sm animate-in shake-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Current Password</label>
              <input 
                type="password"
                required
                className="w-full bg-surface-container-low border border-outline-variant/30 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={passwords.old_password}
                onChange={(e) => setPasswords({...passwords, old_password: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">New Password</label>
              <input 
                type="password"
                required
                className="w-full bg-surface-container-low border border-outline-variant/30 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={passwords.new_password}
                onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Confirm New Password</label>
              <input 
                type="password"
                required
                className="w-full bg-surface-container-low border border-outline-variant/30 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={passwords.confirm_password}
                onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-outline-variant/50 hover:bg-surface-container-high rounded-xl font-medium transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary text-on-primary hover:primary-container rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Updating..." : (
                <>
                  <span>Save Changes</span>
                  <ShieldCheck size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
