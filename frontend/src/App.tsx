import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import {AdminDashboard}  from './pages/Admin/Dashboard';
import UserDashboard  from './pages/User/Customer';

// Guard chuyển hướng theo role
const PrivateRoute = ({ children, allowedRoles }: { 
  children: React.ReactNode, 
  allowedRoles: string[] 
}) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/admin/dashboard" element={
              <PrivateRoute allowedRoles={['admin', 'ADMIN']}>
                <AdminDashboard />
              </PrivateRoute>
            }/>

            <Route path="/user/dashboard" element={
              <PrivateRoute allowedRoles={['user']}>
                <UserDashboard />
              </PrivateRoute>
            }/>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;