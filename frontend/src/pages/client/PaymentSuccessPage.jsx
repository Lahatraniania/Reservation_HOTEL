import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Hotel, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/api/apiClient';
import Loader from '../../components/common/Loader';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      toast.error('Session de paiement non trouvée');
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifyPayment = async (sessionId) => {
    try {
      // ✅ Attendre que le webhook Stripe traite le paiement
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ✅ Vérifier le token avant l'appel
      const token = localStorage.getItem('access_token');
      console.log('🔍 Token présent:', !!token);

      // ✅ Étape 1 : Vérifier le paiement (récupère reservation_id + infos basiques)
      const verifyResponse = await apiClient.get(`/verify-payment/${sessionId}/`);
      console.log('✅ Vérification paiement:', verifyResponse.data);

      const reservationId = verifyResponse.data.reservation_id;
      const basicInfo = verifyResponse.data;

      if (!reservationId) {
        throw new Error('ID de réservation manquant');
      }

      // ✅ Étape 2 : Essayer de récupérer les DÉTAILS de la réservation
      try {
        const reservationData = await apiClient.get(`/reservations/${reservationId}/`);
        console.log('✅ Réservation complète:', reservationData.data);
        setReservation(reservationData.data);
      } catch (detailError) {
        // ⚠️ Si le détail échoue, utiliser les infos de verify_payment
        console.warn('⚠️ Impossible de récupérer les détails complets, utilisation des infos basiques');

        // ✅ Fallback : utiliser les données de base du verify_payment
        setReservation({
          id: reservationId,
          statut: basicInfo.statut,
          montant_total: basicInfo.montant_total,
          commission_admin: basicInfo.commission,
          _basic: true, // Marquer comme infos basiques
        });
      }

    } catch (error) {
      console.error('❌ Erreur vérification:', error);
      setError(error.response?.data?.error || error.message || 'Erreur de vérification');

      // ✅ Ne pas bloquer l'utilisateur : afficher un message de succès quand même
      // car le paiement est probablement passé
      toast.warning('Paiement traité, mais détails en cours de chargement...');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Vérification du paiement..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header succès */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Paiement réussi !</h1>
          <p className="text-green-100">
            Votre réservation a été confirmée avec succès
          </p>
        </div>

        <div className="p-8">
          {/* Réservation détaillée */}
          {reservation && !reservation._basic && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Réservation</span>
                  </div>
                  <p className="font-semibold">N°{reservation.id}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Hotel className="w-4 h-4" />
                    <span className="text-sm">Hôtel</span>
                  </div>
                  <p className="font-semibold truncate">
                    {reservation.hotel_details?.nom || reservation.hotel?.nom || 'Hôtel'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Montant</span>
                  </div>
                  <p className="font-semibold text-green-600">
                    {parseFloat(reservation.montant_total || 0).toLocaleString()} Ar
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Dates</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {reservation.date_debut} → {reservation.date_fin}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700">
                  ✅ Votre réservation est confirmée et payée.
                  Le propriétaire va valider votre séjour prochainement.
                </p>
              </div>
            </div>
          )}

          {/* Réservation basique (fallback) */}
          {reservation && reservation._basic && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Réservation</span>
                  </div>
                  <p className="font-semibold">N°{reservation.id}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Montant</span>
                  </div>
                  <p className="font-semibold text-green-600">
                    {parseFloat(reservation.montant_total || 0).toLocaleString()} Ar
                  </p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700">
                  ✅ Votre paiement a été traité avec succès.
                  Consultez vos réservations pour voir les détails.
                </p>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && !reservation && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">Vérification en cours...</p>
                  <p className="text-yellow-700">
                    Le paiement a peut-être été traité. Consultez vos réservations pour vérifier.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              onClick={() => navigate('/my-reservations')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Mes réservations
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              <Hotel className="w-4 h-4" />
              Accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;