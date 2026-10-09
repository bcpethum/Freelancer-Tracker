import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo">💼</div>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="projects" element={<Projects />} />
      <Route path="clients" element={<Clients />} />
      <Route path="payments" element={<Payments />} />
      <Route path="reports" element={<Reports />} />
      <Route path="profile" element={<Profile />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#16161f',
              color: '#f0f0f8',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' }
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
