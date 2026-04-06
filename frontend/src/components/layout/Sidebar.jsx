import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin, logout } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const NavItem = ({ to, icon, label }) => {
    const active = isActive(to) && to !== "/";
    const baseClasses = "flex items-center px-6 py-4 font-headline font-medium tracking-tight transition-colors duration-300";
    const activeClasses = "text-primary font-bold border-l-4 border-secondary bg-surface-container-low/50";
    const inactiveClasses = "text-on-surface/70 hover:bg-surface-container-low";

    return (
      <Link to={to} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
        <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
          {icon}
        </span>
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r-0 bg-surface-container-highest flex flex-col py-8 px-0 z-50">
      <div className="px-6 mb-10">
        <Link to="/" className="block cursor-pointer">
          <img 
            alt="Karunya University Crest" 
            className="h-16 w-auto mb-4 grayscale opacity-90" 
            src="/logo.jpeg"
          />
          <h1 className="text-2xl font-bold tracking-tighter text-primary font-headline">Karunya Portal</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-on-surface-variant opacity-60">The Digital Archivist</p>
        </Link>
      </div>

      <nav className="flex-grow flex flex-col">
        <NavItem to="/dashboard" icon="dashboard" label="Dashboard" />
        <NavItem to="/authors" icon="school" label="Faculty" />
        <NavItem to="/papers" icon="menu_book" label="Publications" />
        <NavItem to="/analytics" icon="analytics" label="Research Metrics" />
        
        {isAdmin && (
          <div className="mt-8 pt-8 border-t border-on-surface/5">
            <p className="px-6 mb-4 text-[10px] uppercase tracking-widest font-bold text-on-surface/40">Administration</p>
            <NavItem to="/admin" icon="settings" label="Admin Console" />
          </div>
        )}
      </nav>

      <div className="px-6 py-6 mt-auto border-t border-on-surface/5 space-y-4">
        <button 
          onClick={logout}
          className="flex items-center w-full px-0 py-2 text-on-surface/50 hover:text-error transition-colors text-xs font-bold uppercase tracking-widest group"
        >
          <span className="material-symbols-outlined mr-3 text-sm group-hover:scale-110 transition-transform">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
