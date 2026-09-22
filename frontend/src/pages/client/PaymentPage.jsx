import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, AlertCircle, ArrowLeft, Shield, Users, ExternalLink } from 'lucide-react';
import { reservationService } from '../../services/api/reservationService';
import apiClient from '../../services/api/apiClient';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchReservation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchReservation = async () => {
    setLoading(true);
    try {
      const data = await reservationService.getById(id);
      console.log('✅ Réservation chargée:', data);
      setReservation(data);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Erreur lors du chargement de la réservation');
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // ✅ Créer la session Stripe Checkout
      const response = await apiClient.post('/create-checkout-session/', {
        reservation_id: id,
      });

      console.log('✅ Session Stripe créée:', response.data);

      // ✅ Rediriger vers Stripe Checkout
      if (response.data.session_url) {
        window.location.href = response.data.session_url;
      } else {
        toast.error('URL de paiement manquante');
      }
    } catch (err) {
      console.error('❌ Erreur paiement:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la création du paiement');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loader message="Chargement..." />;

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600">{error || 'Réservation non trouvée'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // ✅ Vérifier que la réservation est en attente
  if (reservation.statut !== 'EN_ATTENTE') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Réservation déjà traitée</h2>
          <p className="text-gray-600 mb-4">
            Statut actuel : <strong>{reservation.statut}</strong>
          </p>
          <button
            onClick={() => navigate('/my-reservations')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Voir mes réservations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Paiement sécurisé</h1>
            <p className="text-gray-600 mt-2">
              Réservation #{reservation.id}
            </p>
          </div>

          {/* Détails de la réservation */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Hôtel</p>
                <p className="font-semibold">
                  {reservation.hotel?.nom || reservation.hotel_details?.nom || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Chambre</p>
                <p className="font-semibold">
                  Chambre {reservation.chambre?.numero || reservation.chambre_details?.numero || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Type</p>
                <p className="font-semibold">
                  {reservation.chambre?.type || reservation.chambre_details?.type || 'Standard'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Capacité</p>
                <p className="font-semibold flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {reservation.chambre?.capacite || reservation.chambre_details?.capacite || 2} personnes
                </p>
              </div>
              <div>
                <p className="text-gray-500">Dates</p>
                <p className="font-semibold">
                  Du {reservation.date_debut} au {reservation.date_fin}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Nuits</p>
                <p className="font-semibold">{reservation.nombre_nuits} nuits</p>
              </div>
            </div>

            <div className="border-t mt-4 pt-4 flex justify-between items-center">
              <span className="text-gray-500">Total à payer</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600">
                  {reservation.montant_total?.toLocaleString()} Ar
                </span>
                <p className="text-xs text-gray-400">
                  Commission 1% reversée à la plateforme
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              💳 Vous allez être redirigé vers la page de paiement sécurisée Stripe.
              Utilisez la carte test <strong>4242 4242 4242 4242</strong> avec n'importe quelle date future et CVC.
            </p>
          </div>

          {/* Bouton de paiement */}
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Redirection vers Stripe...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Payer maintenant ({reservation.montant_total?.toLocaleString()} Ar)
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Paiement 100% sécurisé par Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;