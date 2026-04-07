import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isLoading, setIsLoading] = useState(true);

  // Load current user profile if token exists
  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/api/auth/me");
      setUser(response);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      // If token is invalid, clear it
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post("/api/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const { access_token, role, full_name } = response;
    localStorage.setItem("authToken", access_token);
    localStorage.setItem("userRole", role);
    setToken(access_token);
    setUser({ email, role, full_name });
    return response;
  };

  const googleAuth = async (credential) => {
    const response = await api.post("/api/auth/google", { credential });
    const { access_token, role, full_name } = response;
    localStorage.setItem("authToken", access_token);
    localStorage.setItem("userRole", role);
    setToken(access_token);
    setUser({ role, full_name });
    return response;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    // Also clear the old adminKey just in case
    localStorage.removeItem("adminKey");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    googleAuth,
    logout,
    isAdmin: user?.role === "admin",
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
