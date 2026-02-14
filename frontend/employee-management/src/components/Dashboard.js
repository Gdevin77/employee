import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();

  if (isAdmin()) {
    return <AdminDashboard />;
  } else if (isManager()) {
    return <ManagerDashboard />;
  } else if (isEmployee()) {
    return <EmployeeDashboard />;
  }

  return (
    <div>
      <h1>Unauthorized Access</h1>
      <p>You don't have permission to access this page.</p>
    </div>
  );
};

export default Dashboard;
