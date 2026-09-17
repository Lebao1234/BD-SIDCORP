import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SidebarProvider } from './context/SidebarContext';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { AdminDashboard } from './pages/Admin/Dashboard';
import UserDashboard from './pages/User/Customer';
import ChatPage from './pages/Chat/ChatPage';
import TasksPage from './pages/Tasks/TasksPage';
import { ThemeProvider } from './components/ThemeProvider';
import UserProfilePage from './pages/User/Profile';
import AdminProfilePage from './pages/Admin/Profile';
import { ReportDashboard } from './components/reports/ReportDashboard';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { ResourceHubPage } from './pages/Resources/ResourceHubPage';
import NotesPage from './pages/Notes/NotesPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import MarketingEmailPage from './pages/Emails/MarketingEmailPage';
import { GlobalToast } from './components/GlobalToast';
import { ROLE } from './constants/roles';

// Guard chuyển hướng theo role
const PrivateRoute = ({ children, allowedRoles }: { 
  children: React.ReactNode, 
  allowedRoles: string[] 
}) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role.toLowerCase())) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <SidebarProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Trang chủ Root '/' & '/dashboard' hiển thị trực tiếp ReportDashboard */}
            <Route path="/" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <ReportDashboard />
              </PrivateRoute>
            }/>

            <Route path="/dashboard" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <ReportDashboard />
              </PrivateRoute>
            }/>

            <Route path="/admin/dashboard" element={
              <PrivateRoute allowedRoles={[ROLE.ADMIN]}>
                <AdminDashboard />
              </PrivateRoute>
            }/>

            <Route path="/customers" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <UserDashboard />
              </PrivateRoute>
            }/>

            <Route path="/tasks" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <TasksPage />
              </PrivateRoute>
            }/>

            <Route path="/resources" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <ResourceHubPage />
              </PrivateRoute>
            }/>

            <Route path="/chat" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <ChatPage />
              </PrivateRoute>
            }/>

            <Route path="/reports" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <ReportDashboard />
              </PrivateRoute>
            }/>

            <Route path="/calendar" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <CalendarPage />
              </PrivateRoute>
            }/>

            <Route path="/notes" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <NotesPage />
              </PrivateRoute>
            }/>

            <Route path="/notifications" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <NotificationsPage />
              </PrivateRoute>
            }/>

            <Route path="/emails" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <MarketingEmailPage />
              </PrivateRoute>
            }/>

            <Route path="/settings" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <SettingsPage />
              </PrivateRoute>
            }/>

            <Route path="/user/profile" element={
              <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                <UserProfilePage />
              </PrivateRoute>
            }/>

            <Route path="/admin/profile" element={
              <PrivateRoute allowedRoles={[ROLE.ADMIN]}>
                <AdminProfilePage />
              </PrivateRoute>
            }/>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global toast hiện trên mọi trang */}
          <GlobalToast />
          </SidebarProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;