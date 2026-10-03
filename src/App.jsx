import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UploadProvider } from './context/UploadContext';
import { DownloadProvider } from './context/DownloadContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FileManager from './pages/FileManager';
import UploadManager from './pages/UploadManager';
import DownloadManager from './pages/DownloadManager';
import Upgrade from './pages/Upgrade';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';
import AdminLogs from './pages/admin/AdminLogs';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';
import './styles/index.css';
import './styles/pages.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner spinner-lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_active) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner spinner-lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/files" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner spinner-lg" /></div>;
  if (user) return <Navigate to="/files" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <UploadProvider>
            <DownloadProvider>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

                {/* User */}
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/files" element={<FileManager />} />
                  <Route path="/files/:folderId" element={<FileManager />} />
                  <Route path="/upload-manager" element={<UploadManager />} />
                  <Route path="/download-manager" element={<DownloadManager />} />
                  <Route path="/upgrade" element={<Upgrade />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* Redirect old dashboard to files */}
                  <Route path="/dashboard" element={<Navigate to="/files" replace />} />
                </Route>

                {/* Admin */}
                <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/payments" element={<AdminPayments />} />
                  <Route path="/admin/logs" element={<AdminLogs />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DownloadProvider>
          </UploadProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
