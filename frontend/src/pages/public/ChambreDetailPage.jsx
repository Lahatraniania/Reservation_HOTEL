import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { roomService } from '../../services/api/roomService';
import { reservationService } from '../../services/api/reservationService';
import {
  Bed, MapPin, Users, ArrowLeft, Star, Clock, Wifi, Coffee, Car,
  Utensils, Dumbbell, Waves, Tv, CheckCircle, CreditCard, AlertCircle,
  Info, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../../components/common/Loader';

const ChambreDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [chambre, setChambre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [reserving, setReserving] = useState(false);
  const [disponibilite, setDisponibilite] = useState(null); // ✅ Statut de disponibilité dynamique
  const [checkingDispo, setCheckingDispo] = useState(false);

  useEffect(() => {
    if (id) {
      fetchChambre();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Vérifier la disponibilité dès que les dates changent
  useEffect(() => {
    if (dateDebut && dateFin && new Date(dateDebut) < new Date(dateFin)) {
      checkDisponibilite();
    } else {
      setDisponibilite(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateDebut, dateFin]);

  // ✅ fetchChambre avec gestion d'erreur complète
  const fetchChambre = async () => {
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ ID de chambre invalide:', id);
      setError('ID de chambre invalide');
      setLoading(false);
      setTimeout(() => navigate('/chambres'), 2000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await roomService.getById(id);
      console.log('✅ Chambre chargée:', data);
      setChambre(data);
    } catch (err) {
      console.error('❌ Erreur chargement chambre:', err);
      if (err.response?.status === 404) {
        setError('Chambre non trouvée');
        toast.error('Chambre non trouvée');
        setTimeout(() => navigate('/chambres'), 2000);
      } else {
        setError('Erreur lors du chargement');
        toast.error('Erreur lors du chargement de la chambre');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Vérifier la disponibilité pour les dates sélectionnées
  const checkDisponibilite = async () => {
    if (!dateDebut || !dateFin) return;

    setCheckingDispo(true);
    try {
      const result = await roomService.checkDisponibilite(id, dateDebut, dateFin);
      console.log('🔍 Disponibilité:', result);
      setDisponibilite(result);
    } catch (err) {
      console.error('❌ Erreur vérification disponibilité:', err);
      setDisponibilite(null);
    } finally {
      setCheckingDispo(false);
    }
  };

  // ✅ Réservation avec vérification de disponibilité
  const handleReservation = async (e) => {
    e.preventDefault();

    // ✅ SI NON CONNECTÉ : Rediriger vers INSCRIPTION avec un message
    if (!isAuthenticated) {
      toast.error('Veuillez vous inscrire avant de faire la réservation');
      // ✅ Rediriger vers /register avec l'URL de retour
      navigate('/register', {
        state: {
          returnTo: `/chambres/${id}`,
          message: 'Inscrivez-vous avant de faire la réservation de cette chambre'
        }
      });
      return;
    }

    // ... (le reste du code reste identique)
    if (!dateDebut || !dateFin) {
      toast.error('Veuillez sélectionner les dates');
      return;
    }


    if (new Date(dateDebut) >= new Date(dateFin)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    setReserving(true);
    try {
      // ✅ VÉRIFIER LA DISPONIBILITÉ AVANT DE CRÉER LA RÉSERVATION
      const dispo = await roomService.checkDisponibilite(id, dateDebut, dateFin);

      if (!dispo.disponible) {
        toast.error(dispo.message || 'Cette chambre n\'est pas disponible à ces dates');
        setReserving(false);
        return;
      }

      // ✅ Créer la réservation
      const reservationData = {
        chambre: parseInt(id),
        date_debut: dateDebut,
        date_fin: dateFin,
      };

      const result = await reservationService.create(reservationData);
      console.log('✅ Réservation créée:', result);

      const reservationId = result.id || result.data?.id;

      if (!reservationId) {
        toast.error('Erreur: ID de réservation manquant');
        console.error('Réponse complète:', result);
        return;
      }

      toast.success('Réservation créée ! Procédez au paiement.');
      navigate(`/payment/${reservationId}`);
    } catch (error) {
      console.error('❌ Erreur réservation:', error);
      const errorMsg = error.response?.data?.detail
        || error.response?.data?.error
        || 'Erreur lors de la réservation';
      toast.error(errorMsg);
    } finally {
      setReserving(false);
    }
  };

  // ✅ Loader
  if (loading) return <Loader message="Chargement de la chambre..." />;

  // ✅ Erreur
  if (error || !chambre) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Chambre non trouvée'}
          </h2>
          <p className="text-gray-600 mb-6">
            Redirection vers la liste des chambres...
          </p>
          <Link
            to="/chambres"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux chambres
          </Link>
        </div>
      </div>
    );
  }

  const icons = {
    wifi: Wifi,
    climatisation: Clock,
    tv: Tv,
    parking: Car,
    restaurant: Utensils,
    sport: Dumbbell,
    piscine: Waves,
    cafe: Coffee
  };

  // ✅ Statut de disponibilité dynamique
  const disponibleAujourdhui = chambre.est_disponible !== false;
  const statutDynamique = chambre.statut_disponibilite || {};

  // ✅ Calculer si les dates sont valides
  const datesValides = dateDebut && dateFin && new Date(dateDebut) < new Date(dateFin);

  // ✅ Disponibilité pour les dates sélectionnées
  const dispoPourDates = disponibilite?.disponible;

  // ✅ Le bouton est actif si : chambre disponible + pas en cours + (pas de dates OU dispo pour dates)
  const boutonActif = disponibleAujourdhui
    && !reserving
    && (!datesValides || dispoPourDates !== false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <Link
          to="/chambres"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux chambres
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* ========== IMAGES ========== */}
            <div>
              <div className="h-80 bg-gradient-to-br from-blue-500 to-green-600 rounded-xl overflow-hidden">
                {chambre.photo_principale ? (
                  <img
                    src={chambre.photo_principale}
                    alt={`Chambre ${chambre.numero}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Bed className="w-24 h-24 text-white/30" />
                  </div>
                )}
              </div>
              {chambre.photos_supplementaires?.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {chambre.photos_supplementaires.slice(0, 4).map((photo, index) => (
                    <div key={index} className="h-20 bg-gray-200 rounded-lg overflow-hidden">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ========== DÉTAILS ========== */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Chambre {chambre.numero}
                  </h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {chambre.type || 'Standard'}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  {chambre.hotel_nom || chambre.hotel_details?.nom}
                </p>
                <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  {chambre.hotel_ville || chambre.hotel_details?.ville}
                </div>
                <div className="flex items-center gap-2 text-yellow-500 mt-2">
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <span className="text-gray-700">4.5</span>
                  <span className="text-gray-500 text-sm">(120 avis)</span>
                </div>
              </div>

              {/* ✅ Statut dynamique */}
              <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {chambre.capacite || 2} personnes
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {chambre.surface || 25}m²
                </span>
                <span className={`flex items-center gap-1 ${disponibleAujourdhui ? 'text-green-600' : 'text-red-600'
                  }`}>
                  <CheckCircle className="w-4 h-4" />
                  {disponibleAujourdhui ? 'Disponible aujourd\'hui' : 'Occupée actuellement'}
                </span>
              </div>

              {/* ✅ Message si la chambre est occupée */}
              {!disponibleAujourdhui && statutDynamique.message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-red-800 font-medium">
                      {statutDynamique.message}
                    </p>
                    {chambre.prochaine_reservation && (
                      <p className="text-red-600 text-xs mt-1">
                        Réservée du {chambre.prochaine_reservation.date_debut} au {chambre.prochaine_reservation.date_fin}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ✅ Info si réservation future */}
              {disponibleAujourdhui && chambre.prochaine_reservation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-yellow-800 font-medium">
                      Réservée à partir du {chambre.prochaine_reservation.date_debut}
                    </p>
                    <p className="text-yellow-700 text-xs">
                      Disponible avant cette date
                    </p>
                  </div>
                </div>
              )}

              {/* Équipements */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                  {chambre.equipements?.map((equip, index) => {
                    const Icon = icons[equip?.toLowerCase()] || Bed;
                    return (
                      <span
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        <Icon className="w-4 h-4" />
                        {equip}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* ========== RÉSERVATION ========== */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-blue-600">
                      {chambre.prix_nuit?.toLocaleString()} Ar
                    </span>
                    <span className="text-sm text-gray-500"> / nuit</span>
                  </div>
                  {chambre.hotel && (
                    <Link
                      to={`/hotels/${chambre.hotel}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Voir l'hôtel
                    </Link>
                  )}
                </div>

                {/* ✅ Message si non connecté */}
                {!isAuthenticated && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-yellow-800 font-medium">Connexion requise</p>
                      <p className="text-yellow-700">
                        Vous devez être connecté pour réserver.{' '}
                        <Link to="/login" className="underline font-semibold">
                          Se connecter
                        </Link>
                      </p>
                    </div>
                  </div>
                )}

                {/* ✅ Formulaire de réservation */}
                <form onSubmit={handleReservation} className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date d'arrivée
                      </label>
                      <input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de départ
                      </label>
                      <input
                        type="date"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        min={dateDebut || new Date().toISOString().split('T')[0]}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  {/* ✅ Affichage du statut pour les dates sélectionnées */}
                  {checkingDispo && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                      Vérification de la disponibilité...
                    </div>
                  )}

                  {disponibilite && !checkingDispo && datesValides && (
                    <>
                      {disponibilite.disponible ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="text-green-800 font-medium">
                              ✓ Disponible pour cette période
                            </p>
                            <p className="text-green-700 text-xs">
                              Du {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="text-red-800 font-medium">
                              {disponibilite.message || 'Non disponible à cette période'}
                            </p>
                            {disponibilite.reservation && (
                              <p className="text-red-600 text-xs mt-1">
                                Réservée du {disponibilite.reservation.date_debut} au {disponibilite.reservation.date_fin}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={!boutonActif}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <CreditCard className="w-5 h-5" />
                    {reserving
                      ? 'Réservation en cours...'
                      : !disponibleAujourdhui
                        ? 'Indisponible'
                        : dispoPourDates === false
                          ? 'Non disponible à ces dates'
                          : 'Réserver maintenant'}
                  </button>
                </form>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  ✅ Paiement sécurisé via Stripe • Commission 1% reversée à la plateforme
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChambreDetailPage;