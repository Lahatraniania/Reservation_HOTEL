import apiClient from './apiClient';

export const hotelService = {
  // ============================================================
  // LECTURE
  // ============================================================

  // Récupérer tous les hôtels (avec filtres)
  getAll: async (params = {}) => {
    const response = await apiClient.get('/hotels/', { params });
    return response.data;
  },

  // ✅ Récupérer les 8 hôtels les plus populaires (page d'accueil)
  getPopulaires: async () => {
    const response = await apiClient.get('/hotels/populaires/');
    return response.data;
  },

  // ✅ Récupérer les 4 hôtels les plus récents (page d'accueil)
  getRecent: async () => {
    const response = await apiClient.get('/hotels/recents/');
    return response.data;
  },

  // Récupérer un hôtel par ID
  getById: async (id) => {
    const response = await apiClient.get(`/hotels/${id}/`);
    return response.data;
  },

  // Récupérer les hôtels du propriétaire connecté
  getByProprietaire: async () => {
    const response = await apiClient.get('/hotels/', {
      params: { mine: 'true' }
    });
    return response.data;
  },

  // Récupérer les chambres d'un hôtel
  getRooms: async (hotelId) => {
    const response = await apiClient.get(`/hotels/${hotelId}/chambres/`);
    return response.data;
  },

  // Vérifier la disponibilité d'un hôtel
  checkAvailability: async (hotelId) => {
    const response = await apiClient.get(`/hotels/${hotelId}/disponible/`);
    return response.data;
  },

  // ============================================================
  // ✅ HELPER : Construire un FormData propre à partir d'un objet
  // ============================================================
  _buildFormData: (hotelData) => {
    const formData = new FormData();

    Object.keys(hotelData).forEach(key => {
      const value = hotelData[key];

      // Ignorer les valeurs null/undefined
      if (value === null || value === undefined) return;

      // ✅ Photo principale (fichier unique)
      if (key === 'photo_principale') {
        if (value instanceof File) {
          formData.append('photo_principale', value);
        }
        return;
      }

      // ✅ Photos supplémentaires (tableau de fichiers)
      if (key === 'photos_supplementaires') {
        if (Array.isArray(value)) {
          value.forEach(file => {
            if (file instanceof File) {
              formData.append('photos_supplementaires', file);
            }
          });
        } else if (value instanceof File) {
          formData.append('photos_supplementaires', value);
        }
        return;
      }

      // ✅ Photos supplémentaires existantes (URLs JSON)
      if (key === 'photos_supplementaires_existing') {
        if (Array.isArray(value) && value.length > 0) {
          formData.append('photos_supplementaires_existing', JSON.stringify(value));
        }
        return;
      }

      // ✅ Booléens (conversion en string)
      if (typeof value === 'boolean') {
        formData.append(key, value.toString());
        return;
      }

      // ✅ Objets (JSON stringify)
      if (typeof value === 'object' && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
        return;
      }

      // ✅ Valeurs simples
      formData.append(key, value);
    });

    return formData;
  },

  // ============================================================
  // ÉCRITURE
  // ============================================================

  // ✅ Créer un hôtel (accepte FormData OU objet)
  create: async (hotelData) => {
    const formData = new FormData();

    if (hotelData instanceof FormData) {
      // Déjà un FormData, on l'utilise directement
      return await apiClient.post('/hotels/', hotelData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(res => res.data);
    }

    // Sinon, on construit le FormData
    Object.keys(hotelData).forEach(key => {
      const value = hotelData[key];

      if (value === null || value === undefined) return;

      if (key === 'photo_principale' && value instanceof File) {
        formData.append('photo_principale', value);
      } else if (key === 'photos_supplementaires' && Array.isArray(value)) {
        value.forEach(file => {
          if (file instanceof File) {
            formData.append('photos_supplementaires', file);
          }
        });
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? 'true' : 'false');
      } else {
        formData.append(key, value);
      }
    });

    const response = await apiClient.post('/hotels/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // ✅ Modifier un hôtel avec photos supplémentaires
  update: async (id, hotelData) => {
    const formData = new FormData();

    if (hotelData instanceof FormData) {
      // Déjà un FormData
      const response = await apiClient.put(`/hotels/${id}/`, hotelData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }

    // Sinon, on construit le FormData
    Object.keys(hotelData).forEach(key => {
      const value = hotelData[key];

      if (value === null || value === undefined) return;

      if (key === 'photo_principale' && value instanceof File) {
        formData.append('photo_principale', value);
      } else if (key === 'photos_supplementaires' && Array.isArray(value)) {
        value.forEach(file => {
          if (file instanceof File) {
            formData.append('photos_supplementaires', file);
          }
        });
      } else if (key === 'photos_supplementaires_existing' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? 'true' : 'false');
      } else {
        formData.append(key, value);
      }
    });

    const response = await apiClient.put(`/hotels/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // ✅ Modification partielle (utile pour toggle est_actif/est_visible)
  partialUpdate: async (id, hotelData) => {
    let formData;

    if (hotelData instanceof FormData) {
      formData = hotelData;
    } else {
      formData = hotelService._buildFormData(hotelData);
    }

    const response = await apiClient.patch(`/hotels/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Supprimer un hôtel
  delete: async (id) => {
    const response = await apiClient.delete(`/hotels/${id}/`);
    return response.data;
  },

  // ============================================================
  // ✅ ACTIONS SPÉCIALES
  // ============================================================

  // Activer/Désactiver un hôtel
  toggleActif: async (id, estActif) => {
    const response = await apiClient.patch(`/hotels/${id}/`, {
      est_actif: estActif
    });
    return response.data;
  },

  // Activer/Désactiver la visibilité
  toggleVisible: async (id, estVisible) => {
    const response = await apiClient.patch(`/hotels/${id}/`, {
      est_visible: estVisible
    });
    return response.data;
  },

  // ✅ Ajouter des photos supplémentaires à un hôtel existant
  addPhotos: async (id, files) => {
    const formData = new FormData();
    files.forEach(file => {
      if (file instanceof File) {
        formData.append('photos_supplementaires', file);
      }
    });

    const response = await apiClient.patch(`/hotels/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};