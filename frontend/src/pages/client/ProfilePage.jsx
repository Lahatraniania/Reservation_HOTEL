import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, Lock, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/api/apiClient';
import Loader from '../../components/common/Loader';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    adresse: '',
    date_naissance: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/clients/me/');
      const data = response.data;
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        telephone: data.telephone || '',
        adresse: data.adresse || '',
        date_naissance: data.date_naissance || '',
      });
      if (data.photo_profil) {
        setProfileImagePreview(data.photo_profil);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      if (profileImage) {
        formDataToSend.append('photo_profil', profileImage);
      }

      await apiClient.put('/clients/me/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Profil mis à jour !');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader message="Chargement du profil..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/20 overflow-hidden flex items-center justify-center border-4 border-white/50">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12" />
                  )}
                </div>
                {editing && (
                  <label className="absolute bottom-0 right-0 p-1 bg-white rounded-full cursor-pointer hover:bg-gray-100 transition">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{formData.first_name} {formData.last_name}</h1>
                <p className="text-blue-100">@{user?.username}</p>
                <span className="inline-block mt-1 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {user?.role || 'Client'}
                </span>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Informations personnelles</h2>
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                {editing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {editing ? 'Annuler' : 'Modifier'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!editing}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editing}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    disabled={!editing}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    disabled={!editing}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="date_naissance"
                    type="date"
                    value={formData.date_naissance}
                    onChange={handleChange}
                    disabled={!editing}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {editing && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              )}
            </form>

            {/* Sécurité */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Sécurité
              </h3>
              <button
                onClick={logout}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;