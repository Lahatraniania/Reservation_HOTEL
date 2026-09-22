import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roomService } from '../../services/api/roomService';
import { hotelService } from '../../services/api/hotelService';
import { Bed, Camera, Upload, X, ArrowLeft, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import ConfirmModal from '../../components/common/ConfirmModal';

const ROOM_TYPES = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'SUPERIEUR', label: 'Supérieur' },
    { value: 'LUXE', label: 'Luxe' },
    { value: 'FAMILIALE', label: 'Familiale' },
    { value: 'SUITE', label: 'Suite' },
];

const EQUIPEMENTS = ['WiFi', 'Climatisation', 'TV', 'Mini-bar', 'Jacuzzi', 'Piscine', 'Restaurant', 'Parking'];

const RoomFormPage = () => {
    const { hotelId, roomId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hotel, setHotel] = useState(null);
    const [formData, setFormData] = useState({
        numero: '', type: 'STANDARD', prix_nuit: '', capacite: 2,
        surface: '', equipements: [], nb_lits_simples: 0,
        nb_lits_doubles: 1, est_disponible: true, est_actif: true,
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [existingPhoto, setExistingPhoto] = useState(null);

    // ✅ Modal de suppression
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, loading: false });

    useEffect(() => {
        fetchHotel();
        if (roomId) {
            fetchRoom();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotelId, roomId]);

    const fetchHotel = async () => {
        try {
            const data = await hotelService.getById(hotelId);
            setHotel(data);
        } catch (error) {
            toast.error('Erreur chargement hôtel');
        }
    };

    const fetchRoom = async () => {
        setLoading(true);
        try {
            const data = await roomService.getById(roomId);
            setFormData({
                numero: data.numero || '',
                type: data.type || 'STANDARD',
                prix_nuit: data.prix_nuit || '',
                capacite: data.capacite || 2,
                surface: data.surface || '',
                equipements: data.equipements || [],
                nb_lits_simples: data.nb_lits_simples || 0,
                nb_lits_doubles: data.nb_lits_doubles || 1,
                est_disponible: data.est_disponible !== undefined ? data.est_disponible : true,
                est_actif: data.est_actif !== undefined ? data.est_actif : true,
            });
            if (data.photo_principale) {
                setExistingPhoto(data.photo_principale);
            }
        } catch (error) {
            toast.error('Erreur chargement chambre');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleEquipementToggle = (equip) => {
        setFormData(prev => ({
            ...prev,
            equipements: prev.equipements.includes(equip)
                ? prev.equipements.filter(e => e !== equip)
                : [...prev.equipements, equip]
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
            setExistingPhoto(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('hotel', hotelId);
            formDataToSend.append('numero', formData.numero);
            formDataToSend.append('type', formData.type);
            formDataToSend.append('prix_nuit', formData.prix_nuit);
            formDataToSend.append('capacite', formData.capacite);
            if (formData.surface) formDataToSend.append('surface', formData.surface);
            formDataToSend.append('equipements', JSON.stringify(formData.equipements));
            formDataToSend.append('nb_lits_simples', formData.nb_lits_simples);
            formDataToSend.append('nb_lits_doubles', formData.nb_lits_doubles);
            formDataToSend.append('est_disponible', formData.est_disponible);
            formDataToSend.append('est_actif', formData.est_actif);

            if (photo instanceof File) {
                formDataToSend.append('photo_principale', photo);
            }

            if (roomId) {
                await roomService.update(roomId, formDataToSend);
                toast.success('✅ Chambre mise à jour !');
            } else {
                await roomService.create(formDataToSend);
                toast.success('✅ Chambre créée !');
            }
            navigate(`/proprio/hotel/${hotelId}`);
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

    // ✅ Ouvrir modal suppression
    const handleDelete = () => {
        setDeleteModal({ isOpen: true, loading: false });
    };

    const confirmDelete = async () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));
        try {
            await roomService.delete(roomId);
            toast.success('Chambre supprimée');
            navigate(`/proprio/hotel/${hotelId}`);
        } catch (error) {
            toast.error('Erreur');
            setDeleteModal({ isOpen: false, loading: false });
        }
    };

    if (loading) return <Loader message="Chargement..." />;

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container-custom max-w-3xl mx-auto">
                    <button
                        onClick={() => navigate(`/proprio/hotel/${hotelId}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour à l'hôtel
                    </button>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6">
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Bed className="w-6 h-6" />
                                {roomId ? 'Modifier la chambre' : 'Nouvelle chambre'}
                            </h1>
                            {hotel && <p className="text-white/90 mt-1">Hôtel: {hotel.nom}</p>}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* PHOTO */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo de la chambre</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-40 h-28 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                                        ) : existingPhoto ? (
                                            <img src={existingPhoto} alt="Chambre" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-10 h-10 text-gray-400" />
                                        )}
                                    </div>
                                    <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                                        <span className="flex items-center gap-2 text-sm text-gray-700">
                                            <Upload className="w-4 h-4" />
                                            Choisir
                                        </span>
                                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                    </label>
                                    {photo && (
                                        <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="text-red-500">
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* NUMÉRO + TYPE */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro *</label>
                                    <input name="numero" value={formData.numero} onChange={handleChange} required className="input-field" placeholder="101" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="input-field" required>
                                        {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* PRIX + CAPACITÉ + SURFACE */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix/nuit (Ar) *</label>
                                    <input name="prix_nuit" type="number" value={formData.prix_nuit} onChange={handleChange} required className="input-field" placeholder="50000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacité *</label>
                                    <input name="capacite" type="number" value={formData.capacite} onChange={handleChange} required className="input-field" min="1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Surface (m²)</label>
                                    <input name="surface" type="number" value={formData.surface} onChange={handleChange} className="input-field" placeholder="25" />
                                </div>
                            </div>

                            {/* LITS */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lits simples</label>
                                    <input name="nb_lits_simples" type="number" value={formData.nb_lits_simples} onChange={handleChange} className="input-field" min="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lits doubles</label>
                                    <input name="nb_lits_doubles" type="number" value={formData.nb_lits_doubles} onChange={handleChange} className="input-field" min="0" />
                                </div>
                            </div>

                            {/* ÉQUIPEMENTS */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Équipements</label>
                                <div className="flex flex-wrap gap-2">
                                    {EQUIPEMENTS.map(eq => (
                                        <button
                                            key={eq}
                                            type="button"
                                            onClick={() => handleEquipementToggle(eq)}
                                            className={`px-3 py-1 rounded-full text-sm transition ${formData.equipements.includes(eq)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {eq}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* STATUT */}
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" name="est_disponible" checked={formData.est_disponible} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                                    <span className="text-sm text-gray-700">Disponible</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" name="est_actif" checked={formData.est_actif} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                                    <span className="text-sm text-gray-700">Active</span>
                                </label>
                            </div>

                            {/* BOUTONS */}
                            <div className="flex gap-4 pt-4 border-t">
                                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition">
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Enregistrement...' : roomId ? 'Mettre à jour' : 'Créer la chambre'}
                                </button>
                                {roomId && (
                                    <button type="button" onClick={handleDelete} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* ✅ MODAL SUPPRESSION */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, loading: false })}
                onConfirm={confirmDelete}
                title="Supprimer cette chambre ?"
                message="Cette action est irréversible. Les réservations associées seront également affectées."
                details={`Chambre ${formData.numero} - ${formData.type}`}
                confirmText="Oui, supprimer"
                cancelText="Non, garder"
                type="danger"
                loading={deleteModal.loading}
            />
        </>
    );
};

export default RoomFormPage;