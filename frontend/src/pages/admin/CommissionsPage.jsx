import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api/adminService';
import {
  CreditCard, RefreshCw, ArrowLeft, Search,
  CheckCircle, Clock, Calendar,
  Hotel, Download, Bed,
  ChevronLeft, ChevronRight, User, MapPin,
  TrendingUp, DollarSign, Wallet, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const CommissionsPage = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [processingId, setProcessingId] = useState(null);
  const [processingAll, setProcessingAll] = useState(false);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCommissions();
      setCommissions(data.results || data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des commissions');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Marquer UNE commission comme payée
  const handleMarquerPayee = async (id, hotelNom, montant) => {
    if (!window.confirm(
      `Confirmer que vous avez bien reçu le virement de ${montant?.toLocaleString()} Ar pour "${hotelNom}" ?`
    )) return;

    setProcessingId(id);
    try {
      await adminService.marquerCommissionPayee(id);
      toast.success(`✅ Commission de ${montant?.toLocaleString()} Ar marquée comme payée !`);
      fetchCommissions();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du marquage');
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Marquer TOUTES les commissions en attente comme payées
  const handleMarquerToutesPayees = async () => {
    const pendingCount = commissions.filter(c => c.statut === 'EN_ATTENTE').length;

    if (pendingCount === 0) {
      toast.info('Aucune commission en attente');
      return;
    }

    if (!window.confirm(
      `Marquer les ${pendingCount} commission(s) en attente comme payées ?\n\nCette action confirme que vous avez reçu tous les virements.`
    )) return;

    setProcessingAll(true);
    try {
      const result = await adminService.marquerToutesCommissionsPayees();
      toast.success(`✅ ${result.count} commission(s) marquée(s) comme payée(s) !`);
      fetchCommissions();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du marquage');
    } finally {
      setProcessingAll(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'EN_ATTENTE': { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'PAYEE': { label: 'Payée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
  };

  // Helper : récupérer les infos de l'hôtel/chambre/client
  const getReservationInfo = (commission) => {
    const reservation = commission.reservation_details || {};
    const hotel = reservation.hotel_details || reservation.hotel || {};
    const room = reservation.chambre_details || reservation.chambre || {};
    const client = reservation.client_details || reservation.client || {};
    const user = client.user_details || client.user || {};

    return { reservation, hotel, room, client, user };
  };

  const filteredCommissions = commissions.filter(c => {
    const matchFilter = filter === 'all' || c.statut === filter;
    const { hotel, user } = getReservationInfo(c);
    const matchSearch =
      hotel.nom?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      hotel.ville?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCommissions.length / itemsPerPage);
  const paginatedData = filteredCommissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <Loader message="Chargement des commissions..." />;

  const stats = {
    total: commissions.length,
    totalAmount: commissions.reduce((acc, c) => acc + parseFloat(c.montant || 0), 0),
    pending: commissions.filter(c => c.statut === 'EN_ATTENTE').length,
    paid: commissions.filter(c => c.statut === 'PAYEE').length,
    pendingAmount: commissions
      .filter(c => c.statut === 'EN_ATTENTE')
      .reduce((acc, c) => acc + parseFloat(c.montant || 0), 0),
    paidAmount: commissions
      .filter(c => c.statut === 'PAYEE')
      .reduce((acc, c) => acc + parseFloat(c.montant || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* ========== HEADER ========== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-8 h-8 text-purple-600" />
              Gestion des commissions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Suivez et marquez les commissions reçues (1% des réservations)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
            <button
              onClick={fetchCommissions}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            {stats.pending > 0 && (
              <button
                onClick={handleMarquerToutesPayees}
                disabled={processingAll}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {processingAll ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    Tout marquer payé ({stats.pending})
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => toast.success('Exportation en cours...')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>

        {/* ========== STATISTIQUES ========== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Total commissions</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <div className="text-lg font-bold text-purple-600">
                {stats.totalAmount.toLocaleString()} Ar
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Montant total</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <Clock className="w-6 h-6 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <p className="text-sm text-gray-600 mt-1">En attente</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Payées</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <Wallet className="w-6 h-6 text-yellow-600" />
              <div className="text-lg font-bold text-yellow-600">
                {stats.pendingAmount.toLocaleString()} Ar
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Montant en attente</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <div className="text-lg font-bold text-green-600">
                {stats.paidAmount.toLocaleString()} Ar
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Montant payé</p>
          </div>
        </div>

        {/* ========== INFO ========== */}
        {stats.pending > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-800 font-semibold">
                💰 {stats.pending} commission(s) en attente pour un total de {stats.pendingAmount.toLocaleString()} Ar
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Ces commissions ont été générées par les réservations validées.
                Marquez-les comme payées une fois le virement reçu.
              </p>
            </div>
          </div>
        )}

        {/* ========== FILTRES ========== */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par hôtel, ville ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'EN_ATTENTE', 'PAYEE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {status === 'all' ? `Tous (${stats.total})` :
                    status === 'EN_ATTENTE' ? `⏳ En attente (${stats.pending})` :
                      `✅ Payées (${stats.paid})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ========== LISTE ========== */}
        {filteredCommissions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">Aucune commission</h3>
            <p className="text-gray-500">Aucune commission ne correspond à vos critères</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="space-y-3 p-4">
                {paginatedData.map((commission) => {
                  const statusInfo = getStatusBadge(commission.statut);
                  const StatusIcon = statusInfo.icon;
                  const { reservation, hotel, room, user } = getReservationInfo(commission);
                  const isProcessing = processingId === commission.id;

                  return (
                    <div
                      key={commission.id}
                      className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition"
                    >
                      {/* IMAGE */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
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
                            <Hotel className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>

                      {/* INFOS */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Link
                            to={`/hotels/${hotel.id}`}
                            className="font-bold text-gray-900 hover:text-blue-600 transition"
                          >
                            {hotel.nom || 'Hôtel'}
                          </Link>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            Chambre {room.numero || 'N/A'}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {hotel.ville || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {user.username || 'Client'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {reservation.date_debut} → {reservation.date_fin}
                          </span>
                        </div>
                      </div>

                      {/* MONTANTS + STATUT + ACTIONS */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Montant total</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {reservation.montant_total?.toLocaleString()} Ar
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-500">Commission 1%</p>
                          <p className="font-bold text-purple-600 text-lg">
                            {commission.montant?.toLocaleString()} Ar
                          </p>
                        </div>

                        {/* STATUT */}
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>

                        {/* ✅ BOUTON "Marquer comme payée" */}
                        {commission.statut === 'EN_ATTENTE' && (
                          <button
                            onClick={() => handleMarquerPayee(
                              commission.id,
                              hotel.nom,
                              commission.montant
                            )}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-semibold"
                            title="Confirmer que vous avez reçu le virement"
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                                Traitement...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Marquer payée
                              </>
                            )}
                          </button>
                        )}

                        {/* ✅ Badge "Payée le X" */}
                        {commission.statut === 'PAYEE' && commission.date_paiement && (
                          <div className="text-right">
                            <p className="text-xs text-green-600 font-medium">Payée le</p>
                            <p className="text-xs text-gray-500">
                              {new Date(commission.date_paiement).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        )}

                        {/* DATE DE CRÉATION */}
                        <div className="text-right text-xs text-gray-500">
                          <p className="font-medium">Créée le</p>
                          {new Date(commission.date_creation).toLocaleDateString('fr-FR')}
                          <span className="block text-gray-400">
                            {new Date(commission.date_creation).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========== PAGINATION ========== */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredCommissions.length)} sur {filteredCommissions.length} résultats
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommissionsPage;