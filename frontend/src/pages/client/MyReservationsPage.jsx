import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservationService } from '../../services/api/reservationService';
import {
  Calendar, Bed, Hotel, CheckCircle, XCircle,
  Clock, AlertCircle, RefreshCw, ArrowRight,
  Eye, CreditCard, MapPin, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import ConfirmModal from '../../components/common/ConfirmModal';

const MyReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // ✅ État de la modal d'annulation
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    reservationId: null,
    loading: false,
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await reservationService.getAll();
      const list = data.results || data || [];
      setReservations(list);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'EN_ATTENTE': { label: 'En attente de paiement', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'PAYEE': { label: 'Payée - En attente de validation', color: 'bg-blue-100 text-blue-700', icon: CreditCard },
      'CONFIRMEE': { label: 'Confirmée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'REFUSEE': { label: 'Refusée', color: 'bg-red-100 text-red-700', icon: XCircle },
      'ANNULEE': { label: 'Annulée', color: 'bg-gray-100 text-gray-700', icon: XCircle },
      'EXPIREE': { label: 'Expirée', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
    };
    return statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
  };

  const getRoomInfo = (res) => res.chambre_details || res.chambre || {};
  const getHotelInfo = (res) => res.hotel_details || res.hotel || {};

  // ✅ Ouvrir la modal
  const handleOpenCancelModal = (reservationId) => {
    setCancelModal({ isOpen: true, reservationId, loading: false });
  };

  // ✅ Confirmer l'annulation
  const handleConfirmCancel = async () => {
    setCancelModal(prev => ({ ...prev, loading: true }));
    try {
      await reservationService.cancel(cancelModal.reservationId);
      toast.success('Réservation annulée avec succès');
      fetchReservations();
      setCancelModal({ isOpen: false, reservationId: null, loading: false });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'annulation');
      setCancelModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (filter === 'all') return true;
    return r.statut === filter;
  });

  if (loading) return <Loader message="Chargement de vos réservations..." />;

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.statut === 'CONFIRMEE').length,
    pending: reservations.filter(r => r.statut === 'PAYEE' || r.statut === 'EN_ATTENTE').length,
    cancelled: reservations.filter(r => r.statut === 'ANNULEE' || r.statut === 'REFUSEE').length,
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              Mes réservations
            </h1>
            <button
              onClick={fetchReservations}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-xl shadow p-4 text-center transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white hover:shadow-md'
                }`}
            >
              <div className={`text-2xl font-bold ${filter === 'all' ? 'text-white' : 'text-blue-600'}`}>
                {stats.total}
              </div>
              <p className={`text-sm ${filter === 'all' ? 'text-blue-100' : 'text-gray-600'}`}>Total</p>
            </button>
            <button
              onClick={() => setFilter('CONFIRMEE')}
              className={`rounded-xl shadow p-4 text-center transition ${filter === 'CONFIRMEE' ? 'bg-green-600 text-white' : 'bg-white hover:shadow-md'
                }`}
            >
              <div className={`text-2xl font-bold ${filter === 'CONFIRMEE' ? 'text-white' : 'text-green-600'}`}>
                {stats.confirmed}
              </div>
              <p className={`text-sm ${filter === 'CONFIRMEE' ? 'text-green-100' : 'text-gray-600'}`}>Confirmées</p>
            </button>
            <button
              onClick={() => setFilter('PAYEE')}
              className={`rounded-xl shadow p-4 text-center transition ${filter === 'PAYEE' ? 'bg-orange-600 text-white' : 'bg-white hover:shadow-md'
                }`}
            >
              <div className={`text-2xl font-bold ${filter === 'PAYEE' ? 'text-white' : 'text-orange-600'}`}>
                {stats.pending}
              </div>
              <p className={`text-sm ${filter === 'PAYEE' ? 'text-orange-100' : 'text-gray-600'}`}>En attente</p>
            </button>
            <button
              onClick={() => setFilter('ANNULEE')}
              className={`rounded-xl shadow p-4 text-center transition ${filter === 'ANNULEE' ? 'bg-red-600 text-white' : 'bg-white hover:shadow-md'
                }`}
            >
              <div className={`text-2xl font-bold ${filter === 'ANNULEE' ? 'text-white' : 'text-red-600'}`}>
                {stats.cancelled}
              </div>
              <p className={`text-sm ${filter === 'ANNULEE' ? 'text-red-100' : 'text-gray-600'}`}>Annulées</p>
            </button>
          </div>

          {/* Liste */}
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">Aucune réservation</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' ? "Vous n'avez pas encore effectué de réservation" : "Aucune réservation pour ce filtre"}
              </p>
              <Link
                to="/chambres"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Réserver maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((res) => {
                const statusInfo = getStatusBadge(res.statut);
                const StatusIcon = statusInfo.icon;
                const room = getRoomInfo(res);
                const hotel = getHotelInfo(res);

                return (
                  <div key={res.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      {/* IMAGE */}
                      <div className="md:w-48 h-48 md:h-auto bg-gradient-to-br from-blue-500 to-purple-500 relative flex-shrink-0">
                        {room.photo_principale ? (
                          <img
                            src={room.photo_principale}
                            alt={`Chambre ${room.numero}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Bed className="w-16 h-16 text-white/60" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
                          Chambre {room.numero || 'N/A'}
                        </span>
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                Réservation N°{res.id}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <Hotel className="w-4 h-4 text-blue-600" />
                                <strong>{hotel.nom || 'Hôtel'}</strong>
                              </p>
                              <p className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {hotel.ville || 'N/A'}
                              </p>
                              <p className="flex items-center gap-2">
                                <Bed className="w-4 h-4 text-gray-400" />
                                {room.type || 'Standard'} • {room.capacite || 2} pers.
                              </p>
                              <p className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                {res.nombre_nuits} nuit{res.nombre_nuits > 1 ? 's' : ''}
                              </p>
                              <p className="flex items-center gap-2 col-span-full">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                Du <strong>{res.date_debut}</strong> au <strong>{res.date_fin}</strong>
                              </p>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4">
                              <span className="text-xl font-bold text-green-600">
                                {res.montant_total?.toLocaleString()} Ar
                              </span>
                              <span className="text-xs text-gray-400">
                                (dont {res.commission_admin?.toLocaleString()} Ar de commission)
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {res.statut === 'EN_ATTENTE' && (
                              <Link
                                to={`/payment/${res.id}`}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm whitespace-nowrap"
                              >
                                <CreditCard className="w-4 h-4" />
                                Payer
                              </Link>
                            )}
                            {room.id && (
                              <Link
                                to={`/chambres/${room.id}`}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm whitespace-nowrap"
                              >
                                <Eye className="w-4 h-4" />
                                Voir la chambre
                              </Link>
                            )}
                            {(res.statut === 'EN_ATTENTE' || res.statut === 'PAYEE') && (
                              <button
                                onClick={() => handleOpenCancelModal(res.id)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm whitespace-nowrap"
                              >
                                <XCircle className="w-4 h-4" />
                                Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL D'ANNULATION */}
      <ConfirmModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, reservationId: null, loading: false })}
        onConfirm={handleConfirmCancel}
        title="Annuler cette réservation ?"
        message="Cette action est irréversible. Le remboursement suivra les conditions générales de la plateforme."
        details="⚠️ Si la réservation était payée, le remboursement sera traité sous 5 à 10 jours ouvrés."
        confirmText="Oui, annuler"
        cancelText="Non, garder"
        type="cancel"
        loading={cancelModal.loading}
      />
    </>
  );
};

export default MyReservationsPage;