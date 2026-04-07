import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleAuth } = useAuth();
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
      // Read the stored redirect path from localStorage
      const redirectPath = localStorage.getItem("redirectPath");
      // Clear redirect path after using it
      if (redirectPath) {
        localStorage.removeItem("redirectPath");
      }
      
      // Redirect to that page, or homepage "/dashboard" if it doesn't exist
      navigate(redirectPath || "/dashboard", { replace: true });
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

  const handleGoogleSuccess = async (response) => {
    setError("");
    try {
      await googleAuth(response.credential);
      // Read the stored redirect path from localStorage
      const redirectPath = localStorage.getItem("redirectPath");
      // Clear redirect path after using it
      if (redirectPath) {
        localStorage.removeItem("redirectPath");
      }
      
      // Redirect to that page, or homepage "/dashboard" if it doesn't exist
      navigate(redirectPath || "/dashboard", { replace: true });
    } catch (err) {
      if (err.message?.includes("403")) {
        setError("No account found for this Google email. Please contact your administrator to get access.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed. Please try again.");
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

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-outline-variant/20"></div>
                <span className="text-outline text-[10px] uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-outline-variant/20"></div>
              </div>

              {/* Google Sign-In */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="368"
                />
              </div>
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
