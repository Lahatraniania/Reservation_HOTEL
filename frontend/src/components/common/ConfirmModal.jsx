import React from 'react';
import { AlertTriangle, X, Check, Trash2, LogOut, XCircle } from 'lucide-react';

/**
 * Modal de confirmation réutilisable
 * 
 * @param {boolean} isOpen - Afficher ou non la modal
 * @param {function} onClose - Callback quand on ferme
 * @param {function} onConfirm - Callback quand on confirme
 * @param {string} title - Titre de la modal
 * @param {string} message - Message principal
 * @param {string} details - Détails supplémentaires (optionnel)
 * @param {string} confirmText - Texte du bouton confirmer (défaut: "Confirmer")
 * @param {string} cancelText - Texte du bouton annuler (défaut: "Annuler")
 * @param {string} type - Type: 'danger', 'warning', 'info' (défaut: 'warning')
 */
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmation',
    message = 'Êtes-vous sûr de vouloir continuer ?',
    details = null,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    type = 'warning',
    loading = false,
}) => {
    if (!isOpen) return null;

    // Configuration selon le type
    const typeConfig = {
        danger: {
            icon: Trash2,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700',
            borderColor: 'border-red-200',
        },
        warning: {
            icon: AlertTriangle,
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
            borderColor: 'border-yellow-200',
        },
        info: {
            icon: AlertTriangle,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
            borderColor: 'border-blue-200',
        },
        logout: {
            icon: LogOut,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700',
            borderColor: 'border-red-200',
        },
        cancel: {
            icon: XCircle,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            buttonBg: 'bg-orange-600 hover:bg-orange-700',
            borderColor: 'border-orange-200',
        },
    };

    const config = typeConfig[type] || typeConfig.warning;
    const Icon = config.icon;

    const handleConfirm = async () => {
        if (onConfirm) {
            await onConfirm();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
                {/* Header avec icône */}
                <div className="flex items-start gap-4 p-6 pb-4">
                    <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition p-1"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Détails */}
                {details && (
                    <div className={`mx-6 mb-4 p-3 ${config.iconBg} rounded-lg border ${config.borderColor}`}>
                        <p className="text-sm text-gray-700">{details}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 p-6 pt-2 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 text-white rounded-lg font-semibold ${config.buttonBg} disabled:opacity-50 transition flex items-center justify-center gap-2`}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                Traitement...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                {confirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Animations CSS */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
        </div>
    );
};

export default ConfirmModal;