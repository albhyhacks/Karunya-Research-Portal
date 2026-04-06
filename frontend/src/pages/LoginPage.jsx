import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      
      // Redirect back to where they came from, or dashboard by default
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      if (err.message?.includes("401") || err.message?.includes("403")) {
        setError("Invalid email or password.");
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-background text-on-surface font-body selection:bg-secondary-container selection:text-on-secondary-container">
      {/* LEFT PANEL: Institutional Identity */}
      <section className="w-full md:w-1/2 bg-primary-container relative flex flex-col justify-center items-center px-12 py-20 text-center">
        {/* Decorative Cross Pattern */}
        <div 
          className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none opacity-15"
          style={{
            backgroundImage: "linear-gradient(#7c1a25 1px, transparent 1px), linear-gradient(90deg, #7c1a25 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        ></div>
        <div className="relative z-10 flex flex-col items-center">
          {/* University Crest Placeholder */}
          <div className="w-32 h-32 rounded-full border-2 border-secondary flex items-center justify-center mb-8 overflow-hidden shadow-2xl bg-white">
            <img 
              alt="Karunya University Logo" 
              className="w-full h-full object-contain p-2" 
              src="/logo.jpeg" 
            />
          </div>
          {/* Branding */}
          <h1 className="font-headline text-4xl lg:text-5xl text-secondary mb-6 tracking-tight leading-tight">
            Karunya Research Portal
          </h1>
          {/* Divider */}
          <div className="w-24 h-px bg-secondary/40 mb-6"></div>
          {/* Quote */}
          <p className="text-white italic font-headline text-lg lg:text-xl max-w-md opacity-90 leading-relaxed">
            "Advancing knowledge through faith, wisdom and excellence"
          </p>
        </div>
      </section>
      
      {/* RIGHT PANEL: Authentication Form */}
      <section className="w-full md:w-1/2 bg-surface-bright flex flex-col justify-center items-center px-8 md:px-16 py-12">
        <div className="w-full max-w-[400px]">
          <header className="mb-10">
            <h2 className="font-headline text-[28px] text-primary mb-2">Welcome back</h2>
            <p className="text-on-surface-variant text-sm font-body">Sign in to access the research portal</p>
          </header>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-error-container text-on-error-container px-4 py-3 text-sm font-medium border-l-4 border-error">
                {error}
              </div>
            )}
            {/* Email Input */}
            <div className="relative group">
              <label className="block font-label text-[11px] uppercase tracking-widest text-on-surface-variant mb-2 group-focus-within:text-secondary transition-colors" htmlFor="email">
                Institutional Email
              </label>
              <input 
                className="w-full bg-transparent border-0 border-b border-outline/30 focus:ring-0 focus:border-secondary text-on-surface placeholder:text-outline-variant py-3 transition-all outline-none" 
                id="email" 
                placeholder="yourname@karunya.edu" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {/* Password Input */}
            <div className="relative group">
              <label className="block font-label text-[11px] uppercase tracking-widest text-on-surface-variant mb-2 group-focus-within:text-secondary transition-colors" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input 
                  className="w-full bg-transparent border-0 border-b border-outline/30 focus:ring-0 focus:border-secondary text-on-surface placeholder:text-outline-variant py-3 transition-all pr-10 outline-none" 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                />
                <button 
                  className="absolute right-0 bottom-3 text-on-surface-variant hover:text-secondary transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Options */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer group">
                <input className="w-4 h-4 rounded-none border-outline/40 text-primary focus:ring-secondary/50 mr-2 bg-transparent accent-primary" type="checkbox" />
                <span className="text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
              </label>
              <Link className="text-secondary font-medium hover:text-on-secondary-container transition-colors" to="#">
                Forgot password?
              </Link>
            </div>
            
            {/* Actions */}
            <div className="pt-4 space-y-4">
              <button 
                className="w-full bg-primary text-secondary hover:bg-primary-container font-medium py-4 px-8 flex justify-center items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isLoading}
              >
                <span>{isLoading ? "Authenticating..." : "Sign In"}</span>
              </button>
              <button className="w-full bg-surface-container-low text-on-surface hover:bg-surface-container-high font-medium py-4 px-8 border border-outline-variant/20 flex justify-center items-center gap-3 transition-all duration-300" type="button">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </form>
          
          <footer className="mt-12 space-y-6 text-center">
            <p className="text-on-surface-variant text-sm">
              Don't have an account? <Link className="text-primary font-bold hover:underline decoration-secondary underline-offset-4" to="#">Contact your administrator</Link>
            </p>
            <div className="pt-8 border-t border-outline-variant/10">
              <p className="text-outline text-[10px] leading-relaxed tracking-wider uppercase font-label">
                Authorized personnel only. This system contains restricted academic and proprietary data. Access without explicit authorization is strictly prohibited.
              </p>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
