import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Hotel, Users, CreditCard,
  CheckCircle, XCircle, RefreshCw,
  TrendingUp, Store
} from 'lucide-react';
import { adminService } from '../../services/api/adminService';
import { demandeService } from '../../services/api/demandeService';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const DashboardAdminPage = () => {
  const [demandes, setDemandes] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [demandesData, commissionsData, statsData] = await Promise.all([
        demandeService.getAll(),
        adminService.getCommissions(),
        adminService.getCommissionStats(),
      ]);
      setDemandes(demandesData.results || demandesData || []);
      setCommissions(commissionsData.results || commissionsData || []);
      setStats(statsData || {});
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateDemande = async (id) => {
    try {
      await demandeService.validate(id);
      toast.success('Demande validée !');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleRejectDemande = async (id) => {
    try {
      await demandeService.reject(id);
      toast.success('Demande refusée');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors du refus');
    }
  };

  if (loading) return <Loader message="Chargement du tableau de bord admin..." />;

  const pendingDemandes = demandes.filter(d => d.statut === 'EN_ATTENTE');
  const totalCommissions = commissions.reduce((acc, c) => acc + parseFloat(c.montant || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-600" />
            Dashboard Administrateur
          </h1>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <Hotel className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold">{stats.total_hotels || 0}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">Hôtels total</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <Store className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold">{pendingDemandes.length}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">Demandes en attente</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold">{stats.total_clients || 0}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">Clients</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <CreditCard className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold">{totalCommissions.toLocaleString()} Ar</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">Commissions totales</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold">{stats.en_attente || 0}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">En attente</p>
          </div>
        </div>

        {/* Demandes en attente */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-500" />
              Demandes de placement d'hôtel
              {pendingDemandes.length > 0 && (
                <span className="ml-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  {pendingDemandes.length} en attente
                </span>
              )}
            </h2>
            <Link to="/admin/demandes" className="text-sm text-blue-600 hover:underline">
              Voir toutes →
            </Link>
          </div>

          {pendingDemandes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune demande en attente</p>
          ) : (
            <div className="space-y-4">
              {pendingDemandes.slice(0, 5).map((demande) => (
                <div key={demande.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* ✅ Image + Infos */}
                    <div className="flex gap-3 flex-1">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {demande.hotel_photo || demande.hotel_photo_url ? (
                          <img
                            src={demande.hotel_photo || demande.hotel_photo_url}
                            alt={demande.hotel_nom}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
                            <Store className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-lg flex items-center gap-2">
                          {demande.hotel_nom}
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                            En attente
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">{demande.hotel_ville}</p>
                        <p className="text-sm text-gray-500">
                          Propriétaire : {demande.proprietaire_details?.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          Email : {demande.hotel_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleValidateDemande(demande.id)}
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Valider
                      </button>
                      <button
                        onClick={() => handleRejectDemande(demande.id)}
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Refuser
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernières commissions - ✅ SANS #, AVEC IMAGE */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Dernières commissions (1%)
            </h2>
            <Link to="/admin/commissions" className="text-sm text-blue-600 hover:underline">
              Voir toutes →
            </Link>
          </div>

          {commissions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune commission pour le moment</p>
          ) : (
            <div className="space-y-3">
              {commissions.slice(0, 10).map((commission) => {
                const reservation = commission.reservation_details || {};
                const hotel = reservation.hotel_details || reservation.hotel || {};
                const room = reservation.chambre_details || reservation.chambre || {};

                return (
                  <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      {/* ✅ Image de l'hôtel ou de la chambre */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {hotel.photo_principale ? (
                          <img
                            src={hotel.photo_principale}
                            alt={hotel.nom}
                            className="w-full h-full object-cover"
                          />
                        ) : room.photo_principale ? (
                          <img
                            src={room.photo_principale}
                            alt={room.numero}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                            <Hotel className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {hotel.nom || 'Hôtel'} — Chambre {room.numero || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reservation.client_details?.user_details?.username || 'Client'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">
                        {commission.montant?.toLocaleString()} Ar
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(commission.date_creation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAdminPage;