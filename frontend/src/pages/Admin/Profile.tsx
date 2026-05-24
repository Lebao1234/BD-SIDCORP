import React from 'react';
import UserProfilePage from '../User/Profile';

// Re-using the same profile component since it dynamically handles the role
const AdminProfilePage: React.FC = () => {
  return <UserProfilePage />;
};

export default AdminProfilePage;
