import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserPlus, User, Mail, Lock, Phone, MapPin,
  Eye, EyeOff, AlertCircle, CheckCircle,
  Camera, Upload, X, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/api/apiClient';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Récupérer le message et l'URL de retour
  const returnTo = location.state?.returnTo || '/';
  const infoMessage = location.state?.message;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    telephone: '',
    adresse: ''
  });

  // ✅ États pour la photo de profil
  const [photoProfil, setPhotoProfil] = useState(null);
  const [photoProfilPreview, setPhotoProfilPreview] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Gérer les changements de champs texte
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // ✅ Gérer le changement de photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo ne doit pas dépasser 5 Mo');
      return;
    }

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setPhotoProfil(file);
    setPhotoProfilPreview(URL.createObjectURL(file));
  };

  // ✅ Supprimer la photo
  const removePhoto = () => {
    setPhotoProfil(null);
    setPhotoProfilPreview(null);
  };

  // ✅ Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ Utiliser FormData pour envoyer la photo
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('telephone', formData.telephone);
      formDataToSend.append('adresse', formData.adresse);

      // Ajouter la photo si présente
      if (photoProfil instanceof File) {
        formDataToSend.append('photo_profil', photoProfil);
      }

      console.log('📤 Envoi inscription...');

      const response = await apiClient.post('/auth/register/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('✅ Inscription réussie:', response.data);
      toast.success('Inscription réussie ! Connectez-vous pour continuer.');

      // ✅ Rediriger vers /login avec le returnTo
      navigate('/login', {
        state: {
          returnTo: returnTo,
          message: returnTo !== '/'
            ? 'Connectez-vous pour finaliser votre réservation'
            : 'Connectez-vous avec vos identifiants'
        }
      });
    } catch (err) {
      console.error('❌ Erreur inscription:', err);
      console.error('❌ Détails:', err.response?.data);

      // ✅ Extraire le message d'erreur correctement
      let errorMsg = 'Erreur lors de l\'inscription';
      const data = err.response?.data;

      if (data) {
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (typeof data === 'object') {
          // Afficher tous les champs d'erreur
          const errors = Object.entries(data)
            .map(([key, value]) => {
              const fieldName = {
                username: 'Nom d\'utilisateur',
                email: 'Email',
                password: 'Mot de passe',
                telephone: 'Téléphone',
                first_name: 'Prénom',
                last_name: 'Nom',
              }[key] || key;
              const msg = Array.isArray(value) ? value.join(', ') : value;
              return `${fieldName}: ${msg}`;
            })
            .join(' • ');
          errorMsg = errors || errorMsg;
        }
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        {/* ========== HEADER ========== */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Inscription Client</h2>
          <p className="mt-2 text-sm text-gray-600">Créez votre compte client Reservation_HOTEL</p>

          {/* Badge CLIENT */}
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Type de compte : Client</span>
          </div>
        </div>

        {/* ========== MESSAGE D'INFORMATION ========== */}
        {infoMessage && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-blue-900 font-semibold text-sm">{infoMessage}</p>
              <p className="text-blue-700 text-xs mt-1">
                Après inscription, vous serez redirigé vers la connexion.
              </p>
            </div>
          </div>
        )}

        {/* ========== ERREUR ========== */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* ========== PHOTO DE PROFIL ========== */}
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo de profil <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border-4 border-white shadow-lg">
                {photoProfilPreview ? (
                  <img
                    src={photoProfilPreview}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-10 h-10 text-gray-400" />
                )}
              </div>

              {/* Bouton d'upload (coin inférieur droit) */}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow-lg">
                <Upload className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>

              {/* Bouton supprimer (coin supérieur droit) */}
              {photoProfilPreview && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-lg"
                  title="Supprimer la photo"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              JPG ou PNG • Max 5 Mo
            </p>
          </div>

          {/* ========== PRÉNOM + NOM ========== */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Prénom"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Nom"
              />
            </div>
          </div>

          {/* ========== USERNAME ========== */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Choisissez un nom d'utilisateur"
              />
            </div>
          </div>

          {/* ========== EMAIL ========== */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          {/* ========== PASSWORD ========== */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10 pr-10"
                placeholder="Min 8 caractères"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* ========== TÉLÉPHONE ========== */}
          <div>
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                required
                value={formData.telephone}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="034 12 345 67"
              />
            </div>
          </div>

          {/* ========== ADRESSE ========== */}
          <div>
            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="adresse"
                name="adresse"
                type="text"
                value={formData.adresse}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Votre adresse"
              />
            </div>
          </div>

          {/* ========== BOUTON ========== */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Inscription...
              </div>
            ) : (
              'Créer mon compte client'
            )}
          </button>

          {/* ========== LIENS ========== */}
          <p className="text-center text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Se connecter
            </Link>
          </p>
          <p className="text-center text-sm text-gray-600">
            Vous voulez déposer un hôtel ?{' '}
            <Link to="/register-proprio" className="font-medium text-green-600 hover:text-green-500">
              Devenir propriétaire
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;