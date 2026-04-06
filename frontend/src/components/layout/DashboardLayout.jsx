import Sidebar from './Sidebar';
import Footer from './Footer';

const DashboardLayout = ({ title, subtitle, children }) => {
  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex">
      <Sidebar />
      <div className="ml-64 flex-grow flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md flex justify-between items-center w-auto px-10 py-6 border-b border-outline-variant/10">
          <div className="flex flex-col">
            <h2 className="font-headline text-2xl font-bold text-primary tracking-tight">{title}</h2>
            {subtitle && <p className="text-on-surface-variant text-sm font-medium">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-96 hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input 
                className="w-full bg-transparent border-b border-outline/30 py-2 pl-10 text-sm focus:outline-none focus:border-secondary transition-all font-body" 
                placeholder={`Search ${title.toLowerCase()}...`} 
                type="text"
              />
            </div>
            <div className="flex items-center gap-6">
              <button className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity">notifications</button>
              <button className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity">account_circle</button>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>
        
        {/* Dashboard inner footer */}
        <footer className="px-10 py-12 bg-surface-container border-t border-outline/5 mt-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-centermd:items-end">
            <div className="mb-4 md:mb-0">
              <p className="text-primary font-bold tracking-tighter mb-1 uppercase text-sm">Karunya Institute of Technology and Sciences</p>
              <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">© {new Date().getFullYear()} Karunya Portal. All intellectual assets protected.</p>
            </div>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-primary transition-colors" href="#">Terms of Access</a>
              <a className="hover:text-primary transition-colors" href="#">Internal Ethics Board</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
