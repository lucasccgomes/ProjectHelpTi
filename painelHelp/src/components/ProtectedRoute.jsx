//ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, currentUserRole } = useAuth();

  if (loading) {
    return <div><LoadingSpinner/></div>;
}

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUserRole)) {
    return <Navigate to="/nopermission" />;
  }

  return children;
};

export default ProtectedRoute;
