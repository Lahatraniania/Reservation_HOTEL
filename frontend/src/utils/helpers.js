// utils/helpers.js

// ✅ Formater un prix
export const formatPrice = (price, currency = 'Ar') => {
  if (!price) return `0 ${currency}`;
  return `${Number(price).toLocaleString()} ${currency}`;
};

// ✅ Formater une date
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ✅ Formater une date avec heure
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ✅ Calculer le nombre de jours entre deux dates
export const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ✅ Tronquer un texte
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// ✅ Générer une URL d'image
export const getImageUrl = (imagePath, baseUrl = 'http://localhost:8000') => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/')) return `${baseUrl}${imagePath}`;
  return `${baseUrl}/${imagePath}`;
};

// ✅ Vérifier si une chaîne est un email valide
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// ✅ Vérifier si une chaîne est un numéro de téléphone valide (Madagascar)
export const isValidPhone = (phone) => {
  const regex = /^(0[23]|[+261])\d{8,9}$/;
  return regex.test(phone);
};

// ✅ Obtenir le statut d'une réservation en français
export const getReservationStatusLabel = (status) => {
  const statusMap = {
    'EN_ATTENTE': 'En attente de paiement',
    'PAYEE': 'Payée - En attente de validation',
    'CONFIRMEE': 'Confirmée',
    'REFUSEE': 'Refusée',
    'ANNULEE': 'Annulée',
    'EXPIREE': 'Expirée',
    'ECHEC_PAIEMENT': 'Échec du paiement',
  };
  return statusMap[status] || status;
};

// ✅ Obtenir la couleur d'un statut
export const getStatusColor = (status) => {
  const colorMap = {
    'EN_ATTENTE': 'bg-yellow-100 text-yellow-700',
    'PAYEE': 'bg-blue-100 text-blue-700',
    'CONFIRMEE': 'bg-green-100 text-green-700',
    'REFUSEE': 'bg-red-100 text-red-700',
    'ANNULEE': 'bg-gray-100 text-gray-700',
    'EXPIREE': 'bg-gray-100 text-gray-700',
    'ECHEC_PAIEMENT': 'bg-red-100 text-red-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};