// src/components/common/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return <Loader message="Vérification de l'authentification..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Vérifier le rôle si requis
  if (requiredRole) {
    if (role !== requiredRole) {
      // Rediriger vers la bonne page selon le rôle
      if (role === 'admin') {
        return <Navigate to="/admin" replace />;
      }
      if (role === 'proprietaire') {
        return <Navigate to="/proprio" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;