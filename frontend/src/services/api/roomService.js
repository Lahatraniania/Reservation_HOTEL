import apiClient from './apiClient';

export const roomService = {
  // Récupérer toutes les chambres
  getAll: async (params = {}) => {
    const response = await apiClient.get('/chambres/', { params });
    return response.data;
  },

  // Récupérer les chambres d'un hôtel
  getByHotel: async (hotelId) => {
    const response = await apiClient.get('/chambres/', {
      params: { hotel: hotelId }
    });
    return response.data;
  },

  // ✅ Récupérer les 12 chambres disponibles (page d'accueil)
  getAvailable: async () => {
    const response = await apiClient.get('/chambres/disponibles/');
    return response.data;
  },

  // Récupérer les chambres récentes
  getRecent: async () => {
    const response = await apiClient.get('/chambres/recentes/');
    return response.data;
  },

  // Récupérer une chambre par ID
  getById: async (id) => {
    const response = await apiClient.get(`/chambres/${id}/`);
    return response.data;
  },

  // ✅ Vérifier la disponibilité pour une période donnée
  checkDisponibilite: async (id, dateDebut, dateFin) => {
    const response = await apiClient.get(`/chambres/${id}/disponibilite/`, {
      params: { date_debut: dateDebut, date_fin: dateFin }
    });
    return response.data;
  },

  // ✅ Rechercher des chambres disponibles sur une période
  searchByDates: async (dateDebut, dateFin) => {
    const response = await apiClient.get('/chambres/', {
      params: { date_debut: dateDebut, date_fin: dateFin }
    });
    return response.data;
  },

  // Créer une chambre (FormData ou objet)
  create: async (roomData) => {
    let formData;

    if (roomData instanceof FormData) {
      formData = roomData;
    } else {
      formData = new FormData();
      Object.keys(roomData).forEach(key => {
        if (roomData[key] !== null && roomData[key] !== undefined) {
          if (key === 'photo_principale' && roomData[key] instanceof File) {
            formData.append('photo_principale', roomData[key]);
          } else if (key === 'equipements' && Array.isArray(roomData[key])) {
            formData.append('equipements', JSON.stringify(roomData[key]));
          } else {
            formData.append(key, roomData[key]);
          }
        }
      });
    }

    const response = await apiClient.post('/chambres/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Modifier une chambre
  update: async (id, roomData) => {
    let formData;

    if (roomData instanceof FormData) {
      formData = roomData;
    } else {
      formData = new FormData();
      Object.keys(roomData).forEach(key => {
        if (roomData[key] !== null && roomData[key] !== undefined) {
          if (key === 'photo_principale' && roomData[key] instanceof File) {
            formData.append('photo_principale', roomData[key]);
          } else if (key === 'equipements' && Array.isArray(roomData[key])) {
            formData.append('equipements', JSON.stringify(roomData[key]));
          } else {
            formData.append(key, roomData[key]);
          }
        }
      });
    }

    const response = await apiClient.put(`/chambres/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Supprimer une chambre
  delete: async (id) => {
    const response = await apiClient.delete(`/chambres/${id}/`);
    return response.data;
  }
};