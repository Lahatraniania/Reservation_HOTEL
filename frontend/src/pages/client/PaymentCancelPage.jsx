import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Hotel } from 'lucide-react';

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Paiement annulé</h1>
          <p className="text-red-100">
            Le paiement a été annulé
          </p>
        </div>

        <div className="p-8 text-center">
          <p className="text-gray-600 mb-6">
            Vous pouvez réessayer le paiement ou modifier votre réservation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Réessayer
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

export default PaymentCancelPage;