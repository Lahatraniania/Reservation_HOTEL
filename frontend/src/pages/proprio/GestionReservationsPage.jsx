import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservationService } from '../../services/api/reservationService';
import {
  Calendar, Bed, Hotel, CheckCircle, XCircle,
  Clock, AlertCircle, RefreshCw, ArrowLeft,
  Eye, CreditCard, Users, Search, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import ConfirmModal from '../../components/common/ConfirmModal';

const GestionReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // ✅ Modal d'action
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    action: null, // 'valider' | 'refuser'
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
      setReservations(data.results || data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'EN_ATTENTE': { label: 'En attente de paiement', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'PAYEE': { label: 'Payée - En attente de validation', color: 'bg-blue-100 text-blue-700', icon: CreditCard },
      'CONFIRMEE': { label: 'Confirmée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'REFUSEE': { label: 'Refusée', color: 'bg-red-100 text-red-700', icon: XCircle },
      'ANNULEE': { label: 'Annulée', color: 'bg-gray-100 text-gray-700', icon: XCircle },
      'EXPIREE': { label: 'Expirée', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
  };

  // ✅ Ouvrir la modal de validation/refus
  const handleOpenAction = (action, reservationId) => {
    setActionModal({ isOpen: true, action, reservationId, loading: false });
  };

  // ✅ Confirmer l'action
  const handleConfirmAction = async () => {
    setActionModal(prev => ({ ...prev, loading: true }));
    try {
      if (actionModal.action === 'valider') {
        await reservationService.validate(actionModal.reservationId);
        toast.success('Réservation validée ! Commission 1% enregistrée.');
      } else {
        await reservationService.reject(actionModal.reservationId);
        toast.success('Réservation refusée');
      }
      fetchReservations();
      setActionModal({ isOpen: false, action: null, reservationId: null, loading: false });
    } catch (error) {
      toast.error('Erreur lors de l\'action');
      setActionModal(prev => ({ ...prev, loading: false }));
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredReservations = reservations.filter(res => {
    const matchFilter = filter === 'all' || res.statut === filter;
    const matchSearch =
      res.id?.toString().includes(search) ||
      res.client_details?.user_details?.username?.toLowerCase().includes(search.toLowerCase()) ||
      res.hotel_details?.nom?.toLowerCase().includes(search.toLowerCase()) ||
      res.chambre_details?.numero?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <Loader message="Chargement des réservations..." />;

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.statut === 'CONFIRMEE').length,
    pending: reservations.filter(r => r.statut === 'PAYEE').length,
    cancelled: reservations.filter(r => r.statut === 'ANNULEE' || r.statut === 'REFUSEE').length,
    totalRevenue: reservations
      .filter(r => r.statut === 'CONFIRMEE')
      .reduce((acc, r) => acc + parseFloat(r.montant_total || 0), 0),
    totalCommission: reservations
      .filter(r => r.statut === 'CONFIRMEE')
      .reduce((acc, r) => acc + parseFloat(r.commission_admin || 0), 0),
  };

  // ✅ Config selon l'action
  const getActionConfig = () => {
    const configs = {
      valider: {
        title: 'Valider cette réservation ?',
        message: 'Le client sera notifié et la chambre sera marquée comme occupée à ces dates.',
        confirmText: 'Oui, valider',
        cancelText: 'Non, annuler',
        type: 'info',
      },
      refuser: {
        title: 'Refuser cette réservation ?',
        message: 'Le client sera notifié. Le remboursement suivra les conditions générales.',
        confirmText: 'Oui, refuser',
        cancelText: 'Non, garder',
        type: 'danger',
      },
    };
    return configs[actionModal.action] || {};
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              Gestion des réservations
            </h1>
            <div className="flex gap-3">
              <Link
                to="/proprio"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
              <button
                onClick={fetchReservations}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <p className="text-sm text-gray-600">Confirmées</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <p className="text-sm text-gray-600">Annulées</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-700">
                {stats.totalRevenue.toLocaleString()} Ar
              </div>
              <p className="text-sm text-gray-600">Revenus</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalCommission.toLocaleString()} Ar
              </div>
              <p className="text-sm text-gray-600">Commission (1%)</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une réservation (ID, client, hôtel, chambre)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'PAYEE', 'CONFIRMEE', 'REFUSEE', 'ANNULEE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {status === 'all' ? 'Tous' :
                      status === 'PAYEE' ? '⏳ En attente' :
                        status === 'CONFIRMEE' ? '✅ Confirmées' :
                          status === 'REFUSEE' ? '❌ Refusées' : '🗑️ Annulées'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">Aucune réservation</h3>
              <p className="text-gray-500">Aucune réservation ne correspond à vos critères</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((res) => {
                const statusInfo = getStatusBadge(res.statut);
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedId === res.id;
                const room = res.chambre_details || res.chambre || {};
                const hotel = res.hotel_details || res.hotel || {};
                const client = res.client_details || res.client || {};
                const clientUser = client.user_details || client.user || {};

                return (
                  <div key={res.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                              Réservation N°{res.id}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                            {res.statut === 'CONFIRMEE' && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                Commission: {res.commission_admin?.toLocaleString()} Ar
                              </span>
                            )}
                          </div>

                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {clientUser.username || 'Client'}
                            </p>
                            <p className="flex items-center gap-2">
                              <Hotel className="w-4 h-4" />
                              {hotel.nom || 'Hôtel'}
                            </p>
                            <p className="flex items-center gap-2">
                              <Bed className="w-4 h-4" />
                              Chambre {room.numero || 'N/A'}
                            </p>
                            <p className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Du {res.date_debut} au {res.date_fin}
                            </p>
                            <p className="flex items-center gap-2 font-semibold text-green-600">
                              <CreditCard className="w-4 h-4" />
                              {res.montant_total?.toLocaleString()} Ar
                            </p>
                            <p className="flex items-center gap-2 text-xs text-gray-400">
                              {res.nombre_nuits} nuits • {res.prix_nuit?.toLocaleString()} Ar/nuit
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {res.statut === 'PAYEE' && (
                            <>
                              <button
                                onClick={() => handleOpenAction('valider', res.id)}
                                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Valider
                              </button>
                              <button
                                onClick={() => handleOpenAction('refuser', res.id)}
                                className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                              >
                                <XCircle className="w-4 h-4" />
                                Refuser
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => toggleExpand(res.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            {isExpanded ? 'Masquer' : 'Détails'}
                          </button>
                          {room.id && (
                            <Link
                              to={`/chambres/${room.id}`}
                              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            >
                              <Bed className="w-4 h-4" />
                              Voir chambre
                            </Link>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 font-medium">Informations client</p>
                              <p className="mt-1">
                                <span className="font-semibold">Nom:</span> {clientUser.first_name || ''} {clientUser.last_name || ''}
                              </p>
                              <p>
                                <span className="font-semibold">Email:</span> {clientUser.email || 'N/A'}
                              </p>
                              <p>
                                <span className="font-semibold">Téléphone:</span> {client.telephone || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium">Détails de la réservation</p>
                              <p className="mt-1">
                                <span className="font-semibold">Crée le:</span> {new Date(res.date_creation).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-semibold">Modifié le:</span> {new Date(res.date_modification).toLocaleDateString()}
                              </p>
                              {res.date_validation && (
                                <p>
                                  <span className="font-semibold">Validé le:</span> {new Date(res.date_validation).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium">Paiement</p>
                              <p className="mt-1">
                                <span className="font-semibold">ID Stripe:</span> {res.stripe_payment_intent || 'N/A'}
                              </p>
                              <p>
                                <span className="font-semibold">Total:</span> {res.montant_total?.toLocaleString()} Ar
                              </p>
                              <p className="text-purple-600">
                                <span className="font-semibold">Commission (1%):</span> {res.commission_admin?.toLocaleString()} Ar
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL D'ACTION */}
      <ConfirmModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: null, reservationId: null, loading: false })}
        onConfirm={handleConfirmAction}
        {...getActionConfig()}
        loading={actionModal.loading}
      />
    </>
  );
};

export default GestionReservationsPage;