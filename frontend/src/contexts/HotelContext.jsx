import React, { createContext, useState, useContext, useCallback } from 'react';
import { hotelService } from '../services/api/hotelService';
import toast from 'react-hot-toast';

const HotelContext = createContext();

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within HotelProvider');
  }
  return context;
};

export const HotelProvider = ({ children }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  // ✅ Récupérer tous les hôtels
  const fetchHotels = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await hotelService.getAll(params);
      const list = data.results || data || [];
      setHotels(list);
      setTotal(data.count || list.length);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error('Erreur lors du chargement des hôtels');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Récupérer un hôtel par ID
  const fetchHotelById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await hotelService.getById(id);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error('Erreur lors du chargement de l\'hôtel');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Créer un hôtel
  const createHotel = useCallback(async (hotelData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await hotelService.create(hotelData);
      await fetchHotels();
      toast.success('Hôtel créé avec succès !');
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.response?.data?.detail || 'Erreur lors de la création');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHotels]);

  // ✅ Modifier un hôtel
  const updateHotel = useCallback(async (id, hotelData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await hotelService.update(id, hotelData);
      await fetchHotels();
      toast.success('Hôtel mis à jour avec succès !');
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.response?.data?.detail || 'Erreur lors de la mise à jour');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHotels]);

  // ✅ Supprimer un hôtel
  const deleteHotel = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await hotelService.delete(id);
      await fetchHotels();
      toast.success('Hôtel supprimé avec succès !');
    } catch (err) {
      setError(err.message);
      toast.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHotels]);

  // ✅ Récupérer les chambres d'un hôtel
  const fetchHotelRooms = useCallback(async (hotelId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await hotelService.getRooms(hotelId);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Vérifier la disponibilité
  const checkAvailability = useCallback(async (hotelId) => {
    try {
      const data = await hotelService.checkAvailability(hotelId);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    hotels,
    loading,
    error,
    total,
    fetchHotels,
    fetchHotelById,
    fetchHotelRooms,
    createHotel,
    updateHotel,
    deleteHotel,
    checkAvailability,
  };

  return (
    <HotelContext.Provider value={value}>
      {children}
    </HotelContext.Provider>
  );
};