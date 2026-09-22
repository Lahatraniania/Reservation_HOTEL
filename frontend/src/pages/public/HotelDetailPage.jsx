import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { hotelService } from '../../services/api/hotelService';
import { roomService } from '../../services/api/roomService';
import {
  Hotel, MapPin, Star, Users, Phone, Mail, Bed,
  ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle,
  Calendar, Info, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

// ============================================================
// COMPOSANT ROOM CARD
// ============================================================
const RoomCard = ({ room, hotelId }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const disponible = room.est_disponible !== false;
  const statut = room.statut_disponibilite || {};
  const prochaine = room.prochaine_reservation;

  // Configuration badge
  let badgeText = 'Disponible';
  let badgeColor = 'bg-green-500';
  let statusIcon = CheckCircle;

  if (!disponible) {
    badgeColor = 'bg-red-500';
    badgeText = 'Occupée';
    statusIcon = XCircle;
  } else if (prochaine) {
    badgeColor = 'bg-yellow-500';
    badgeText = 'Disponible bientôt réservée';
    statusIcon = Clock;
  }

  const StatusIcon = statusIcon;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
        {room.photo_principale ? (
          <img
            src={room.photo_principale}
            alt={`Chambre ${room.numero}`}
            className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
              } group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Bed className="w-16 h-16 text-white/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Badge type */}
        <span className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold text-white bg-blue-600/90 rounded-full backdrop-blur-sm">
          {room.type || 'Standard'}
        </span>

        {/* Badge statut dynamique */}
        <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold text-white ${badgeColor} rounded-full backdrop-blur-sm flex items-center gap-1`}>
          <StatusIcon className="w-3 h-3" />
          {badgeText}
        </span>

        {/* Numéro */}
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-900 font-bold text-sm rounded-lg">
            Chambre {room.numero}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Message détaillé */}
        {!disponible && statut.message && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700 flex items-center gap-1">
              <XCircle className="w-3 h-3 flex-shrink-0" />
              {statut.message}
            </p>
          </div>
        )}

        {disponible && prochaine && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700 flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              Réservée du {new Date(prochaine.date_debut).toLocaleDateString('fr-FR')} au {new Date(prochaine.date_fin).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}

        {/* Infos */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-gray-600">
              <Users className="w-4 h-4" />
              {room.capacite || 2} pers.
            </span>
            <span className="text-gray-500 text-xs">
              {room.surface ? `${room.surface}m²` : ''}
            </span>
          </div>

          {/* Équipements */}
          {room.equipements && room.equipements.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {room.equipements.slice(0, 3).map((equip, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  {equip}
                </span>
              ))}
              {room.equipements.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  +{room.equipements.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Prix */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <span className="text-xl font-bold text-blue-600">
              {room.prix_nuit?.toLocaleString()} Ar
            </span>
            <span className="text-xs text-gray-500"> /nuit</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {disponible ? (
            <Link
              to={`/chambres/${room.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-sm"
            >
              <Calendar className="w-4 h-4" />
              Réserver
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed text-sm"
            >
              <XCircle className="w-4 h-4" />
              Indisponible
            </button>
          )}
          <Link
            to={`/chambres/${room.id}`}
            className="px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition text-sm"
          >
            Détails
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChambres, setLoadingChambres] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // ===== CHARGEMENT =====
  useEffect(() => {
    if (id) {
      fetchHotel();
      fetchChambres();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchHotel = async () => {
    if (!id || id === 'undefined') {
      setError('ID d\'hôtel invalide');
      setLoading(false);
      setTimeout(() => navigate('/hotels'), 2000);
      return;
    }

    setLoading(true);
    try {
      const data = await hotelService.getById(id);
      console.log('✅ Hôtel chargé:', data);
      setHotel(data);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Hôtel non trouvé');
      toast.error('Hôtel non trouvé');
      setTimeout(() => navigate('/hotels'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Récupérer TOUTES les chambres
  const fetchChambres = async () => {
    setLoadingChambres(true);
    try {
      const data = await hotelService.getRooms(id);
      console.log('✅ Chambres chargées:', data);
      setChambres(data.results || data || []);
    } catch (err) {
      console.error('❌ Erreur chambres:', err);
      try {
        const data = await roomService.getByHotel(id);
        setChambres(data.results || data || []);
      } catch (err2) {
        toast.error('Erreur lors du chargement des chambres');
      }
    } finally {
      setLoadingChambres(false);
    }
  };

  // ✅ Filtrer + rechercher
  const filteredChambres = chambres.filter(c => {
    const matchFilter = filter === 'all'
      || (filter === 'disponible' && c.est_disponible !== false)
      || (filter === 'occupee' && c.est_disponible === false);

    const matchSearch = !search
      || c.numero?.toLowerCase().includes(search.toLowerCase())
      || c.type?.toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  // ✅ Statistiques
  const stats = {
    total: chambres.length,
    disponibles: chambres.filter(c => c.est_disponible !== false).length,
    occupees: chambres.filter(c => c.est_disponible === false).length,
  };

  // ===== LOADER =====
  if (loading) return <Loader message="Chargement de l'hôtel..." />;

  // ===== ERREUR =====
  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Hôtel non trouvé'}
          </h2>
          <p className="text-gray-600 mb-6">Redirection...</p>
          <Link
            to="/hotels"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux hôtels
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Retour */}
        <Link
          to="/hotels"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux hôtels
        </Link>

        {/* ========== EN-TÊTE HÔTEL ========== */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="h-72 md:h-96 bg-gradient-to-br from-blue-500 to-purple-600 relative">
            {hotel.photo_principale ? (
              <img
                src={hotel.photo_principale}
                alt={hotel.nom}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Hotel className="w-24 h-24 text-white/30" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {hotel.nom}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {hotel.ville}, {hotel.pays}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {hotel.note_moyenne || 'Nouveau'}
                </span>
                <span className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  {stats.total} chambre{stats.total > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {hotel.description || 'Aucune description disponible.'}
                  </p>
                </div>

                {hotel.equipements && hotel.equipements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Équipements de l'hôtel</h3>
                    <div className="flex flex-wrap gap-2">
                      {hotel.equipements.map((equip, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                          {equip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Contact
                  </h3>
                  <div className="space-y-3 text-sm">
                    <p className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {hotel.telephone || 'Non renseigné'}
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {hotel.email_contact || 'Non renseigné'}
                    </p>
                    <p className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      {hotel.adresse}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h3 className="font-bold text-blue-800 mb-3">Disponibilité actuelle</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total chambres</span>
                      <span className="font-bold text-gray-900">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Disponibles
                      </span>
                      <span className="font-bold text-green-600">{stats.disponibles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Occupées
                      </span>
                      <span className="font-bold text-red-600">{stats.occupees}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== SECTION CHAMBRES ========== */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bed className="w-6 h-6 text-blue-600" />
                Chambres de l'hôtel
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Toutes les chambres avec leur statut en temps réel
              </p>
            </div>

            {/* Barre de recherche */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Rechercher une chambre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Toutes ({stats.total})
            </button>
            <button
              onClick={() => setFilter('disponible')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'disponible'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              ✓ Disponibles ({stats.disponibles})
            </button>
            <button
              onClick={() => setFilter('occupee')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'occupee'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              ✗ Occupées ({stats.occupees})
            </button>
          </div>

          {/* Liste */}
          {loadingChambres ? (
            <Loader message="Chargement des chambres..." />
          ) : filteredChambres.length === 0 ? (
            <div className="text-center py-12">
              <Bed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {search
                  ? 'Aucune chambre ne correspond à votre recherche'
                  : filter === 'all'
                    ? 'Aucune chambre disponible'
                    : filter === 'disponible'
                      ? 'Aucune chambre disponible actuellement'
                      : 'Aucune chambre occupée'
                }
              </h3>
              {(filter !== 'all' || search) && (
                <button
                  onClick={() => { setFilter('all'); setSearch(''); }}
                  className="text-blue-600 hover:underline text-sm mt-2"
                >
                  Voir toutes les chambres
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredChambres.map((room) => (
                <RoomCard key={room.id} room={room} hotelId={id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;