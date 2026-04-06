import { Link, useLocation } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const NavLink = ({ to, children }) => {
    const activeClass = isActive(to)
      ? "text-primary border-b-2 border-secondary pb-1"
      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low pb-1";

    return (
      <Link
        to={to}
        className={`font-headline text-lg tracking-tight transition-colors duration-300 ${activeClass}`}
      >
        {children}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md flex justify-between items-center w-full px-8 py-4 border-b border-outline-variant/20 shadow-sm">
      <div className="max-w-screen-2xl mx-auto w-full flex justify-between items-center">
        <Link to="/" className="text-2xl font-headline font-bold text-primary">
          Karunya Research Portal
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/papers">Publications</NavLink>
          <NavLink to="/authors">Faculty</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
        </div>
        
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-3 px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-full hover:bg-surface-container-high transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs ring-2 ring-secondary/20">
                {getInitials(user?.full_name)}
              </div>
              <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest text-secondary group-hover:text-primary transition-colors">
                {user?.full_name?.split(" ")[0]}
              </span>
            </Link>
            
            <button 
              onClick={logout}
              title="Log Out"
              className="p-2.5 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-all border border-transparent hover:border-error/20"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-primary text-on-primary px-8 py-3 font-label uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-opacity">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Header;
