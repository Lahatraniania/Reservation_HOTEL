import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hotelService } from '../../services/api/hotelService';
import { Store, MapPin, Star, Users, Search, RefreshCw } from 'lucide-react';
import Loader from '../../components/common/Loader';

const HotelsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchHotels(); }, []);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const data = await hotelService.getAll();
      setHotels(data.results || data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.nom?.toLowerCase().includes(search.toLowerCase()) ||
    hotel.ville?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader message="Chargement des hôtels..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-8 h-8 text-blue-600" />
            Tous les hôtels
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher un hôtel..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 w-full sm:w-64" />
            </div>
            <button onClick={fetchHotels} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
          </div>
        </div>

        {filteredHotels.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">Aucun hôtel trouvé</h3>
            <p className="text-gray-500">Essayez de modifier votre recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHotels.map((hotel) => (
              <div key={hotel.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-500 relative">
                  {hotel.photo_principale ? (
                    <img src={hotel.photo_principale} alt={hotel.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Store className="w-16 h-16 text-white/50" /></div>
                  )}
                  {hotel.est_actif && <span className="absolute top-2 right-2 px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">✓ Actif</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 truncate">{hotel.nom}</h3>
                  <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                    <MapPin className="w-4 h-4" /><span>{hotel.ville}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-yellow-500" />
                      <span className="text-gray-700">{hotel.note_moyenne || 'Nouveau'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <Users className="w-4 h-4" /><span>{hotel.nombre_chambres || 0} chambres</span>
                    </div>
                  </div>
                  <Link to={`/hotels/${hotel.id}`} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Voir l'hôtel
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelsPage;