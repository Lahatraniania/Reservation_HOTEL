import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hotelService } from '../../services/api/hotelService';
import { roomService } from '../../services/api/roomService';
import {
  Store, Package, ArrowRight, RefreshCw, TrendingUp,
  Heart, Rocket, Target, CheckCircle,
  Bed, Hotel, Users, Star, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import ChatAgent from '../../components/common/ChatAgent';

// ============================================================
// COMPOSANT ROOM CARD
// ============================================================
const RoomCard = ({ room }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const disponible = room.est_disponible !== false;
  const statut = room.statut_disponibilite || {};
  const prochaine = room.prochaine_reservation;

  let messageBadge = 'Disponible';
  let badgeStyle = 'bg-green-500/95 text-white';
  if (!disponible) {
    badgeStyle = 'bg-red-600/95 text-white';
    messageBadge = statut.message || 'Occupée';
  } else if (prochaine) {
    badgeStyle = 'bg-yellow-500/95 text-white';
    messageBadge = `Libre jusqu'au ${new Date(prochaine.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`;
  }

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 transition-all duration-300 overflow-hidden group hover:shadow-xl hover:border-green-500">
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {room.photo_principale ? (
          <img
            src={room.photo_principale}
            alt={`Chambre ${room.numero}`}
            className={`object-cover w-full h-full transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Bed className="w-12 h-12 text-gray-400" />
          </div>
        )}

        <span className={`absolute top-3 left-3 px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-sm ${badgeStyle}`}>
          {messageBadge}
        </span>

        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all duration-300"
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            className={`w-5 h-5 transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
          />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              Chambre {room.numero}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {room.hotel_nom || 'Hôtel'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm ml-2">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="font-medium text-gray-900">4.5</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-4 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{room.hotel_ville || 'Madagascar'}</span>
        </div>

        <div className="flex items-center justify-between py-4 mb-4 border-t border-gray-100">
          <div>
            <div className="text-xl font-bold text-gray-900">
              {room.prix_nuit?.toLocaleString() || '0'} Ar
            </div>
            <div className="text-xs text-gray-500">par nuit</div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="font-medium">{room.capacite || 2} pers.</span>
          </div>
        </div>

        <Link
          to={`/chambres/${room.id}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all duration-300 group/btn"
        >
          <Bed className="w-4 h-4" />
          <span>Réserver</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT HOTEL CARD
// ============================================================
const HotelCard = ({ hotel }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 transition-all duration-300 overflow-hidden group hover:shadow-xl hover:border-blue-500">
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {hotel.photo_principale ? (
          <img
            src={hotel.photo_principale}
            alt={hotel.nom}
            className={`object-cover w-full h-full transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Hotel className="w-12 h-12 text-gray-400" />
          </div>
        )}

        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all duration-300"
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            className={`w-5 h-5 transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
          />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 truncate flex-1">
            {hotel.nom}
          </h3>
          <div className="flex items-center gap-1 text-sm ml-2">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="font-medium text-gray-900">
              {hotel.note_moyenne || '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-4 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{hotel.ville || 'Madagascar'}</span>
        </div>

        <div className="flex items-center justify-between py-4 mb-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Bed className="w-4 h-4" />
            <span className="font-medium">{hotel.nombre_chambres || 0} chambres</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            <span className="font-medium">Disponible</span>
          </div>
        </div>

        <Link
          to={`/hotels/${hotel.id}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-300 group/btn"
        >
          <Hotel className="w-4 h-4" />
          <span>Visiter</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function HomePage() {
  const [recentHotels, setRecentHotels] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animateText, setAnimateText] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotels, rooms] = await Promise.all([
          hotelService.getPopulaires(),
          roomService.getAvailable(),
        ]);
        setRecentHotels(hotels.results || hotels || []);
        setAvailableRooms(rooms.results || rooms || []);
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const timer = setTimeout(() => {
      setAnimateText(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-white">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-gray-600">Chargement...</p>
      </div>
    );
  }

  const totalHotels = recentHotels.length + 5;
  const totalRooms = availableRooms.length + 12;
  const totalClients = 450;

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================================ */}
      {/* HERO SECTION - Fond image d'hôtel avec overlay léger */}
      {/* ============================================================ */}
      <section className="relative py-24 overflow-hidden">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>

        {/* Overlay sombre pour lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/65 to-black/75"></div>

        <div className="container-custom relative px-4 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h1 className={`text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight transition-all duration-1000 ${animateText ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                Bienvenue sur
                <br />
                <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Reservation_HOTEL</span>
              </h1>
              <div className={`w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mb-8 transition-all duration-1000 delay-300 ${animateText ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}></div>
              <p className={`text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto font-light transition-all duration-1000 delay-500 ${animateText ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                Votre plateforme de réservation <span className="text-white font-medium">sécurisée, rapide et inspirante</span> à Madagascar
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Liste des avantages */}
              <div className={`space-y-6 transition-all duration-1000 delay-700 ${animateText ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="space-y-5 text-gray-200 text-lg">
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-all">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <span>Réservation <strong className="text-white font-semibold">100% sécurisée</strong> avec paiement Stripe</span>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-all">
                      <Rocket className="w-5 h-5 text-blue-400" />
                    </div>
                    <span>Confirmation <strong className="text-white font-semibold">ultra-rapide</strong> en temps réel</span>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500/30 transition-all">
                      <Heart className="w-5 h-5 text-pink-400" />
                    </div>
                    <span>Des hôtels <strong className="text-white font-semibold">soigneusement sélectionnés</strong> par nos experts</span>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-all">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <span>Une communauté de <strong className="text-white font-semibold">propriétaires passionnés</strong></span>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className={`transition-all duration-1000 delay-1200 ${animateText ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="grid grid-cols-1 gap-5">
                  <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                    <div className="text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">
                      {totalHotels}+
                    </div>
                    <p className="text-gray-200 font-medium">Hôtels partenaires</p>
                    <p className="text-gray-400 text-sm mt-1">Certifiés et vérifiés</p>
                  </div>
                  <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                    <div className="text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">
                      {totalRooms}+
                    </div>
                    <p className="text-gray-200 font-medium">Chambres disponibles</p>
                    <p className="text-gray-400 text-sm mt-1">Pour tous les budgets</p>
                  </div>
                  <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                    <div className="text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">
                      {totalClients}+
                    </div>
                    <p className="text-gray-200 font-medium">Clients satisfaits</p>
                    <p className="text-gray-400 text-sm mt-1">Actifs et engagés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION CHAMBRES */}
      {/* ============================================================ */}
      <section id="chambres" className="py-20 bg-white">
        <div className="container-custom px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Chambres Disponibles</h2>
            </div>
            <div className="w-16 h-1 bg-green-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez nos meilleures chambres disponibles à la réservation
            </p>
          </div>

          {availableRooms.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {availableRooms.slice(0, 12).map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white rounded-full">
                <Bed className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune chambre disponible</h3>
              <p className="text-gray-600 max-w-md mx-auto text-sm">
                Revenez bientôt pour découvrir nos nouvelles chambres !
              </p>
            </div>
          )}

          {availableRooms.length > 0 && (
            <div className="text-center mt-12">
              <Link
                to="/chambres"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all duration-300 group shadow-lg hover:shadow-xl"
              >
                <Bed className="w-5 h-5" />
                <span>Voir toutes les chambres</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION HÔTELS */}
      {/* ============================================================ */}
      <section id="hotels" className="py-20 bg-gray-50">
        <div className="container-custom px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Hôtels Populaires</h2>
            </div>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Les hôtels les mieux notés et les plus récents
            </p>
          </div>

          {recentHotels.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentHotels.slice(0, 8).map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                <Hotel className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun hôtel disponible</h3>
              <p className="text-gray-600 max-w-md mx-auto text-sm">
                De nouveaux hôtels arrivent bientôt.
              </p>
            </div>
          )}

          {recentHotels.length > 0 && (
            <div className="text-center mt-12">
              <Link
                to="/hotels"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-300 group shadow-lg hover:shadow-xl"
              >
                <Hotel className="w-5 h-5" />
                <span>Voir tous les hôtels</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* CALL-TO-ACTION */}
      {/* ============================================================ */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container-custom px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Prêt à réserver votre séjour ?
          </h2>
          <div className="w-16 h-1 bg-white mx-auto mb-6"></div>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-light">
            Rejoignez des milliers de voyageurs qui ont déjà réservé leur hébergement à Madagascar
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/chambres"
              className="flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-green-600 bg-white rounded-xl hover:bg-gray-100 transition-all duration-300 group shadow-lg hover:shadow-xl"
            >
              <Bed className="w-5 h-5" />
              <span>Réserver maintenant</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/register-proprio"
              className="flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              <Store className="w-5 h-5" />
              <span>Devenir propriétaire</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* AGENT IA - Ravorona */}
      {/* ============================================================ */}
      <ChatAgent />
    </div>
  );
}