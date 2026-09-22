import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { hotelService } from '../../services/api/hotelService';
import { roomService } from '../../services/api/roomService';
import {
  Hotel, MapPin, Phone, Mail, Camera, Upload, X,
  ArrowLeft, Save, Trash2, Plus, Bed, Edit,
  Image as ImageIcon, Info, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import ConfirmModal from '../../components/common/ConfirmModal';

const HotelFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    nom: '', adresse: '', ville: '', pays: 'Madagascar',
    description: '', telephone: '', email_contact: '',
    est_actif: true, est_visible: true,
  });

  // ✅ PHOTO PRINCIPALE
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);

  // ✅ PHOTOS SUPPLÉMENTAIRES
  const [photosSupplementaires, setPhotosSupplementaires] = useState([]); // Nouvelles photos (File)
  const [photosPreviews, setPhotosPreviews] = useState([]);              // Previews nouvelles
  const [existingPhotosSupp, setExistingPhotosSupp] = useState([]);      // Existantes (URLs)

  // ✅ Modals de confirmation
  const [deleteHotelModal, setDeleteHotelModal] = useState({ isOpen: false, loading: false });
  const [deleteRoomModal, setDeleteRoomModal] = useState({ isOpen: false, roomId: null, loading: false });

  useEffect(() => {
    if (id) {
      fetchHotel();
      fetchRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ============================================================
  // ✅ CHARGEMENT DE L'HÔTEL
  // ============================================================
  const fetchHotel = async () => {
    setLoading(true);
    try {
      const data = await hotelService.getById(id);
      console.log('✅ Hôtel chargé:', data);

      setFormData({
        nom: data.nom || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        pays: data.pays || 'Madagascar',
        description: data.description || '',
        telephone: data.telephone || '',
        email_contact: data.email_contact || '',
        est_actif: data.est_actif !== undefined ? data.est_actif : true,
        est_visible: data.est_visible !== undefined ? data.est_visible : true,
      });

      if (data.photo_principale) {
        setExistingPhoto(data.photo_principale);
      }

      // ✅ Charger les photos supplémentaires existantes
      if (data.photos_supplementaires && Array.isArray(data.photos_supplementaires)) {
        setExistingPhotosSupp(data.photos_supplementaires);
        console.log(`📸 ${data.photos_supplementaires.length} photos supplémentaires chargées`);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await hotelService.getRooms(id);
      setRooms(data.results || data || []);
    } catch (error) {
      console.error('❌ Erreur chambres:', error);
    }
  };

  // ============================================================
  // ✅ HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  // ✅ Photo principale
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setExistingPhoto(null);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  // ✅ Photos supplémentaires - AJOUTER
  const handlePhotosSupplementairesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setPhotosSupplementaires([...photosSupplementaires, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setPhotosPreviews([...photosPreviews, ...previews]);
    }
    // ✅ Reset input pour permettre de re-sélectionner le même fichier
    e.target.value = '';
  };

  // ✅ Photos supplémentaires - SUPPRIMER (nouvelle)
  const removePhotoSupp = (index) => {
    setPhotosSupplementaires(photosSupplementaires.filter((_, i) => i !== index));
    setPhotosPreviews(photosPreviews.filter((_, i) => i !== index));
  };

  // ✅ Photos supplémentaires - SUPPRIMER (existante)
  const removeExistingPhotoSupp = (index) => {
    setExistingPhotosSupp(existingPhotosSupp.filter((_, i) => i !== index));
  };

  // ============================================================
  // ✅ SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataToSend = new FormData();

      // Champs textuels
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('adresse', formData.adresse);
      formDataToSend.append('ville', formData.ville);
      formDataToSend.append('telephone', formData.telephone);
      formDataToSend.append('email_contact', formData.email_contact);
      formDataToSend.append('pays', formData.pays);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('est_actif', formData.est_actif);
      formDataToSend.append('est_visible', formData.est_visible);

      // ✅ Photo principale
      if (photo instanceof File) {
        formDataToSend.append('photo_principale', photo);
      }

      // ✅ NOUVELLES photos supplémentaires (multiple)
      photosSupplementaires.forEach(file => {
        formDataToSend.append('photos_supplementaires', file);
      });

      // ✅ Photos supplémentaires EXISTANTES à conserver (JSON)
      // ⚠️ Important : TOUJOURS envoyer ce champ si on est en mode édition
      // pour permettre la synchronisation (ajout + suppression)
      if (id) {
        formDataToSend.append(
          'photos_supplementaires_existing',
          JSON.stringify(existingPhotosSupp)
        );
      }

      // ✅ Debug : afficher ce qui est envoyé
      console.log('📤 Données envoyées:');
      for (let pair of formDataToSend.entries()) {
        console.log(`  ${pair[0]}:`, pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]);
      }

      if (id) {
        await hotelService.update(id, formDataToSend);
        toast.success('✅ Hôtel mis à jour !');
        fetchHotel();
      } else {
        const created = await hotelService.create(formDataToSend);
        toast.success('✅ Hôtel créé !');
        navigate(`/proprio/hotel/${created.id}`);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      if (error.response?.data) {
        const errors = error.response.data;
        const errorMessages = Object.entries(errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(' | ');
        toast.error(errorMessages);
      } else {
        toast.error('Erreur lors de l\'enregistrement');
      }
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ✅ SUPPRESSION HÔTEL
  // ============================================================
  const handleDeleteHotel = () => {
    setDeleteHotelModal({ isOpen: true, loading: false });
  };

  const confirmDeleteHotel = async () => {
    setDeleteHotelModal(prev => ({ ...prev, loading: true }));
    try {
      await hotelService.delete(id);
      toast.success('Hôtel supprimé');
      navigate('/proprio');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      setDeleteHotelModal({ isOpen: false, loading: false });
    }
  };

  // ============================================================
  // ✅ SUPPRESSION CHAMBRE
  // ============================================================
  const handleDeleteRoom = (roomId) => {
    setDeleteRoomModal({ isOpen: true, roomId, loading: false });
  };

  const confirmDeleteRoom = async () => {
    setDeleteRoomModal(prev => ({ ...prev, loading: true }));
    try {
      await roomService.delete(deleteRoomModal.roomId);
      toast.success('Chambre supprimée');
      fetchRooms();
      setDeleteRoomModal({ isOpen: false, roomId: null, loading: false });
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      setDeleteRoomModal(prev => ({ ...prev, loading: false }));
    }
  };

  if (loading) return <Loader message="Chargement..." />;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/proprio')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </button>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Hotel className="w-6 h-6" />
                {id ? 'Modifier l\'hôtel' : 'Nouvel hôtel'}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* ============================================================ */}
              {/* PHOTO PRINCIPALE */}
              {/* ============================================================ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo principale *
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-40 h-28 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : existingPhoto ? (
                      <img src={existingPhoto} alt="Hôtel" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <Upload className="w-4 h-4" />
                      Choisir une photo
                    </span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  {photo && (
                    <button type="button" onClick={removePhoto} className="text-red-500 hover:text-red-700">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* ============================================================ */}
              {/* PHOTOS SUPPLÉMENTAIRES */}
              {/* ============================================================ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Photos supplémentaires
                    <span className="text-xs text-gray-500 font-normal">
                      ({existingPhotosSupp.length + photosPreviews.length} photo(s))
                    </span>
                  </label>
                </div>

                {/* Info */}
                <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Ajoutez plusieurs photos pour présenter votre hôtel.
                    Survolez une photo pour la supprimer.
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {/* ✅ Photos EXISTANTES */}
                  {existingPhotosSupp.map((url, index) => (
                    <div
                      key={`existing-${index}`}
                      className="relative w-28 h-24 bg-gray-200 rounded-lg overflow-hidden group shadow-sm"
                    >
                      <img src={url} alt={`Existante ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeExistingPhotoSupp(index)}
                          className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                          title="Supprimer cette photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-[10px] text-center py-0.5 font-semibold">
                        Existante
                      </span>
                    </div>
                  ))}

                  {/* ✅ NOUVELLES photos */}
                  {photosPreviews.map((preview, index) => (
                    <div
                      key={`new-${index}`}
                      className="relative w-28 h-24 bg-gray-200 rounded-lg overflow-hidden group shadow-sm"
                    >
                      <img src={preview} alt={`Nouvelle ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removePhotoSupp(index)}
                          className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                          title="Supprimer cette photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-[10px] text-center py-0.5 font-semibold">
                        Nouvelle
                      </span>
                    </div>
                  ))}

                  {/* ✅ Bouton d'ajout */}
                  <label className="cursor-pointer w-28 h-24 bg-gray-100 hover:bg-blue-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 transition group">
                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition" />
                    <span className="text-xs text-gray-500 mt-1 group-hover:text-blue-600 transition font-medium">
                      Ajouter
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosSupplementairesChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {(existingPhotosSupp.length + photosPreviews.length) > 0 && (
                  <div className="flex items-center gap-2 mt-3 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-gray-600">
                      <strong>{existingPhotosSupp.length}</strong> existante(s) +
                      <strong className="text-green-600"> {photosPreviews.length}</strong> nouvelle(s) =
                      <strong className="text-blue-600"> {existingPhotosSupp.length + photosPreviews.length}</strong> photo(s) au total
                    </span>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* NOM + VILLE */}
              {/* ============================================================ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Nom de l'hôtel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                  <input
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Ville"
                  />
                </div>
              </div>

              {/* ADRESSE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="Adresse"
                  />
                </div>
              </div>

              {/* PAYS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                <input
                  name="pays"
                  value={formData.pays}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* TÉLÉPHONE + EMAIL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      required
                      className="input-field pl-10"
                      placeholder="034 12 345 67"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="email_contact"
                      type="email"
                      value={formData.email_contact}
                      onChange={handleChange}
                      required
                      className="input-field pl-10"
                      placeholder="contact@hotel.com"
                    />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Décrivez votre hôtel..."
                />
              </div>

              {/* STATUT */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="est_actif"
                    checked={formData.est_actif}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Hôtel actif</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="est_visible"
                    checked={formData.est_visible}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Visible</span>
                </label>
              </div>

              {/* BOUTONS */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer l\'hôtel'}
                </button>
                {id && (
                  <button
                    type="button"
                    onClick={handleDeleteHotel}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ============================================================ */}
          {/* CHAMBRES */}
          {/* ============================================================ */}
          {id && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-blue-600" />
                  Chambres ({rooms.length})
                </h2>
                <Link
                  to={`/proprio/hotel/${id}/room/new`}
                  className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une chambre
                </Link>
              </div>

              {rooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bed className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune chambre pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rooms.map((room) => (
                    <div key={room.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Chambre {room.numero}</h3>
                          <p className="text-sm text-gray-600">{room.type}</p>
                          <p className="text-sm font-bold text-blue-600">
                            {room.prix_nuit?.toLocaleString()} Ar/nuit
                          </p>
                          <p className="text-xs text-gray-500">
                            {room.capacite} pers. • {room.surface || '?'}m²
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/proprio/hotel/${id}/room/${room.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL SUPPRESSION HÔTEL */}
      <ConfirmModal
        isOpen={deleteHotelModal.isOpen}
        onClose={() => setDeleteHotelModal({ isOpen: false, loading: false })}
        onConfirm={confirmDeleteHotel}
        title="Supprimer cet hôtel ?"
        message="Cette action est irréversible. Toutes les chambres et réservations associées seront également supprimées."
        details={`Hôtel : ${formData.nom}`}
        confirmText="Oui, supprimer"
        cancelText="Non, garder"
        type="danger"
        loading={deleteHotelModal.loading}
      />

      {/* ✅ MODAL SUPPRESSION CHAMBRE */}
      <ConfirmModal
        isOpen={deleteRoomModal.isOpen}
        onClose={() => setDeleteRoomModal({ isOpen: false, roomId: null, loading: false })}
        onConfirm={confirmDeleteRoom}
        title="Supprimer cette chambre ?"
        message="Cette action est irréversible. Toutes les réservations associées à cette chambre seront également affectées."
        confirmText="Oui, supprimer"
        cancelText="Non, garder"
        type="danger"
        loading={deleteRoomModal.loading}
      />
    </>
  );
};

export default HotelFormPage;