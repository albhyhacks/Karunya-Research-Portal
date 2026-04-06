import React, { useState, useEffect } from "react";
import { ShieldAlert, Database, Users, UserPlus, Trash2 } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { adminApi } from "../api/papers";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/layout/DashboardLayout";
import { SyncPanel, ThesisUpload } from "../components/admin";
import { Badge } from "../components/common";

const AdminPage = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("system"); // system, users

  const { data: status, reload: reloadStatus } = useFetch(adminApi.getSyncStatus, []);
  const { data: health } = useFetch(() => api.get("/api/health"), []);
  const { data: users, reload: reloadUsers } = useFetch(adminApi.listUsers, []);

  useEffect(() => {
    let interval;
    if (status?.status === "running") {
      interval = setInterval(() => reloadStatus(), 5000);
    }
    return () => clearInterval(interval);
  }, [status?.status, reloadStatus]);

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", full_name: "", password: "", role: "user" });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createUser(newUser);
      showToast("User Created Successfully", "success");
      setNewUser({ email: "", full_name: "", password: "", role: "user" });
      setIsCreatingUser(false);
      reloadUsers();
    } catch (err) {
      showToast(err.message || "Failed to create user", "error");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete account for ${userName}? This action cannot be undone.`)) {
      try {
        await adminApi.deleteUser(userId);
        showToast("User Deleted Successfully", "success");
        reloadUsers();
      } catch (err) {
        showToast(err.message || "Failed to delete user", "error");
      }
    }
  };

  const [uploadProgress, setUploadProgress] = useState(0);

  const handleThesisUpload = async (formData) => {
    setUploadProgress(1);
    try {
      const response = await adminApi.uploadThesis(formData);
      showToast("Thesis Uploaded Successfully", "success");
      setUploadProgress(0);
      return response;
    } catch (err) {
      showToast("Upload Failed", "error");
      setUploadProgress(0);
      throw err;
    }
  };

  return (
    <DashboardLayout title="Admin Console" subtitle="System configuration and integration sync panels">
      <div className="px-12 py-8 space-y-12">
        <div className="flex justify-between items-center bg-surface-container-low p-2 rounded-lg border border-outline-variant/10 max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab("system")}
            className={`flex-1 py-2 px-6 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'system' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface/50 hover:text-primary'}`}
          >
            System Info
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-2 px-6 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-primary text-on-primary shadow-lg' : 'text-on-surface/50 hover:text-primary'}`}
          >
            User Management
          </button>
        </div>

        {activeTab === 'system' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 shadow-sm">
                <SyncPanel stats={status} status={status?.status} onSync={m => adminApi.triggerSync(m).then(reloadStatus)} />
              </div>
          
          <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 shadow-sm">
             <h3 className="text-xl font-headline font-bold text-primary mb-6 flex items-center">
               <Database className="mr-2" size={20} /> Infrastructure Status
             </h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center p-4 bg-surface-container-low border border-outline-variant/5">
                 <span className="text-xs font-bold text-outline uppercase tracking-widest">Scopus API</span>
                 <Badge variant={health?.scopus_config ? "success" : "default"}>
                   {health?.scopus_config ? "Connected" : "Disconnected"}
                 </Badge>
               </div>
               <div className="flex justify-between items-center p-4 bg-surface-container-low border border-outline-variant/5">
                 <span className="text-xs font-bold text-outline uppercase tracking-widest">Database</span>
                 <Badge variant="success">Operational</Badge>
               </div>
             </div>
          </div>
        </div>
        
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/10 shadow-sm relative overflow-hidden">
              {uploadProgress > 0 && (
                <div className="absolute top-0 left-0 h-1 bg-secondary transition-all" style={{ width: `${uploadProgress}%` }} />
              )}
              <h3 className="text-xl font-headline font-bold text-primary mb-6">Archive Operations</h3>
              <ThesisUpload onUpload={handleThesisUpload} />
              {uploadProgress > 0 && <p className="text-xs text-secondary mt-2 font-bold uppercase tracking-widest text-center mt-4">Uploading... {uploadProgress}%</p>}
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-headline font-bold text-primary flex items-center">
                <Users className="mr-3" size={28} /> Faculty Accounts
              </h3>
              <button 
                onClick={() => setIsCreatingUser(true)}
                className="bg-secondary text-on-secondary px-6 py-3 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90"
              >
                <UserPlus size={18} /> Add Faculty
              </button>
            </div>

            {isCreatingUser && (
              <div className="bg-surface-container-low p-8 border border-secondary/20 shadow-inner">
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Full Name</label>
                    <input 
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 p-3 outline-none focus:border-secondary" 
                      value={newUser.full_name}
                      onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Email</label>
                    <input 
                      type="email"
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 p-3 outline-none focus:border-secondary" 
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline">Password</label>
                    <input 
                      type="password"
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 p-3 outline-none focus:border-secondary" 
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-primary text-on-primary py-3 font-bold text-xs uppercase tracking-widest">Save</button>
                    <button type="button" onClick={() => setIsCreatingUser(false)} className="flex-1 bg-surface-container-high text-on-surface py-3 font-bold text-xs uppercase tracking-widest">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-surface-container-lowest border border-outline-variant/10 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline border-b border-outline-variant/10">Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline border-b border-outline-variant/10">Email</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline border-b border-outline-variant/10">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline border-b border-outline-variant/10">Created</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline border-b border-outline-variant/10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map(u => (
                    <tr key={u.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4 font-headline font-bold text-primary border-b border-outline-variant/5">{u.full_name}</td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant border-b border-outline-variant/5">{u.email}</td>
                      <td className="px-6 py-4 border-b border-outline-variant/5">
                        <Badge variant={u.role === 'admin' ? 'success' : 'default'}>{u.role}</Badge>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-outline border-b border-outline-variant/5">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 border-b border-outline-variant/5 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          className="p-2 text-on-surface-variant hover:text-error transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPage;
