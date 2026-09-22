import apiClient from './apiClient';

export const reservationService = {
  // Créer une réservation (client)
  create: async (reservationData) => {
    const response = await apiClient.post('/reservations/', reservationData);
    return response.data;
  },

  // Récupérer toutes les réservations (client/propriétaire/admin)
  getAll: async () => {
    const response = await apiClient.get('/reservations/');
    return response.data;
  },

  // Récupérer une réservation par ID
  getById: async (id) => {
    const response = await apiClient.get(`/reservations/${id}/`);
    return response.data;
  },

  // Valider une réservation (propriétaire)
  validate: async (id) => {
    const response = await apiClient.post(`/reservations/${id}/valider/`);
    return response.data;
  },

  // Refuser une réservation (propriétaire)
  reject: async (id) => {
    const response = await apiClient.post(`/reservations/${id}/refuser/`);
    return response.data;
  },

  // Annuler une réservation (client)
  cancel: async (id) => {
    const response = await apiClient.delete(`/reservations/${id}/`);
    return response.data;
  }
};