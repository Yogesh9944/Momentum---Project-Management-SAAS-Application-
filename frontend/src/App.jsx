import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import KanbanPage from './pages/KanbanPage';
import ProjectsPage from './pages/ProjectsPage';
import MyTasksPage from './pages/MyTasksPage';

const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--ink)', flexDirection: 'column', gap: 16 }}>
    <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #7B5EA7, #06B6D4)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'white' }}>M</div>
    <div className="spinner" />
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/auth" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
    <Route path="/workspace/:workspaceId" element={<PrivateRoute><WorkspacePage /></PrivateRoute>} />
    <Route path="/workspace/:workspaceId/projects" element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
    <Route path="/workspace/:workspaceId/project/:projectId/board" element={<PrivateRoute><KanbanPage /></PrivateRoute>} />
    <Route path="/my-tasks" element={<PrivateRoute><MyTasksPage /></PrivateRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
