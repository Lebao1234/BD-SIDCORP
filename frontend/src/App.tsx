import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import {AdminDashboard}  from './pages/Admin/Dashboard';
import UserDashboard  from './pages/User/Customer';
import ChatPage from './pages/Chat/ChatPage';
import { ThemeProvider } from './components/ThemeProvider';
import UserProfilePage from './pages/User/Profile';
import AdminProfilePage from './pages/Admin/Profile';
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
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/admin/dashboard" element={
                <PrivateRoute allowedRoles={[ROLE.ADMIN]}>
                  <AdminDashboard />
                </PrivateRoute>
              }/>

              <Route path="/user/dashboard" element={
                <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                  <UserDashboard />
                </PrivateRoute>
              }/>

              <Route path="/chat" element={
                <PrivateRoute allowedRoles={[ROLE.USER, ROLE.ADMIN]}>
                  <ChatPage />
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

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;