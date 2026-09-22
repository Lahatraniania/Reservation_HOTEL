import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roomService } from '../../services/api/roomService';
import { Bed, MapPin, Users, Search, RefreshCw, Star } from 'lucide-react';
import Loader from '../../components/common/Loader';

const ChambresPage = () => {
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchChambres(); }, []);

  const fetchChambres = async () => {
    setLoading(true);
    try {
      const data = await roomService.getAll();
      setChambres(data.results || data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChambres = chambres.filter(chambre =>
    chambre.numero?.toLowerCase().includes(search.toLowerCase()) ||
    chambre.hotel_nom?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader message="Chargement des chambres..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bed className="w-8 h-8 text-blue-600" />
            Toutes les chambres
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher une chambre..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 w-full sm:w-64" />
            </div>
            <button onClick={fetchChambres} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
          </div>
        </div>

        {filteredChambres.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Bed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">Aucune chambre trouvée</h3>
            <p className="text-gray-500">Essayez de modifier votre recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredChambres.map((chambre) => (
              <div key={chambre.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-500 to-green-500 relative">
                  {chambre.photo_principale ? (
                    <img src={chambre.photo_principale} alt={`Chambre ${chambre.numero}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Bed className="w-16 h-16 text-white/50" /></div>
                  )}
                  <span className="absolute top-2 right-2 px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">{chambre.type || 'Standard'}</span>
                  {chambre.est_disponible && <span className="absolute top-2 left-2 px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">Disponible</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900">Chambre {chambre.numero}</h3>
                  <p className="text-gray-600 text-sm">{chambre.hotel_nom}</p>
                  <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                    <MapPin className="w-4 h-4" /><span>{chambre.hotel_ville}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-yellow-500" /><span className="text-gray-700">4.5</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <Users className="w-4 h-4" /><span>{chambre.capacite || 2} pers.</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xl font-bold text-blue-600">
                      {chambre.prix_nuit?.toLocaleString()} Ar
                      <span className="text-sm font-normal text-gray-500">/nuit</span>
                    </span>
                    <Link to={`/chambres/${chambre.id}`} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold">
                      Réserver
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChambresPage;