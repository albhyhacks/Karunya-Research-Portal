import { BrowserRouter, Routes, Route } from "react-router-dom";
import { 
  LandingPage, 
  PapersPage, 
  AuthorsPage, 
  AnalyticsPage, 
  AdminPage, 
  AuthorProfilePage,
  LoginPage
} from "./pages";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/papers" element={<PapersPage />} />
          <Route path="/authors" element={<AuthorsPage />} />
          <Route path="/authors/:id" element={<AuthorProfilePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<PapersPage />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);
};

export default App;
