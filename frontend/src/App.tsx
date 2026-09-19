import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './components/ThemeProvider';
import { GlobalToast } from './components/GlobalToast';
import { RouteFallback } from './components/RouteFallback';
import { ROLE } from './constants/roles';

/*
 * Mỗi màn hình là một chunk riêng, tải khi người dùng thực sự đi tới đó.
 *
 * Trước đây cả 15 trang đều import tĩnh ở đây, nên chỉ để hiện ô đăng nhập
 * trình duyệt đã phải tải xong mã của Chat, Lịch, Email, Báo cáo, cộng toàn bộ
 * thư viện mà những trang đó kéo theo. Gói JavaScript đầu tiên vì thế là
 * khoảng 2.1MB cho một màn hình chỉ có hai ô nhập liệu.
 *
 * Hai trang xác thực để import tĩnh: chúng chính là màn hình đầu tiên người
 * dùng nhìn thấy, tách ra chỉ thêm một vòng tải mạng.
 */
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';

const AdminDashboard     = lazy(() => import('./pages/Admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const UserDashboard      = lazy(() => import('./pages/User/Customer'));
const ChatPage           = lazy(() => import('./pages/Chat/ChatPage'));
const TasksPage          = lazy(() => import('./pages/Tasks/TasksPage'));
const UserProfilePage    = lazy(() => import('./pages/User/Profile'));
const AdminProfilePage   = lazy(() => import('./pages/Admin/Profile'));
const ReportDashboard    = lazy(() => import('./components/reports/ReportDashboard').then(m => ({ default: m.ReportDashboard })));
const SettingsPage       = lazy(() => import('./pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ResourceHubPage    = lazy(() => import('./pages/Resources/ResourceHubPage').then(m => ({ default: m.ResourceHubPage })));
const NotesPage          = lazy(() => import('./pages/Notes/NotesPage'));
const NotificationsPage  = lazy(() => import('./pages/Notifications/NotificationsPage'));
const CalendarPage       = lazy(() => import('./pages/Calendar/CalendarPage'));
const MarketingEmailPage = lazy(() => import('./pages/Emails/MarketingEmailPage'));

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
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>

          {/* Global toast hiện trên mọi trang */}
          <GlobalToast />
          </SidebarProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;