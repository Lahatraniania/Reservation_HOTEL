import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService } from '../../services/api/reservationService';
import {
    Calendar, User, Bell, CreditCard, Clock,
    CheckCircle, ArrowRight, Bed
} from 'lucide-react';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const DashboardClientPage = () => {
    const { user, unreadCount } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const data = await reservationService.getAll();
            setReservations(data.results || data || []);
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader message="Chargement de votre espace..." />;

    const stats = {
        total: reservations.length,
        confirmed: reservations.filter(r => r.statut === 'CONFIRMEE').length,
        pending: reservations.filter(r => r.statut === 'PAYEE' || r.statut === 'EN_ATTENTE').length,
        totalSpent: reservations
            .filter(r => r.statut === 'CONFIRMEE')
            .reduce((acc, r) => acc + parseFloat(r.montant_total || 0), 0),
    };

    const recentReservations = reservations.slice(0, 3);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container-custom">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Bonjour, {user?.username} !</h1>
                            <p className="text-blue-100">Bienvenue dans votre espace client</p>
                        </div>
                    </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Link to="/my-reservations" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <Calendar className="w-8 h-8 text-blue-600" />
                            <span className="text-2xl font-bold">{stats.total}</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">Réservations</p>
                    </Link>
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center justify-between">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <span className="text-2xl font-bold">{stats.confirmed}</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">Confirmées</p>
                    </div>
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center justify-between">
                            <Clock className="w-8 h-8 text-orange-600" />
                            <span className="text-2xl font-bold">{stats.pending}</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">En attente</p>
                    </div>
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center justify-between">
                            <CreditCard className="w-8 h-8 text-purple-600" />
                            <span className="text-xl font-bold">{stats.totalSpent.toLocaleString()} Ar</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">Total dépensé</p>
                    </div>
                </div>

                {/* LIENS RAPIDES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link
                        to="/my-reservations"
                        className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition flex items-center gap-4"
                    >
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Mes réservations</h3>
                            <p className="text-sm text-gray-500">Voir toutes mes réservations</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                    </Link>

                    <Link
                        to="/profile"
                        className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition flex items-center gap-4"
                    >
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Mon profil</h3>
                            <p className="text-sm text-gray-500">Modifier mes informations</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                    </Link>

                    <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Bell className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <p className="text-sm text-gray-500">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>

                {/* RÉSERVATIONS RÉCENTES */}
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Réservations récentes
                        </h2>
                        <Link to="/my-reservations" className="text-sm text-blue-600 hover:underline">
                            Voir tout →
                        </Link>
                    </div>

                    {recentReservations.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">Aucune réservation pour le moment</p>
                            <Link
                                to="/chambres"
                                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Réserver maintenant
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentReservations.map((res) => {
                                const room = res.chambre_details || res.chambre || {};
                                const hotel = res.hotel_details || res.hotel || {};
                                return (
                                    <Link
                                        key={res.id}
                                        to={`/chambres/${room.id}`}
                                        className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition"
                                    >
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0">
                                            {room.photo_principale ? (
                                                <img src={room.photo_principale} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Bed className="w-8 h-8 text-white/60" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{hotel.nom}</p>
                                            <p className="text-sm text-gray-500">
                                                Chambre {room.numero} • {res.date_debut} → {res.date_fin}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">
                                                {res.montant_total?.toLocaleString()} Ar
                                            </p>
                                            <p className="text-xs text-gray-400">{res.statut}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardClientPage;