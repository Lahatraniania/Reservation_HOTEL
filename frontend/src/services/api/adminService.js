import apiClient from './apiClient';

export const adminService = {
  // Récupérer les statistiques des commissions
  getCommissionStats: async () => {
    const response = await apiClient.get('/commissions/stats/');
    return response.data;
  },

  // Récupérer toutes les commissions
  getCommissions: async () => {
    const response = await apiClient.get('/commissions/');
    return response.data;
  },

  // ✅ NOUVEAU : Marquer une commission comme payée
  marquerCommissionPayee: async (id) => {
    const response = await apiClient.post(`/commissions/${id}/marquer_payee/`);
    return response.data;
  },

  // ✅ NOUVEAU : Marquer toutes les commissions comme payées
  marquerToutesCommissionsPayees: async () => {
    const response = await apiClient.post('/commissions/marquer_toutes_payees/');
    return response.data;
  },

  // Récupérer tous les hôtels (admin)
  getAllHotels: async () => {
    const response = await apiClient.get('/hotels/');
    return response.data;
  },

  // Récupérer tous les clients
  getAllClients: async () => {
    const response = await apiClient.get('/clients/');
    return response.data;
  }
};