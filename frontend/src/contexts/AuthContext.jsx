import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/api/authService';
import { notificationService } from '../services/api/notificationService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getAll();
      const list = data.results || data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.est_lue).length);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      const userInfo = authService.getUserInfo();
      const userRole = authService.getUserRole();
      setUser(userInfo);
      setRole(userRole || 'client');
      fetchNotifications();
    }
    setLoading(false);
  }, [fetchNotifications]);

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      setIsAuthenticated(true);
      const userInfo = authService.getUserInfo();
      const userRole = authService.getUserRole();
      setUser(userInfo);
      setRole(userRole || 'client');
      await fetchNotifications();
      toast.success('Connexion réussie !');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    setNotifications([]);
    setUnreadCount(0);
    toast.success('Déconnexion réussie');
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      toast.success('Inscription réussie ! Vous pouvez vous connecter.');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur d\'inscription');
      throw error;
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, est_lue: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, est_lue: true })));
      setUnreadCount(0);
      toast.success('Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
      return true;
    } catch (error) {
      console.error('Erreur refresh token:', error);
      logout();
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    role,
    notifications,
    unreadCount,
    login,
    logout,
    register,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchNotifications,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};