import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel, Bed, Calendar,
  XCircle, Plus, Settings, Store,
  ArrowRight, RefreshCw, Clock,
  DollarSign, CheckCircle
} from 'lucide-react';
import { hotelService } from '../../services/api/hotelService';
import { reservationService } from '../../services/api/reservationService';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const DashboardProprioPage = () => {
  const [hotels, setHotels] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalRooms: 0,
    totalReservations: 0,
    pendingReservations: 0,
    totalRevenueNet: 0,
    totalCommission: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const hotelsData = await hotelService.getByProprietaire();
      const myHotels = hotelsData.results || hotelsData || [];

      let reservationsData = { results: [] };
      try {
        reservationsData = await reservationService.getAll();
      } catch (e) {
        console.log('Pas de réservations');
      }
      const allReservations = reservationsData.results || reservationsData || [];

      const myHotelIds = myHotels.map(h => h.id);
      const myReservations = allReservations.filter(r => {
        const hotelId = r.hotel || r.hotel_details?.id;
        return myHotelIds.includes(hotelId);
      });

      setHotels(myHotels);
      setReservations(myReservations);

      // ✅ Calcul des revenus NETS (montant_total - commission 1%)
      const totalRooms = myHotels.reduce((acc, h) => acc + (h.nombre_chambres || 0), 0);
      const pendingReservations = myReservations.filter(r => r.statut === 'PAYEE').length;

      const totalRevenueBrut = myReservations
        .filter(r => r.statut === 'CONFIRMEE' || r.statut === 'PAYEE')
        .reduce((acc, r) => acc + parseFloat(r.montant_total || 0), 0);

      const totalCommission = myReservations
        .filter(r => r.statut === 'CONFIRMEE' || r.statut === 'PAYEE')
        .reduce((acc, r) => acc + parseFloat(r.commission_admin || 0), 0);

      // ✅ Revenus NETS = Brut - Commission
      const totalRevenueNet = totalRevenueBrut - totalCommission;

      setStats({
        totalHotels: myHotels.length,
        totalRooms,
        totalReservations: myReservations.length,
        pendingReservations,
        totalRevenueNet,
        totalCommission,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateReservation = async (id) => {
    try {
      await reservationService.validate(id);
      toast.success('Réservation validée !');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleRejectReservation = async (id) => {
    try {
      await reservationService.reject(id);
      toast.success('Réservation refusée');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors du refus');
    }
  };

  if (loading) return <Loader message="Chargement du tableau de bord..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-8 h-8 text-blue-600" />
            Dashboard Propriétaire
          </h1>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <Link
              to="/proprio/hotel/new"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-4 h-4" />
              Nouvel hôtel
            </Link>
          </div>
        </div>

        {/* ✅ Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <Hotel className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold">{stats.totalHotels}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">Hôtels</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <Bed className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold">{stats.totalRooms}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">Chambres</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <Calendar className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold">{stats.totalReservations}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">Réservations</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <Clock className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold">{stats.pendingReservations}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">En attente</p>
          </div>
          {/* ✅ Revenus NETS */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <DollarSign className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold">{stats.totalRevenueNet.toLocaleString()} Ar</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">Revenus nets</p>
            <p className="text-xs text-gray-400">Après commission 1%</p>
          </div>
        </div>

        {/* ✅ Info commission */}
        {stats.totalCommission > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-700">
              💡 <strong>Commission plateforme :</strong> {stats.totalCommission.toLocaleString()} Ar (1% des réservations)
            </p>
          </div>
        )}

        {/* Réservations en attente */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Réservations en attente de validation
            {stats.pendingReservations > 0 && (
              <span className="ml-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                {stats.pendingReservations}
              </span>
            )}
          </h2>
          {stats.pendingReservations === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune réservation en attente</p>
          ) : (
            <div className="space-y-4">
              {reservations
                .filter(r => r.statut === 'PAYEE')
                .map((res) => {
                  const room = res.chambre_details || res.chambre || {};
                  const hotel = res.hotel_details || res.hotel || {};
                  const client = res.client_details || res.client || {};

                  return (
                    <div key={res.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* ✅ Image + Infos */}
                        <div className="flex gap-3 flex-1">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {room.photo_principale ? (
                              <img
                                src={room.photo_principale}
                                alt={`Chambre ${room.numero}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
                                <Bed className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              {hotel.nom || 'Hôtel'} — Chambre {room.numero || 'N/A'}
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                En attente
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Client : {client.user_details?.username || client.user?.username || 'Client'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Du {res.date_debut} au {res.date_fin} — {res.nombre_nuits} nuits
                            </p>
                            <p className="text-sm font-bold text-green-600">
                              {res.montant_total?.toLocaleString()} Ar
                              <span className="text-xs text-gray-400 ml-2">
                                (dont {res.commission_admin?.toLocaleString()} Ar commission)
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleValidateReservation(res.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Valider
                          </button>
                          <button
                            onClick={() => handleRejectReservation(res.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                          >
                            <XCircle className="w-4 h-4" />
                            Refuser
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Mes hôtels */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-blue-600" />
              Mes hôtels
              {hotels.length > 0 && (
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {hotels.length}
                </span>
              )}
            </h2>
            <Link to="/proprio/hotel/new" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Ajouter
            </Link>
          </div>

          {hotels.length === 0 ? (
            <div className="text-center py-8">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Vous n'avez pas encore d'hôtel</p>
              <Link
                to="/proprio/hotel/new"
                className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Créer votre premier hôtel
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      {hotel.photo_principale ? (
                        <img src={hotel.photo_principale} alt={hotel.nom} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-2xl font-bold">
                          {hotel.nom?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{hotel.nom}</h3>
                      <p className="text-sm text-gray-600">{hotel.ville}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Bed className="w-3 h-3" />
                          {hotel.nombre_chambres || 0} chambres
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${hotel.est_actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                          {hotel.est_actif ? '✓ Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/proprio/hotel/${hotel.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardProprioPage;