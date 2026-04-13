import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import ChangePasswordModal from "../components/profile/ChangePasswordModal";
import LoginHistoryModal from "../components/profile/LoginHistoryModal";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  
  // Get initials for profile placeholder
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <DashboardLayout title="User Profile" subtitle="Account Details and Settings">
      <div className="max-w-4xl mx-auto py-10 px-6 space-y-10 pb-24">
        
        {/* Profile Card Header */}
        <section className="bg-gradient-to-r from-primary to-primary-container rounded-3xl p-10 text-on-primary relative overflow-hidden shadow-2xl">
           <div 
             className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none opacity-20 transform translate-x-1/4 translate-y-1/4"
             style={{
               backgroundImage: "radial-gradient(circle, #fff 10%, transparent 10%)",
               backgroundSize: "20px 20px"
             }}
           ></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
             <div className="w-32 h-32 rounded-full border-4 border-secondary/40 flex items-center justify-center overflow-hidden shadow-inner bg-white/20 backdrop-blur-md">
                <span className="text-4xl font-headline font-bold text-secondary">
                  {getInitials(user?.full_name)}
                </span>
             </div>
             <div className="text-center md:text-left">
               <h1 className="text-3xl lg:text-4xl font-headline font-bold mb-2 tracking-tight">
                 {user?.full_name || "User Name"}
               </h1>
               <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  <span className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary text-sm font-medium tracking-wide uppercase">
                    {user?.role === "admin" ? "Platform Admin" : "Faculty Member"}
                  </span>
                  <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/20">
                    ID: {user?.id?.slice(0, 8) || "••••••••"}
                  </span>
               </div>
             </div>
           </div>
        </section>

        {/* Account Details */}
        <section className="grid md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-8">
            <h2 className="text-2xl font-headline font-bold text-on-surface">Account Information</h2>
            <div className="bg-surface-bright rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 shadow-sm overflow-hidden">
               <InfoRow label="Full Name" value={user?.full_name} icon="person" />
               <InfoRow label="Institutional Email" value={user?.email} icon="mail" />
               <InfoRow label="Assigned Role" value={user?.role?.toUpperCase()} icon="verified_user" />
               <InfoRow label="Department" value="Institutional Research & Analytics" icon="domain" />
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-headline font-bold text-on-surface">Security</h2>
            <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/30 space-y-6 shadow-sm">
                <div className="space-y-4">
                  <button 
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full px-6 py-4 bg-surface-container-high hover:bg-primary hover:text-white transition-all duration-300 rounded-xl font-medium flex items-center justify-between group outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <span>Change Password</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">lock_reset</span>
                  </button>
                  <button 
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="w-full px-6 py-4 bg-surface-container-high hover:bg-primary hover:text-white transition-all duration-300 rounded-xl font-medium flex items-center justify-between group outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <span>Login History</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">history</span>
                  </button>
                  <div className="h-px bg-outline-variant/10 my-4"></div>
                  <button 
                    onClick={logout}
                    className="w-full px-6 py-4 bg-error/10 text-error hover:bg-error hover:text-white transition-all duration-300 rounded-xl font-bold flex items-center justify-between group outline-none focus:ring-2 focus:ring-error/50"
                  >
                    <span>Sign Out</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">logout</span>
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest text-center">
                  Last login: {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
            </div>
          </div>
        </section>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
      
      <LoginHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />
    </DashboardLayout>
  );
};

// UI Components
const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-center px-8 py-6 group hover:bg-surface-container-low transition-colors">
     <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary/70 mr-6 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined">{icon}</span>
     </div>
     <div className="flex-grow">
        <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1 opacity-70">{label}</p>
        <p className="text-lg font-medium text-on-surface">{value || "Not Set"}</p>
     </div>
  </div>
);

export default ProfilePage;
