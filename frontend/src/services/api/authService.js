import apiClient from './apiClient';

export const authService = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register/', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login/', credentials);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },

  createClient: async (clientData) => {
    const response = await apiClient.post('/clients/', clientData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  },

  refreshToken: async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error('No refresh token');
    const response = await apiClient.post('/auth/refresh/', { refresh });
    localStorage.setItem('access_token', response.data.access);
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // ✅ Récupérer le rôle depuis le token
  getUserRole: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return 'client';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Token payload:', payload);
      return payload.role || 'client';
    } catch (e) {
      console.error('Erreur décodage token:', e);
      return 'client';
    }
  },

  getUserId: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id;
    } catch {
      return null;
    }
  },

  getUserInfo: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        user_id: payload.user_id,
        username: payload.username,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role: payload.role || 'client',
      };
    } catch {
      return null;
    }
  },
};