import apiClient from './apiClient';

export const demandeService = {
  // Créer une demande de placement (propriétaire)
  create: async (demandeData) => {
    const response = await apiClient.post('/demandes-placement/', demandeData);
    return response.data;
  },

  // Récupérer toutes les demandes (admin)
  getAll: async () => {
    const response = await apiClient.get('/demandes-placement/');
    return response.data;
  },

  // Récupérer une demande par ID
  getById: async (id) => {
    const response = await apiClient.get(`/demandes-placement/${id}/`);
    return response.data;
  },

  // Valider une demande (admin)
  validate: async (id) => {
    const response = await apiClient.post(`/demandes-placement/${id}/valider/`);
    return response.data;
  },

  // Refuser une demande (admin)
  reject: async (id) => {
    const response = await apiClient.post(`/demandes-placement/${id}/refuser/`);
    return response.data;
  }
};