import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demandeService } from '../../services/api/demandeService';
import {
  Store, CheckCircle, XCircle, RefreshCw,
  ArrowLeft, Search, User, Mail,
  Phone, MapPin, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import ConfirmModal from '../../components/common/ConfirmModal';

const DemandesListPage = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // ✅ Modal d'action
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    action: null,
    demande: null,
    loading: false,
  });

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const data = await demandeService.getAll();
      setDemandes(data.results || data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ouvrir la modal
  const handleOpenAction = (action, demande) => {
    setActionModal({ isOpen: true, action, demande, loading: false });
  };

  // ✅ Confirmer l'action
  const handleConfirmAction = async () => {
    setActionModal(prev => ({ ...prev, loading: true }));
    try {
      if (actionModal.action === 'valider') {
        await demandeService.validate(actionModal.demande.id);
        toast.success('Hôtel créé avec succès !');
      } else {
        await demandeService.reject(actionModal.demande.id);
        toast.success('Demande refusée');
      }
      fetchDemandes();
      setActionModal({ isOpen: false, action: null, demande: null, loading: false });
    } catch (error) {
      toast.error('Erreur lors de l\'action');
      setActionModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'EN_ATTENTE': { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
      'VALIDE': { label: 'Validée', color: 'bg-green-100 text-green-700' },
      'REFUSE': { label: 'Refusée', color: 'bg-red-100 text-red-700' },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const filteredDemandes = demandes.filter(d => {
    const matchFilter = filter === 'all' || d.statut === filter;
    const matchSearch =
      d.hotel_nom?.toLowerCase().includes(search.toLowerCase()) ||
      d.hotel_ville?.toLowerCase().includes(search.toLowerCase()) ||
      d.proprietaire_details?.username?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <Loader message="Chargement des demandes..." />;

  const stats = {
    total: demandes.length,
    pending: demandes.filter(d => d.statut === 'EN_ATTENTE').length,
    validated: demandes.filter(d => d.statut === 'VALIDE').length,
    rejected: demandes.filter(d => d.statut === 'REFUSE').length,
  };

  // ✅ Config selon l'action
  const getActionConfig = () => {
    if (actionModal.action === 'valider') {
      return {
        title: 'Valider cette demande ?',
        message: 'L\'hôtel sera immédiatement créé et visible sur la plateforme.',
        details: actionModal.demande ? `Hôtel : ${actionModal.demande.hotel_nom}` : '',
        confirmText: 'Oui, valider',
        cancelText: 'Non, annuler',
        type: 'info',
      };
    }
    return {
      title: 'Refuser cette demande ?',
      message: 'Le propriétaire sera notifié du refus de sa demande.',
      details: actionModal.demande ? `Hôtel : ${actionModal.demande.hotel_nom}` : '',
      confirmText: 'Oui, refuser',
      cancelText: 'Non, garder',
      type: 'danger',
    };
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="w-8 h-8 text-orange-600" />
              Demandes de placement
            </h1>
            <div className="flex gap-3">
              <Link
                to="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
              <button
                onClick={fetchDemandes}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
              <p className="text-sm text-gray-600">Validées</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-sm text-gray-600">Refusées</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une demande..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'EN_ATTENTE', 'VALIDE', 'REFUSE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {status === 'all' ? 'Tous' :
                      status === 'EN_ATTENTE' ? '⏳ En attente' :
                        status === 'VALIDE' ? '✅ Validées' : '❌ Refusées'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredDemandes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">Aucune demande</h3>
              <p className="text-gray-500">Aucune demande ne correspond à vos critères</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDemandes.map((demande) => {
                const statusInfo = getStatusBadge(demande.statut);

                return (
                  <div key={demande.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">
                              {demande.hotel_nom}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {demande.hotel_ville}
                            </p>
                            <p className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {demande.proprietaire_details?.username}
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {demande.hotel_email}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {demande.hotel_telephone}
                            </p>
                            <p className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(demande.date_demande).toLocaleDateString()}
                            </p>
                            {demande.hotel_photo && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={demande.hotel_photo}
                                  alt="Hôtel"
                                  className="w-12 h-10 object-cover rounded-lg"
                                />
                                <span className="text-xs text-gray-400">Photo</span>
                              </div>
                            )}
                          </div>

                          {demande.hotel_description && (
                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                              {demande.hotel_description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {demande.statut === 'EN_ATTENTE' && (
                            <>
                              <button
                                onClick={() => handleOpenAction('valider', demande)}
                                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Valider
                              </button>
                              <button
                                onClick={() => handleOpenAction('refuser', demande)}
                                className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                              >
                                <XCircle className="w-4 h-4" />
                                Refuser
                              </button>
                            </>
                          )}
                          {demande.proprietaire_photo && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg">
                              <img
                                src={demande.proprietaire_photo}
                                alt="Propriétaire"
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            </div>
                          )}
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

      {/* ✅ MODAL D'ACTION */}
      <ConfirmModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: null, demande: null, loading: false })}
        onConfirm={handleConfirmAction}
        {...getActionConfig()}
        loading={actionModal.loading}
      />
    </>
  );
};

export default DemandesListPage;