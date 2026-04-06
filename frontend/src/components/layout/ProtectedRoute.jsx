import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * A wrapper component that checks for authentication and optional role requirements
 * before granting access to its child routes.
 */
const ProtectedRoute = ({ requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If there's no active session, boot them back to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If a specific role is required (e.g., admin) and user doesn't have it
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authorized, render the child routes (e.g., DashboardLayout and AdminPage)
  return <Outlet />;
};

export default ProtectedRoute;
