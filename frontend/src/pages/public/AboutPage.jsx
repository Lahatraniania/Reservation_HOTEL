import React from 'react';
import { Hotel, Shield, CreditCard, Rocket, Heart, Target } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">À propos de Reservation_HOTEL</h1>
            <p className="text-xl text-gray-600">La plateforme de réservation d'hôtels à Madagascar</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Hotel className="w-8 h-8 text-blue-600" /> Notre mission
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Reservation_HOTEL est une plateforme innovante qui connecte les voyageurs avec les meilleurs hôtels à Madagascar.
              Notre mission est de faciliter la réservation d'hébergement en offrant une expérience sécurisée, rapide et transparente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              { icon: Shield, title: 'Sécurité', desc: 'Paiements sécurisés via Stripe et protection des données', color: 'blue' },
              { icon: Rocket, title: 'Rapidité', desc: 'Réservation instantanée et confirmation en temps réel', color: 'green' },
              { icon: Heart, title: 'Qualité', desc: 'Hôtels soigneusement sélectionnés et vérifiés', color: 'red' },
              { icon: Target, title: 'Confiance', desc: 'Communauté de propriétaires et clients satisfaits', color: 'purple' },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <div className={`flex items-center gap-3 mb-3`}>
                  <item.icon className={`w-8 h-8 text-${item.color}-600`} />
                  <h3 className="text-lg font-bold">{item.title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6" /> Commission 1%
            </h3>
            <p className="text-blue-700">
              Chaque réservation validée contribue à 1% de commission pour la plateforme.
              Ce modèle permet de maintenir un service de qualité et de soutenir l'écosystème touristique à Madagascar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;