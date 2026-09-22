import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserPlus, User, Mail, Lock, Phone, MapPin, Hotel,
  Building, AlertCircle, CheckCircle, Store,
  Eye, EyeOff, ArrowRight, Camera, Upload, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/api/apiClient';

const RegisterProprioPage = () => {
  const { register, login } = useAuth(); // ✅ Ajouter login
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '', telephone: '', adresse: '',
    hotel_nom: '', hotel_adresse: '', hotel_ville: '', hotel_telephone: '', hotel_email: '', hotel_description: '',
    acceptConditions: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [hotelPhoto, setHotelPhoto] = useState(null);
  const [hotelPhotoPreview, setHotelPhotoPreview] = useState(null);
  const [proprietairePhoto, setProprietairePhoto] = useState(null);
  const [proprietairePhotoPreview, setProprietairePhotoPreview] = useState(null);
  const [hotelPhotosSupp, setHotelPhotosSupp] = useState([]);
  const [hotelPhotosSuppPreviews, setHotelPhotosSuppPreviews] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    setError('');
  };

  const handleHotelPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHotelPhoto(file);
      setHotelPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleProprietairePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProprietairePhoto(file);
      setProprietairePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleHotelPhotosSuppChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setHotelPhotosSupp([...hotelPhotosSupp, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setHotelPhotosSuppPreviews([...hotelPhotosSuppPreviews, ...previews]);
    }
  };

  const removeHotelPhotoSupp = (index) => {
    setHotelPhotosSupp(hotelPhotosSupp.filter((_, i) => i !== index));
    setHotelPhotosSuppPreviews(hotelPhotosSuppPreviews.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.first_name || !formData.last_name || !formData.username ||
        !formData.email || !formData.password || !formData.telephone) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }
    }
    setStep(step + 1);
    setError('');
  };

  const handlePrev = () => setStep(step - 1);

  // RegisterProprioPage.jsx - handleSubmit corrigé

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.acceptConditions) {
      setError('Vous devez accepter les conditions générales');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Créer le compte utilisateur
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        telephone: formData.telephone,
        adresse: formData.adresse,
      });

      // 2. Connexion automatique
      await login({
        username: formData.username,
        password: formData.password
      });

      // 3. Créer la demande de placement
      const formDataToSend = new FormData();

      const hotelFields = {
        hotel_nom: formData.hotel_nom,
        hotel_adresse: formData.hotel_adresse,
        hotel_ville: formData.hotel_ville,
        hotel_telephone: formData.hotel_telephone,
        hotel_email: formData.hotel_email,
        hotel_description: formData.hotel_description || '',
      };

      Object.keys(hotelFields).forEach(key => {
        if (hotelFields[key]) {
          formDataToSend.append(key, hotelFields[key]);
        }
      });

      if (hotelPhoto) formDataToSend.append('hotel_photo', hotelPhoto);
      if (proprietairePhoto) formDataToSend.append('proprietaire_photo', proprietairePhoto);
      hotelPhotosSupp.forEach(photo => formDataToSend.append('hotel_photos_supp', photo));

      // ✅ MEILLEUR (laisse axios gérer le boundary)
      await apiClient.post('/demandes-placement/', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      toast.success('Inscription réussie ! Votre demande de placement a été envoyée.');
      navigate('/proprio');

    } catch (err) {
      console.error('❌ Erreur:', err);
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.error ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'Erreur lors de l\'inscription';
      setError(errorMsg);
      toast.error('Erreur d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
            <Store className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Devenir propriétaire</h2>
          <p className="mt-2 text-sm text-gray-600">Inscrivez-vous et déposez votre hôtel sur notre plateforme</p>
        </div>

        {/* Steps */}
        <div className="mt-8 flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  {s}
                </div>
                <span className="text-sm font-medium">{s === 1 ? 'Compte' : s === 2 ? 'Hôtel' : 'Validation'}</span>
              </div>
              {s < 3 && <div className="w-12 h-0.5 bg-gray-300"><div className={`h-full ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`}></div></div>}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* ÉTAPE 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input name="first_name" type="text" required value={formData.first_name} onChange={handleChange} className="input-field" placeholder="Prénom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input name="last_name" type="text" required value={formData.last_name} onChange={handleChange} className="input-field" placeholder="Nom" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="username" type="text" required value={formData.username} onChange={handleChange} className="input-field pl-10" placeholder="Choisissez un nom d'utilisateur" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="email" type="email" required value={formData.email} onChange={handleChange} className="input-field pl-10" placeholder="votre@email.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} className="input-field pl-10 pr-10" placeholder="Min 8 caractères" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="telephone" type="tel" required value={formData.telephone} onChange={handleChange} className="input-field pl-10" placeholder="034 12 345 67" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="adresse" type="text" value={formData.adresse} onChange={handleChange} className="input-field pl-10" placeholder="Votre adresse" />
                </div>
              </div>

              {/* Photo de profil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo de profil</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    {proprietairePhotoPreview ? (
                      <img src={proprietairePhotoPreview} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <Upload className="w-4 h-4" /> Choisir une photo
                    </span>
                    <input type="file" accept="image/*" onChange={handleProprietairePhotoChange} className="hidden" />
                  </label>
                </div>
              </div>

              <button type="button" onClick={handleNext} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Étape suivante <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ÉTAPE 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700"><CheckCircle className="w-4 h-4 inline mr-1" /> Remplissez les informations de votre hôtel</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'hôtel *</label>
                <div className="relative">
                  <Hotel className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="hotel_nom" type="text" required value={formData.hotel_nom} onChange={handleChange} className="input-field pl-10" placeholder="Nom de votre hôtel" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="hotel_adresse" type="text" required value={formData.hotel_adresse} onChange={handleChange} className="input-field pl-10" placeholder="Adresse complète" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="hotel_ville" type="text" required value={formData.hotel_ville} onChange={handleChange} className="input-field pl-10" placeholder="Ville" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="hotel_telephone" type="tel" required value={formData.hotel_telephone} onChange={handleChange} className="input-field pl-10" placeholder="034 12 345 67" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input name="hotel_email" type="email" required value={formData.hotel_email} onChange={handleChange} className="input-field pl-10" placeholder="contact@hotel.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="hotel_description" rows="3" value={formData.hotel_description} onChange={handleChange} className="input-field" placeholder="Décrivez votre hôtel..." />
              </div>

              {/* Photo principale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo principale de l'hôtel</label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-24 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                    {hotelPhotoPreview ? (
                      <img src={hotelPhotoPreview} alt="Hôtel" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                    <span className="flex items-center gap-2 text-sm text-gray-700"><Upload className="w-4 h-4" /> Choisir une photo</span>
                    <input type="file" accept="image/*" onChange={handleHotelPhotoChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Photos supplémentaires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photos supplémentaires</label>
                <div className="flex flex-wrap gap-3">
                  {hotelPhotosSuppPreviews.map((preview, index) => (
                    <div key={index} className="relative w-24 h-20 bg-gray-200 rounded-lg overflow-hidden">
                      <img src={preview} alt={`Hôtel ${index + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeHotelPhotoSupp(index)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="cursor-pointer w-24 h-20 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <input type="file" accept="image/*" multiple onChange={handleHotelPhotosSuppChange} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Ajoutez plusieurs photos de votre hôtel</p>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={handlePrev} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition">Retour</button>
                <button type="button" onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Étape suivante <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800">Récapitulatif</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><strong>Nom :</strong> {formData.first_name} {formData.last_name}</p>
                  <p><strong>Email :</strong> {formData.email}</p>
                  <p><strong>Téléphone :</strong> {formData.telephone}</p>
                  <p><strong>Hôtel :</strong> {formData.hotel_nom}</p>
                  <p><strong>Ville :</strong> {formData.hotel_ville}</p>
                  {hotelPhotoPreview && <p><strong>Photo hôtel :</strong> ✓ Ajoutée</p>}
                  {proprietairePhotoPreview && <p><strong>Photo profil :</strong> ✓ Ajoutée</p>}
                  {hotelPhotosSupp.length > 0 && <p><strong>Photos supplémentaires :</strong> {hotelPhotosSupp.length} photos</p>}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800">Conditions générales</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>À chaque réservation validée, 1% du montant est reversé à la plateforme</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Vous gérez vos chambres et vos réservations en toute autonomie</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Votre hôtel sera visible par tous les clients de la plateforme</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-start gap-3">
                <input id="acceptConditions" name="acceptConditions" type="checkbox" checked={formData.acceptConditions} onChange={handleChange} className="mt-1 h-4 w-4 text-blue-600 rounded" />
                <label htmlFor="acceptConditions" className="text-sm text-gray-700">
                  J'accepte les conditions générales et je comprends que 1% de commission sera prélevé sur chaque réservation validée.
                </label>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={handlePrev} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition">Retour</button>
                <button type="submit" disabled={loading || !formData.acceptConditions} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Inscription...
                    </div>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Créer mon compte propriétaire
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Vous avez déjà un compte ? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterProprioPage;