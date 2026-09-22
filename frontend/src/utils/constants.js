// utils/constants.js

// ✅ URL de l'API
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ✅ Clé publique Stripe
export const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';

// ✅ Types de chambres
export const ROOM_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'SUPERIEUR', label: 'Supérieur' },
  { value: 'LUXE', label: 'Luxe' },
  { value: 'FAMILIALE', label: 'Familiale' },
  { value: 'SUITE', label: 'Suite' },
];

// ✅ Statuts de réservation
export const RESERVATION_STATUS = [
  { value: 'EN_ATTENTE', label: 'En attente de paiement' },
  { value: 'PAYEE', label: 'Payée - En attente de validation' },
  { value: 'CONFIRMEE', label: 'Confirmée' },
  { value: 'REFUSEE', label: 'Refusée' },
  { value: 'ANNULEE', label: 'Annulée' },
  { value: 'EXPIREE', label: 'Expirée' },
];

// ✅ Statuts de demande de placement
export const DEMANDE_STATUS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'VALIDE', label: 'Validée' },
  { value: 'REFUSE', label: 'Refusée' },
];

// ✅ Équipements disponibles
export const EQUIPEMENTS = [
  'WiFi',
  'Climatisation',
  'Télévision',
  'Mini-bar',
  'Jacuzzi',
  'Piscine',
  'Restaurant',
  'Parking',
  'Salle de sport',
  'Spa',
  'Sauna',
  'Animaux acceptés',
  'Chambres non-fumeurs',
  'Service en chambre',
];

// ✅ Pays
export const PAYS = [
  'Madagascar',
  'France',
  'États-Unis',
  'Canada',
  'Belgique',
  'Suisse',
  'Allemagne',
  'Italie',
  'Espagne',
  'Royaume-Uni',
];

// ✅ Villes de Madagascar
export const VILLES_MADAGASCAR = [
  'Antananarivo',
  'Nosy Be',
  'Toamasina',
  'Mahajanga',
  'Antsirabe',
  'Fianarantsoa',
  'Toliara',
  'Fort-Dauphin',
  'Morondava',
  'Manakara',
  'Antalaha',
  'Maroantsetra',
  'Maintirano',
  'Ambanja',
  'Andoany',
];

// ✅ Limites de pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};