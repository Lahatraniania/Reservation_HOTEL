import React from 'react';
import { CheckCircle, Shield, AlertCircle, Users } from 'lucide-react';

const ConditionsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Conditions générales</h1>
            <p className="text-xl text-gray-600">Découvrez les conditions d'utilisation de Reservation_HOTEL</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" /> Pour les propriétaires
              </h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3"><span className="text-green-500 mt-1">•</span><span>Création gratuite de compte et dépôt d'hôtel</span></li>
                <li className="flex items-start gap-3"><span className="text-green-500 mt-1">•</span><span>Commission de 1% sur chaque réservation validée</span></li>
                <li className="flex items-start gap-3"><span className="text-green-500 mt-1">•</span><span>Gestion autonome des chambres et des réservations</span></li>
                <li className="flex items-start gap-3"><span className="text-green-500 mt-1">•</span><span>Validation des réservations après paiement client</span></li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" /> Pour les clients
              </h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3"><span className="text-blue-500 mt-1">•</span><span>Inscription gratuite et rapide</span></li>
                <li className="flex items-start gap-3"><span className="text-blue-500 mt-1">•</span><span>Paiement sécurisé via Stripe</span></li>
                <li className="flex items-start gap-3"><span className="text-blue-500 mt-1">•</span><span>Réservation confirmée après paiement</span></li>
                <li className="flex items-start gap-3"><span className="text-blue-500 mt-1">•</span><span>Annulation possible selon conditions de l'hôtel</span></li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" /> Sécurité et confidentialité
              </h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3"><span className="text-purple-500 mt-1">•</span><span>Protection des données personnelles</span></li>
                <li className="flex items-start gap-3"><span className="text-purple-500 mt-1">•</span><span>Transactions sécurisées avec Stripe</span></li>
                <li className="flex items-start gap-3"><span className="text-purple-500 mt-1">•</span><span>Confidentialité des informations bancaires</span></li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-xl p-8 border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-yellow-800">Commission 1%</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    La commission de 1% est automatiquement prélevée sur chaque réservation validée.
                    Ce montant est reversé à la plateforme pour assurer son bon fonctionnement et la qualité des services proposés.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionsPage;