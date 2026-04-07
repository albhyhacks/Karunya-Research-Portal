import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleProtectedAction = (e, path) => {
    if (!isAuthenticated) {
      e.preventDefault();
      localStorage.setItem("redirectPath", path);
      navigate("/login");
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-primary-container overflow-hidden pt-32 pb-24 px-8 md:px-16 min-h-[819px] flex flex-col justify-center">
        {/* Subtle Geometric Pattern Overlay */}
        <div className="absolute inset-0 geometric-pattern pointer-events-none"></div>
        <div className="relative z-10 max-w-6xl">
          <h1 className="font-headline text-5xl md:text-7xl text-on-primary mb-8 leading-tight tracking-tight max-w-4xl">
            Discover Research That Matters
          </h1>
          <p className="font-body text-xl md:text-2xl text-on-primary/80 mb-12 max-w-2xl leading-relaxed">
            Explore publications, faculty research, and citation metrics from Karunya Institute of Technology and Sciences.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-20">
            <Link to="/papers" onClick={(e) => handleProtectedAction(e, '/papers')} className="bg-secondary text-on-primary px-10 py-5 text-sm font-bold uppercase tracking-widest hover:bg-secondary/90 transition-all flex items-center justify-center gap-3">
              Browse Publications
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link to="/login" className="hidden border border-outline/20 text-on-surface px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-secondary hover:text-secondary group flex items-center gap-3 transition-all lg:flex md:flex sm:flex">
              Sign In <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">login</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 border-t border-secondary/30 pt-12">
            <div className="flex flex-col">
              <span className="text-secondary font-headline text-4xl md:text-5xl font-bold mb-2">2,400+</span>
              <span className="text-on-primary/60 font-label uppercase tracking-wider text-xs">Publications</span>
            </div>
            <div className="flex flex-col">
              <span className="text-secondary font-headline text-4xl md:text-5xl font-bold mb-2">180+</span>
              <span className="text-on-primary/60 font-label uppercase tracking-wider text-xs">Researchers</span>
            </div>
            <div className="flex flex-col">
              <span className="text-secondary font-headline text-4xl md:text-5xl font-bold mb-2">12,000+</span>
              <span className="text-on-primary/60 font-label uppercase tracking-wider text-xs">Citations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-primary px-8 py-12 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center md:text-left">
            <div className="text-secondary font-headline text-3xl font-bold mb-1">24</div>
            <div className="text-on-primary/70 font-label text-xs uppercase tracking-widest">Departments Publishing</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-secondary font-headline text-3xl font-bold mb-1">450+</div>
            <div className="text-on-primary/70 font-label text-xs uppercase tracking-widest">Journals Featured</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-secondary font-headline text-3xl font-bold mb-1">1,200+</div>
            <div className="text-on-primary/70 font-label text-xs uppercase tracking-widest">Open Access Papers</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-secondary font-headline text-3xl font-bold mb-1">35</div>
            <div className="text-on-primary/70 font-label text-xs uppercase tracking-widest">Years of Research</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-surface-container-lowest py-24 px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center md:text-left">
            <h2 className="font-headline text-4xl md:text-5xl text-on-surface mb-4">Everything in one place</h2>
            <div className="w-24 h-1 bg-secondary opacity-40 mx-auto md:mx-0"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-surface p-10 border-t-4 border-secondary/60 flex flex-col gap-6 hover:bg-surface-container-low transition-colors duration-300">
              <div className="w-16 h-16 bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">search</span>
              </div>
              <h3 className="font-headline text-2xl text-on-surface">Search Publications</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Find any paper by title, keyword, author or department using our comprehensive archival indexing system.
              </p>
              <Link to="/papers" onClick={(e) => handleProtectedAction(e, '/papers')} className="mt-auto text-secondary font-bold text-sm uppercase tracking-widest border-b border-secondary/20 w-fit pb-1 hover:border-secondary transition-all">
                Explore Archives
              </Link>
            </div>
            
            <div className="bg-surface p-10 border-t-4 border-secondary/60 flex flex-col gap-6 hover:bg-surface-container-low transition-colors duration-300">
              <div className="w-16 h-16 bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">person</span>
              </div>
              <h3 className="font-headline text-2xl text-on-surface">Faculty Profiles</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Comprehensive list of researchers and their publications, including specialized fields of study and academic history.
              </p>
              <Link to="/authors" onClick={(e) => handleProtectedAction(e, '/authors')} className="mt-auto text-secondary font-bold text-sm uppercase tracking-widest border-b border-secondary/20 w-fit pb-1 hover:border-secondary transition-all">
                Meet Researchers
              </Link>
            </div>
            
            <div className="bg-surface p-10 border-t-4 border-secondary/60 flex flex-col gap-6 hover:bg-surface-container-low transition-colors duration-300">
              <div className="w-16 h-16 bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">bar_chart</span>
              </div>
              <h3 className="font-headline text-2xl text-on-surface">Research Analytics</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Track citation counts and impact factors over time with real-time data visualization of institutional impact.
              </p>
              <Link to="/analytics" onClick={(e) => handleProtectedAction(e, '/analytics')} className="mt-auto text-secondary font-bold text-sm uppercase tracking-widest border-b border-secondary/20 w-fit pb-1 hover:border-secondary transition-all">
                View Dashboards
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric Content Section */}
      <section className="bg-surface py-24 px-8 md:px-16 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          <div className="w-full lg:w-1/2">
            <img 
              alt="Research Lab" 
              className="w-full h-[600px] object-cover border border-outline-variant/20 grayscale hover:grayscale-0 transition-all duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6rH9JtEZfXaTvIbnoyL2GVgvn_XAtq40VcYy_AUEMdfE-_T1wO3-Z90omYjVYh7bIBJ8AQ0CvVZYH8H4l2RkDTBODqp-D1rrUn55a479p5WzyUf8QPTmhC1Sj8ORXJ8rvzOSgczu1hR5GFtw9X84TJVPuK7WEYNxTETtnEF63fQW60qYt2pkKHHiHw1zacFAtSf22v0yJx8g4xhxCyyW5PjsT1q2SO5WF1s7-b5O4ZVTvl5PrMNSAFDZ3NpMDtIljYBmg5FeJNnhR"
            />
          </div>
          <div className="w-full lg:w-1/2 flex flex-col gap-8">
            <h2 className="font-headline text-4xl md:text-5xl text-primary leading-tight">Advancing Knowledge for Global Impact</h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              At Karunya Institute of Technology and Sciences, our research initiatives are driven by the pursuit of excellence and the commitment to solve real-world problems. From biotechnology to sustainable engineering, our portal showcases the depth and breadth of our academic contributions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4">
              <div className="bg-surface-container-low p-6">
                <h4 className="font-headline text-xl text-on-surface mb-2">Sustainable Dev</h4>
                <p className="text-sm text-on-surface-variant">Integrating environmental stewardship in technological advancements.</p>
              </div>
              <div className="bg-surface-container-low p-6">
                <h4 className="font-headline text-xl text-on-surface mb-2">Innovation Lab</h4>
                <p className="text-sm text-on-surface-variant">Bridging the gap between theoretical research and market application.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default LandingPage;
